from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from src.common.paths import PROJECT_ROOT, project_path


FEATURES: tuple[str, ...] = (
    "case",
    "run",
    "time",
    "DOC",
    "feed",
    "material",
    "smcAC_mean",
    "smcDC_mean",
    "vib_table_mean",
    "vib_spindle_mean",
    "AE_table_mean",
    "AE_spindle_mean",
)
TARGET = "VB"
PREDICTION_COLUMN = "Predicted Tool Wear (VB)"


def load_params(path: str | Path = "params.yaml") -> dict[str, Any]:
    params_path = project_path(path)
    if not params_path.exists():
        raise FileNotFoundError(f"Training parameters were not found: {params_path}")
    with params_path.open("r", encoding="utf-8") as handle:
        loaded = yaml.safe_load(handle)
    if not isinstance(loaded, dict):
        raise ValueError(f"Expected a mapping in {params_path}")
    return loaded


def env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError as error:
        raise ValueError(f"{name} must be an integer") from error


@dataclass(frozen=True)
class RuntimeSettings:
    database_url: str
    model_metadata_path: Path
    production_model_path: Path
    drift_summary_path: Path
    lifecycle_path: Path
    pipeline_status_path: Path
    admin_token: str | None

    @classmethod
    def from_environment(cls) -> "RuntimeSettings":
        return cls(
            database_url=os.getenv(
                "DATABASE_URL", "sqlite:///./data/predictions.db"
            ),
            model_metadata_path=project_path(
                os.getenv("MODEL_METADATA_PATH", "models/model_metadata.json")
            ),
            production_model_path=project_path(
                os.getenv("PRODUCTION_MODEL_PATH", "models/xgboost_tool_wear.pkl")
            ),
            drift_summary_path=project_path(
                os.getenv(
                    "DRIFT_SUMMARY_PATH", "reports/drift/latest_summary.json"
                )
            ),
            lifecycle_path=project_path("artifacts/lifecycle_status.json"),
            pipeline_status_path=project_path("artifacts/pipeline_status.json"),
            admin_token=os.getenv("MLOPS_ADMIN_TOKEN") or None,
        )


@dataclass(frozen=True)
class TrackingSettings:
    tracking_uri: str
    experiment_name: str
    model_name: str

    @classmethod
    def from_environment(cls) -> "TrackingSettings":
        default_db = (PROJECT_ROOT / "mlflow.db").as_posix()
        return cls(
            tracking_uri=os.getenv(
                "MLFLOW_TRACKING_URI", f"sqlite:///{default_db}"
            ),
            experiment_name=os.getenv(
                "MLFLOW_EXPERIMENT_NAME", "tool-wear-regression"
            ),
            model_name=os.getenv("MLFLOW_MODEL_NAME", "tool-wear-regressor"),
        )


def classify_wear(prediction: float) -> str:
    if prediction < 0.2:
        return "Low wear"
    if prediction < 0.35:
        return "Medium wear"
    return "High wear"
