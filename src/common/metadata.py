from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from src.common.config import FEATURES


MODEL_INFO_FIELDS: tuple[str, ...] = (
    "model_name",
    "model_version",
    "mlflow_run_id",
    "dataset_hash",
    "trained_at",
    "features",
    "metrics",
)


def unavailable_model_metadata() -> dict[str, Any]:
    return {
        "status": "unavailable",
        "model_name": None,
        "model_version": None,
        "mlflow_run_id": None,
        "dataset_hash": None,
        "trained_at": None,
        "features": list(FEATURES),
        "metrics": {},
    }


def load_model_metadata(path: Path) -> dict[str, Any]:
    if not path.exists():
        return unavailable_model_metadata()
    try:
        loaded = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return unavailable_model_metadata()
    if not isinstance(loaded, dict):
        return unavailable_model_metadata()
    metadata = unavailable_model_metadata()
    metadata.update({field: loaded.get(field) for field in MODEL_INFO_FIELDS})
    metadata["status"] = "available"
    if not isinstance(metadata.get("features"), list):
        metadata["features"] = list(FEATURES)
    if not isinstance(metadata.get("metrics"), dict):
        metadata["metrics"] = {}
    return metadata


def load_safe_json(path: Path, unavailable: dict[str, Any]) -> dict[str, Any]:
    try:
        loaded = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return unavailable
    return loaded if isinstance(loaded, dict) else unavailable
