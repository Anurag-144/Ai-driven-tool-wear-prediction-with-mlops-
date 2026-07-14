from __future__ import annotations

import argparse
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import matplotlib
import mlflow
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

from src.common.config import FEATURES, TARGET, TrackingSettings, load_params
from src.common.paths import ARTIFACTS_DIR, PROJECT_ROOT, REPORTS_DIR, project_path
from src.data.validate import validate_dataframe
from src.training.registry import (
    configure_tracking,
    read_json,
    update_registry_validation,
)

matplotlib.use("Agg")
from matplotlib import pyplot as plt  # noqa: E402


def regression_metrics(actual: pd.Series, predicted: np.ndarray) -> dict[str, float]:
    metrics = {
        "mae": float(mean_absolute_error(actual, predicted)),
        "rmse": float(math.sqrt(mean_squared_error(actual, predicted))),
        "r2": float(r2_score(actual, predicted)),
    }
    if not all(math.isfinite(value) for value in metrics.values()):
        raise RuntimeError("Evaluation produced a non-finite metric.")
    return metrics


def evaluate_quality_gate(
    metrics: dict[str, float], quality_gates: dict[str, float | bool | None]
) -> dict[str, Any]:
    thresholds = {
        "max_mae": quality_gates.get("max_mae"),
        "max_rmse": quality_gates.get("max_rmse"),
        "min_r2": quality_gates.get("min_r2"),
    }
    configured = all(value is not None for value in thresholds.values())
    if not configured:
        return {
            "status": "not_configured",
            "passed": False,
            "thresholds": thresholds,
            "message": "Authoritative promotion thresholds have not been configured.",
        }

    passed = (
        metrics["mae"] <= float(thresholds["max_mae"])
        and metrics["rmse"] <= float(thresholds["max_rmse"])
        and metrics["r2"] >= float(thresholds["min_r2"])
    )
    return {
        "status": "passed" if passed else "failed",
        "passed": passed,
        "thresholds": thresholds,
        "message": "All configured thresholds passed."
        if passed
        else "One or more configured thresholds failed.",
    }


def save_plots(
    *,
    model: XGBRegressor,
    features: pd.DataFrame,
    actual: pd.Series,
    predicted: np.ndarray,
    output_directory: Path,
) -> list[Path]:
    output_directory.mkdir(parents=True, exist_ok=True)
    residuals = actual.to_numpy() - predicted

    importance_path = output_directory / "feature_importance.png"
    figure, axis = plt.subplots(figsize=(10, 6))
    axis.barh(list(FEATURES), model.feature_importances_)
    axis.set_title("XGBoost feature importance")
    axis.set_xlabel("Importance")
    figure.tight_layout()
    figure.savefig(importance_path, dpi=150)
    plt.close(figure)

    residual_path = output_directory / "residuals.png"
    figure, axis = plt.subplots(figsize=(8, 6))
    axis.scatter(predicted, residuals, alpha=0.75)
    axis.axhline(0, color="black", linewidth=1)
    axis.set_title("Residuals versus predicted tool wear")
    axis.set_xlabel("Predicted VB")
    axis.set_ylabel("Residual")
    figure.tight_layout()
    figure.savefig(residual_path, dpi=150)
    plt.close(figure)

    prediction_path = output_directory / "prediction_vs_actual.png"
    figure, axis = plt.subplots(figsize=(8, 6))
    axis.scatter(actual, predicted, alpha=0.75)
    lower = float(min(actual.min(), predicted.min()))
    upper = float(max(actual.max(), predicted.max()))
    axis.plot([lower, upper], [lower, upper], linestyle="--", color="black")
    axis.set_title("Predicted versus actual tool wear")
    axis.set_xlabel("Actual VB")
    axis.set_ylabel("Predicted VB")
    figure.tight_layout()
    figure.savefig(prediction_path, dpi=150)
    plt.close(figure)
    return [importance_path, residual_path, prediction_path]


