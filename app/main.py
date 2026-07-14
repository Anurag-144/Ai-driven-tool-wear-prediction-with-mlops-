from __future__ import annotations

import hmac
import logging
import math
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Any

import joblib
import numpy as np
from fastapi import FastAPI, Header, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from src.common.config import FEATURES, PREDICTION_COLUMN, RuntimeSettings, classify_wear
from src.common.metadata import load_model_metadata, load_safe_json
from src.monitoring.database import PredictionDatabase
from src.monitoring.metrics import (
    latency_series,
    monitoring_summary,
    prediction_distribution,
    update_feedback,
)


logger = logging.getLogger("toolwear.api")


class ToolWearInput(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    case: int
    run: int
    time: float
    DOC: float
    feed: float
    material: int
    smcAC_mean: float
    smcDC_mean: float
    vib_table_mean: float
    vib_spindle_mean: float
    AE_table_mean: float
    AE_spindle_mean: float


class ActualWearFeedback(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    actual_wear: float = Field(ge=0)


def create_app(
    *,
    settings_override: RuntimeSettings | None = None,
    database_override: PredictionDatabase | None = None,
    model_override: Any | None = None,
) -> FastAPI:
    settings = settings_override or RuntimeSettings.from_environment()
    database = database_override or PredictionDatabase(settings.database_url)

    loaded_model = model_override
    model_load_error: str | None = None
    if loaded_model is None:
        try:
            loaded_model = joblib.load(settings.production_model_path)
        except Exception as error:
            model_load_error = type(error).__name__
            logger.exception("Failed to load the production model")

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        try:
            database.initialize()
            application.state.database_initialized = True
        except Exception:
            application.state.database_initialized = False
            logger.exception("Prediction database initialization failed")
        yield

    application = FastAPI(
        title="ToolWear AI API",
        version="2.0.0",
        lifespan=lifespan,
    )
    application.state.settings = settings
    application.state.database = database
    application.state.database_initialized = False
    application.state.model = loaded_model
    application.state.model_load_error = model_load_error

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )

    @application.get("/")
    def home() -> dict[str, str]:
        return {"message": "Tool Wear Prediction API is running"}

    @application.get("/health")
    def health() -> dict[str, Any]:
        metadata = load_model_metadata(settings.model_metadata_path)
        return {
            "status": "ok" if application.state.model is not None else "degraded",
            "model_loaded": application.state.model is not None,
            "database_connected": database.is_connected(),
            "model_version": metadata.get("model_version"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    @application.get("/model-info")
    def model_info() -> dict[str, Any]:
        return load_model_metadata(settings.model_metadata_path)

    @application.post("/predict")
    def predict(data: ToolWearInput, response: Response) -> dict[str, float]:
        request_id = str(uuid.uuid4())
        response.headers["X-Request-ID"] = request_id
        feature_values = data.model_dump()
        metadata = load_model_metadata(settings.model_metadata_path)
        started = time.perf_counter()

        if application.state.model is None:
            latency_ms = (time.perf_counter() - started) * 1000
            _log_prediction_safely(
                database=database,
                request_id=request_id,
                features=feature_values,
                prediction=None,
                wear_status=None,
                latency_ms=latency_ms,
                request_success=False,
                model_metadata=metadata,
                error_type=application.state.model_load_error or "ModelUnavailable",
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The prediction model is unavailable.",
            )

        try:
            feature_array = np.array(
                [[feature_values[feature] for feature in FEATURES]], dtype=float
            )
            prediction = float(application.state.model.predict(feature_array)[0])
            if not math.isfinite(prediction):
                raise ValueError("The model returned a non-finite prediction.")
        except Exception as error:
            latency_ms = (time.perf_counter() - started) * 1000
            _log_prediction_safely(
                database=database,
                request_id=request_id,
                features=feature_values,
                prediction=None,
                wear_status=None,
                latency_ms=latency_ms,
                request_success=False,
                model_metadata=metadata,
                error_type=type(error).__name__,
            )
            logger.exception("Model inference failed for request %s", request_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Prediction failed.",
            ) from error

        latency_ms = (time.perf_counter() - started) * 1000
        wear_status = classify_wear(prediction)
        _log_prediction_safely(
            database=database,
            request_id=request_id,
            features=feature_values,
            prediction=prediction,
            wear_status=wear_status,
            latency_ms=latency_ms,
            request_success=True,
            model_metadata=metadata,
        )
        return {PREDICTION_COLUMN: prediction}

    @application.get("/monitoring/summary")
    def summary() -> dict[str, Any]:
        return monitoring_summary(database)

    @application.get("/monitoring/latency")
    def latency() -> dict[str, Any]:
        return latency_series(database)

    @application.get("/monitoring/prediction-distribution")
    def distribution() -> dict[str, Any]:
        return prediction_distribution(database)

    @application.get("/monitoring/drift/latest")
    def latest_drift() -> dict[str, Any]:
        return load_safe_json(
            settings.drift_summary_path,
            {
                "status": "insufficient_data",
                "generated_at": None,
                "current_sample_count": 0,
                "minimum_current_samples": None,
                "dataset_drift_detected": None,
                "drifted_feature_count": None,
                "features": [],
                "message": "No drift report has been generated.",
            },
        )

    @application.get("/monitoring/lifecycle")
    def lifecycle() -> dict[str, Any]:
        return load_safe_json(
            settings.lifecycle_path,
            {
                "status": "unavailable",
                "current_champion": None,
                "latest_candidate": None,
                "last_training_run": None,
                "last_promotion": None,
            },
        )

    @application.get("/monitoring/pipeline")
    def pipeline() -> dict[str, Any]:
        return load_safe_json(
            settings.pipeline_status_path,
            {
                "status": "unavailable",
                "updated_at": None,
                "training": "unavailable",
                "evaluation": "unavailable",
                "registry": "unavailable",
                "deployment": "unavailable",
            },
        )

    @application.post("/monitoring/feedback/{prediction_id}")
    def feedback(
        prediction_id: int,
        feedback_data: ActualWearFeedback,
        admin_token: Annotated[str | None, Header(alias="X-Admin-Token")] = None,
    ) -> dict[str, Any]:
        if settings.admin_token and not (
            admin_token
            and hmac.compare_digest(settings.admin_token, admin_token)
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="A valid monitoring admin token is required.",
            )
        updated = update_feedback(
            database, prediction_id, feedback_data.actual_wear
        )
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prediction record not found.",
            )
        return updated

    return application


def _log_prediction_safely(
    *,
    database: PredictionDatabase,
    request_id: str,
    features: dict[str, float | int],
    prediction: float | None,
    wear_status: str | None,
    latency_ms: float,
    request_success: bool,
    model_metadata: dict[str, Any],
    error_type: str | None = None,
) -> None:
    try:
        database.add_prediction(
            request_id=request_id,
            features=features,
            prediction=prediction,
            wear_status=wear_status,
            latency_ms=latency_ms,
            request_success=request_success,
            model_metadata=model_metadata,
            error_type=error_type,
        )
    except Exception:
        logger.exception(
            "Prediction logging failed for request %s; inference response is preserved",
            request_id,
        )


app = create_app()
