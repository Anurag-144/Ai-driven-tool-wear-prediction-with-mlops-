from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import mlflow
import mlflow.xgboost
import pandas as pd
from mlflow import MlflowClient
from mlflow.models import infer_signature
from xgboost import XGBRegressor

from src.common.config import TrackingSettings


def configure_tracking(settings: TrackingSettings) -> str:
    mlflow.set_tracking_uri(settings.tracking_uri)
    experiment = mlflow.set_experiment(settings.experiment_name)
    return str(experiment.experiment_id)


def log_and_register_candidate(
    *,
    model: XGBRegressor,
    model_name: str,
    sample: pd.DataFrame,
    predictions: Any,
) -> str:
    """Log a model using MLflow 3 APIs and mark its registry version candidate."""
    signature = infer_signature(sample, predictions)
    mlflow.xgboost.log_model(
        xgb_model=model,
        name="model",
        signature=signature,
        input_example=sample.head(3),
        registered_model_name=model_name,
    )

    run = mlflow.active_run()
    if run is None:
        raise RuntimeError("MLflow model registration requires an active run.")

    client = MlflowClient()
    versions = [
        version
        for version in client.search_model_versions(f"name='{model_name}'")
        if version.run_id == run.info.run_id
    ]
    if not versions:
        raise RuntimeError(
            "MLflow did not create a registry version. Confirm that the tracking "
            "URI uses a database-backed store."
        )
    latest = max(versions, key=lambda version: int(version.version))
    client.set_registered_model_alias(model_name, "candidate", latest.version)
    client.set_model_version_tag(
        model_name, latest.version, "validation_status", "pending"
    )
    return str(latest.version)


def update_registry_validation(
    *,
    model_name: str,
    model_version: str,
    quality_status: str,
    metrics: dict[str, float],
) -> None:
    client = MlflowClient()
    client.set_model_version_tag(
        model_name, model_version, "validation_status", quality_status
    )
    for name, value in metrics.items():
        client.set_model_version_tag(
            model_name, model_version, f"metric.{name}", f"{value:.12g}"
        )


def read_json(path: Path) -> dict[str, Any]:
    try:
        loaded = json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Required registry metadata is unavailable: {path}") from error
    if not isinstance(loaded, dict):
        raise RuntimeError(f"Expected a JSON object in {path}")
    return loaded
