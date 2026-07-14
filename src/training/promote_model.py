from __future__ import annotations

import json
import math
import shutil
from datetime import datetime, timezone
from pathlib import Path
from collections.abc import Mapping
from typing import Any

import joblib
import pandas as pd
from mlflow import MlflowClient

from src.common.config import FEATURES, TrackingSettings, load_params
from src.common.paths import ARTIFACTS_DIR, MODELS_DIR, PROJECT_ROOT, project_path
from src.data.validate import validate_dataframe
from src.training.registry import configure_tracking, read_json


def compare_with_champion(
    candidate_metrics: Mapping[str, Any], champion_metrics: Mapping[str, Any]
) -> dict[str, Any]:
    names = ("mae", "rmse", "r2")
    if not all(
        isinstance(candidate_metrics.get(name), (int, float))
        and math.isfinite(float(candidate_metrics[name]))
        for name in names
    ):
        raise RuntimeError("Candidate metrics are missing or non-finite.")
    if not all(
        isinstance(champion_metrics.get(name), (int, float))
        and math.isfinite(float(champion_metrics[name]))
        for name in names
    ):
        return {
            "status": "unavailable",
            "passed": None,
            "message": "The current champion has no verified comparison metrics.",
        }

    deltas = {
        name: float(candidate_metrics[name]) - float(champion_metrics[name])
        for name in names
    }
    passed = deltas["mae"] <= 0 and deltas["rmse"] <= 0 and deltas["r2"] >= 0
    return {
        "status": "passed" if passed else "failed",
        "passed": passed,
        "candidate_metrics": {name: float(candidate_metrics[name]) for name in names},
        "champion_metrics": {name: float(champion_metrics[name]) for name in names},
        "deltas": deltas,
        "message": (
            "Candidate is no worse than the champion on MAE, RMSE, and R2."
            if passed
            else "Candidate is worse than the champion on one or more metrics."
        ),
    }


def promote_candidate(candidate_version: str, *, approve: bool) -> dict[str, Any]:
    if not approve:
        raise RuntimeError("Promotion requires the explicit --approve flag.")

    params = load_params()
    metadata = read_json(ARTIFACTS_DIR / "model_metadata.json")
    if str(metadata.get("model_version")) != str(candidate_version):
        raise RuntimeError("The requested version does not match local candidate metadata.")
    if metadata.get("features") != list(FEATURES):
        raise RuntimeError("Candidate feature schema is incompatible with production.")

    metrics_path = PROJECT_ROOT / "reports" / "metrics.json"
    metrics = read_json(metrics_path)
    if metrics != metadata.get("metrics"):
        raise RuntimeError("Candidate metrics do not match model metadata.")

    quality_gate = metadata.get("quality_gate")
    if not isinstance(quality_gate, dict) or not quality_gate.get("passed"):
        status = quality_gate.get("status") if isinstance(quality_gate, dict) else None
        raise RuntimeError(
            "Promotion quality gate has not passed. Current status: "
            f"{status or 'unavailable'}."
        )

    production_metadata_path = MODELS_DIR / "model_metadata.json"
    current_production_metadata = read_json(production_metadata_path)
    current_metrics = current_production_metadata.get("metrics")
    champion_comparison = compare_with_champion(
        metrics,
        current_metrics if isinstance(current_metrics, dict) else {},
    )
    if champion_comparison.get("passed") is False:
        raise RuntimeError(str(champion_comparison["message"]))

    candidate_path = project_path(str(metadata.get("candidate_model_path")))
    if not candidate_path.exists():
        raise RuntimeError(f"Candidate model artifact is missing: {candidate_path}")
    reference_path = project_path(params["data"]["reference_output"])
    reference = pd.read_csv(reference_path)
    validate_dataframe(reference, features=FEATURES)
    candidate_model = joblib.load(candidate_path)
    smoke_value = float(candidate_model.predict(reference.loc[:, FEATURES].head(1))[0])
    if not math.isfinite(smoke_value):
        raise RuntimeError("Candidate model smoke test failed.")

    tracking = TrackingSettings.from_environment()
    configure_tracking(tracking)
    client = MlflowClient()
    registry_version = client.get_model_version(tracking.model_name, candidate_version)
    if registry_version.run_id != metadata.get("mlflow_run_id"):
        raise RuntimeError("Registry version does not match the candidate MLflow run.")

    timestamp = datetime.now(timezone.utc)
    timestamp_slug = timestamp.strftime("%Y%m%dT%H%M%SZ")
    production_path = project_path(params["model"]["production_output"])
    if not production_path.exists():
        raise RuntimeError("The current production model is unavailable; refusing promotion.")
    rollback_directory = ARTIFACTS_DIR / "rollback"
    rollback_directory.mkdir(parents=True, exist_ok=True)
    rollback_path = rollback_directory / f"xgboost_tool_wear_{timestamp_slug}.pkl"
    shutil.copy2(production_path, rollback_path)
    shutil.copy2(candidate_path, production_path)

    champion_metadata = {
        **metadata,
        "status": "champion",
        "promoted_at": timestamp.isoformat(),
        "champion_comparison": champion_comparison,
        "rollback_model_path": str(rollback_path.relative_to(PROJECT_ROOT)),
    }
    production_metadata_path.write_text(
        json.dumps(champion_metadata, indent=2, sort_keys=True), encoding="utf-8"
    )
    client.set_registered_model_alias(
        tracking.model_name, "champion", candidate_version
    )
    client.set_model_version_tag(
        tracking.model_name, candidate_version, "validation_status", "promoted"
    )

    audit_entry = {
        "timestamp": timestamp.isoformat(),
        "action": "promote",
        "model_name": tracking.model_name,
        "model_version": candidate_version,
        "mlflow_run_id": metadata.get("mlflow_run_id"),
        "production_path": str(production_path.relative_to(PROJECT_ROOT)),
        "rollback_path": str(rollback_path.relative_to(PROJECT_ROOT)),
        "champion_comparison": champion_comparison,
    }
    audit_path = ARTIFACTS_DIR / "promotion_audit.jsonl"
    with audit_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(audit_entry, sort_keys=True) + "\n")

    lifecycle_path = ARTIFACTS_DIR / "lifecycle_status.json"
    lifecycle = read_json(lifecycle_path)
    lifecycle["current_champion"] = {
        "model_version": candidate_version,
        "run_id": metadata.get("mlflow_run_id"),
        "promoted_at": timestamp.isoformat(),
    }
    lifecycle["last_promotion"] = {
        "status": "approved",
        "model_version": candidate_version,
        "timestamp": timestamp.isoformat(),
    }
    lifecycle_path.write_text(
        json.dumps(lifecycle, indent=2, sort_keys=True), encoding="utf-8"
    )
    return audit_entry
