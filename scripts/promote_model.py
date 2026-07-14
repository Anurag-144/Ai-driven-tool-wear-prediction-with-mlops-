from __future__ import annotations

import argparse
import hashlib
import json
import os
import pickle
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import mlflow
from mlflow import MlflowClient


FEATURES = [
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
]

REQUIRED_METRICS = ("mae", "rmse", "r2")


def calculate_sha256(file_path: Path) -> str:
    """Calculate the SHA-256 hash of a file."""
    digest = hashlib.sha256()

    with file_path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def mlflow_time_to_iso(timestamp_ms: int | None) -> str:
    """Convert MLflow's millisecond timestamp into UTC ISO format."""
    if timestamp_ms is None:
        raise ValueError("The MLflow run does not contain a training timestamp.")

    timestamp = datetime.fromtimestamp(
        timestamp_ms / 1000,
        tz=timezone.utc,
    )

    return timestamp.isoformat().replace("+00:00", "Z")


def load_registered_model(model_uri: str) -> Any:
    """
    Load the registered model.

    The training pipeline may have logged it using either the XGBoost
    or sklearn MLflow flavor.
    """
    xgboost_error: Exception | None = None

    try:
        return mlflow.xgboost.load_model(model_uri)
    except Exception as error:
        xgboost_error = error

    try:
        return mlflow.sklearn.load_model(model_uri)
    except Exception as sklearn_error:
        raise RuntimeError(
            "The registered model could not be loaded using either the "
            "MLflow XGBoost or sklearn flavor.\n"
            f"XGBoost error: {xgboost_error}\n"
            f"Sklearn error: {sklearn_error}"
        ) from sklearn_error


def write_json_atomically(path: Path, data: dict[str, Any]) -> None:
    """Write JSON without leaving a partially written metadata file."""
    temporary_path = path.with_suffix(path.suffix + ".tmp")

    with temporary_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)
        file.write("\n")

    temporary_path.replace(path)


def backup_file(path: Path) -> None:
    """Create a backup before replacing a production file."""
    if path.exists():
        backup_path = path.with_suffix(path.suffix + ".bak")
        shutil.copy2(path, backup_path)
        print(f"Backup created: {backup_path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Promote an MLflow model version and generate metadata."
    )

    parser.add_argument(
        "--version",
        required=True,
        help="MLflow registered-model version, for example 4.",
    )
    parser.add_argument(
        "--registry-model-name",
        default=os.getenv("MLFLOW_MODEL_NAME", "tool-wear-regressor"),
        help="Registered MLflow model name.",
    )
    parser.add_argument(
        "--tracking-uri",
        default=os.getenv("MLFLOW_TRACKING_URI"),
        help="MLflow tracking server URI.",
    )
    parser.add_argument(
        "--model-output",
        default="models/xgboost_tool_wear.pkl",
        help="Production pickle output path.",
    )
    parser.add_argument(
        "--metadata-output",
        default="models/model_metadata.json",
        help="Metadata JSON output path.",
    )

    args = parser.parse_args()

    if args.tracking_uri:
        mlflow.set_tracking_uri(args.tracking_uri)

    client = MlflowClient()

    print(
        f"Reading {args.registry_model_name} version {args.version} "
        "from MLflow..."
    )

    model_version = client.get_model_version(
        name=args.registry_model_name,
        version=str(args.version),
    )

    if str(model_version.status).upper() != "READY":
        raise RuntimeError(
            f"Model version is not ready. Current status: {model_version.status}"
        )

    run_id = model_version.run_id
    if not run_id:
        raise RuntimeError(
            "The registered model version does not contain a source run ID."
        )

    run = client.get_run(run_id)

    if str(run.info.status).upper() != "FINISHED":
        raise RuntimeError(
            f"The source run is not finished. Current status: {run.info.status}"
        )

    missing_metrics = [
        metric
        for metric in REQUIRED_METRICS
        if metric not in run.data.metrics
    ]

    if missing_metrics:
        raise RuntimeError(
            "The MLflow run is missing required metrics: "
            + ", ".join(missing_metrics)
        )

    dataset_hash = (
        run.data.tags.get("dataset_hash")
        or run.data.params.get("dataset_hash")
    )

    if not dataset_hash:
        raise RuntimeError(
            "The MLflow run does not contain a dataset_hash tag or parameter."
        )

    model_uri = (
        f"models:/{args.registry_model_name}/{model_version.version}"
    )

    print(f"Loading model from {model_uri}...")
    promoted_model = load_registered_model(model_uri)

    model_output = Path(args.model_output)
    metadata_output = Path(args.metadata_output)

    model_output.parent.mkdir(parents=True, exist_ok=True)
    metadata_output.parent.mkdir(parents=True, exist_ok=True)

    backup_file(model_output)
    backup_file(metadata_output)

    temporary_model = model_output.with_suffix(model_output.suffix + ".tmp")

    with temporary_model.open("wb") as file:
        pickle.dump(promoted_model, file)

    temporary_model.replace(model_output)

    artifact_hash = calculate_sha256(model_output)

    trained_timestamp = (
        run.info.start_time
        if run.info.start_time is not None
        else run.info.end_time
    )

    metadata = {
        "artifact_hash": artifact_hash,
        "dataset_hash": dataset_hash,
        "features": FEATURES,
        "metrics": {
            "mae": float(run.data.metrics["mae"]),
            "rmse": float(run.data.metrics["rmse"]),
            "r2": float(run.data.metrics["r2"]),
        },
        "mlflow_run_id": run_id,
        "model_name": "xgboost_tool_wear",
        "model_version": f"v{model_version.version}",
        "status": "production",
        "trained_at": mlflow_time_to_iso(trained_timestamp),
    }

    write_json_atomically(metadata_output, metadata)

    # Point the MLflow "champion" alias to the approved version.
    client.set_registered_model_alias(
        name=args.registry_model_name,
        alias="champion",
        version=str(model_version.version),
    )

    client.set_model_version_tag(
        name=args.registry_model_name,
        version=str(model_version.version),
        key="deployment_status",
        value="production",
    )

    print()
    print("Promotion completed successfully.")
    print(f"Registry model: {args.registry_model_name}")
    print(f"Model version: v{model_version.version}")
    print(f"Run ID: {run_id}")
    print(f"MAE: {run.data.metrics['mae']}")
    print(f"RMSE: {run.data.metrics['rmse']}")
    print(f"R2: {run.data.metrics['r2']}")
    print(f"Production model: {model_output}")
    print(f"Metadata: {metadata_output}")
    print("MLflow alias: champion")


if __name__ == "__main__":
    main()