def evaluate_candidate(
    params: dict[str, Any] | None = None,
    *,
    tracking_enabled: bool = True,
    test_path_override: Path | None = None,
    candidate_path_override: Path | None = None,
    output_directory: Path | None = None,
    manifest_path_override: Path | None = None,
    lifecycle_path_override: Path | None = None,
    pipeline_path_override: Path | None = None,
) -> dict[str, Any]:
    params = params or load_params()
    data_params = params["data"]
    model_params = params["model"]
    test_path = test_path_override or project_path(data_params["test_output"])
    candidate_path = candidate_path_override or project_path(
        model_params["candidate_output"]
    )
    report_directory = output_directory or REPORTS_DIR
    metrics_path = report_directory / "metrics.json"
    metadata_path = (
        output_directory / "model_metadata.json"
        if output_directory
        else ARTIFACTS_DIR / "model_metadata.json"
    )

    test_frame = pd.read_csv(test_path)
    validate_dataframe(test_frame, features=FEATURES, target=TARGET)
    model: XGBRegressor = joblib.load(candidate_path)
    predicted = model.predict(test_frame.loc[:, FEATURES])
    metrics = regression_metrics(test_frame[TARGET], predicted)
    plots = save_plots(
        model=model,
        features=test_frame.loc[:, FEATURES],
        actual=test_frame[TARGET],
        predicted=predicted,
        output_directory=report_directory,
    )

    metrics_path.parent.mkdir(parents=True, exist_ok=True)
    metrics_path.write_text(
        json.dumps(metrics, indent=2, sort_keys=True), encoding="utf-8"
    )

    manifest = read_json(
        manifest_path_override or ARTIFACTS_DIR / "training_run.json"
    )
    quality_gate = evaluate_quality_gate(metrics, params["quality_gates"])
    metadata: dict[str, Any] = {
        "model_name": manifest.get("model_name"),
        "model_version": manifest.get("model_version"),
        "mlflow_run_id": manifest.get("mlflow_run_id"),
        "experiment_id": manifest.get("experiment_id"),
        "dataset_hash": manifest.get("dataset_hash"),
        "git_commit": manifest.get("git_commit"),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "features": list(FEATURES),
        "target": TARGET,
        "metrics": metrics,
        "quality_gate": quality_gate,
        "status": "candidate",
        "candidate_model_path": manifest.get("candidate_model_path"),
    }
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text(
        json.dumps(metadata, indent=2, sort_keys=True), encoding="utf-8"
    )

    if tracking_enabled:
        tracking = TrackingSettings.from_environment()
        configure_tracking(tracking)
        run_id = metadata.get("mlflow_run_id")
        model_version = metadata.get("model_version")
        if not run_id or not model_version:
            raise RuntimeError("MLflow run or candidate model version is missing.")
        with mlflow.start_run(run_id=str(run_id)):
            mlflow.log_metrics(metrics)
            mlflow.log_dict(metadata, "model_metadata.json")
            mlflow.log_artifact(metrics_path)
            for plot in plots:
                mlflow.log_artifact(plot)
        update_registry_validation(
            model_name=tracking.model_name,
            model_version=str(model_version),
            quality_status=str(quality_gate["status"]),
            metrics=metrics,
        )

    lifecycle_path = lifecycle_path_override or ARTIFACTS_DIR / "lifecycle_status.json"
    lifecycle_path.parent.mkdir(parents=True, exist_ok=True)
    previous_lifecycle: dict[str, Any] = {}
    if lifecycle_path.exists():
        try:
            previous_lifecycle = json.loads(
                lifecycle_path.read_text(encoding="utf-8")
            )
        except json.JSONDecodeError:
            previous_lifecycle = {}
    lifecycle = {
        "current_champion": previous_lifecycle.get("current_champion"),
        "latest_candidate": {
            "model_version": metadata["model_version"],
            "run_id": metadata["mlflow_run_id"],
            "quality_gate": quality_gate["status"],
            "trained_at": metadata["trained_at"],
        },
        "last_training_run": {
            "status": "completed",
            "run_id": metadata["mlflow_run_id"],
            "completed_at": metadata["trained_at"],
        },
        "last_promotion": previous_lifecycle.get("last_promotion"),
    }
    lifecycle_path.write_text(
        json.dumps(lifecycle, indent=2, sort_keys=True), encoding="utf-8"
    )

    pipeline_status = {
        "updated_at": metadata["trained_at"],
        "training": "completed",
        "evaluation": "completed",
        "registry": "candidate_registered" if tracking_enabled else "not_run",
        "deployment": "not_promoted",
    }
    pipeline_path = pipeline_path_override or ARTIFACTS_DIR / "pipeline_status.json"
    pipeline_path.parent.mkdir(parents=True, exist_ok=True)
    pipeline_path.write_text(
        json.dumps(pipeline_status, indent=2, sort_keys=True), encoding="utf-8"
    )
    return metadata


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate a candidate model.")
    parser.add_argument("--params", default="params.yaml")
    parser.add_argument("--no-mlflow", action="store_true")
    args = parser.parse_args()
    metadata = evaluate_candidate(
        load_params(args.params), tracking_enabled=not args.no_mlflow
    )
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
