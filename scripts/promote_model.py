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

DEFAULT_PIPELINE_STATUS_PATH = Path("artifacts/pipeline_status.json")
DEFAULT_LIFECYCLE_STATUS_PATH = Path("artifacts/lifecycle_status.json")


def calculate_sha256(file_path: Path) -> str:
    """Calculate the SHA-256 hash of a file."""
    digest = hashlib.sha256()

    with file_path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def mlflow_time_to_iso(timestamp_ms: int | None) -> str:
    """Convert an MLflow millisecond timestamp to UTC ISO-8601."""
    if timestamp_ms is None:
        raise ValueError(
            "The MLflow run does not contain a valid timestamp."
        )

    timestamp = datetime.fromtimestamp(
        timestamp_ms / 1000,
        tz=timezone.utc,
    )

    return timestamp.isoformat().replace("+00:00", "Z")


def current_utc_iso() -> str:
    """Return the current time in UTC ISO-8601 format."""
    return datetime.now(timezone.utc).isoformat().replace(
        "+00:00",
        "Z",
    )


def load_registered_model(model_uri: str) -> Any:
    """
    Load a registered MLflow model.

    The project may log its model using either the MLflow XGBoost flavor
    or the MLflow sklearn flavor, so both are attempted.
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
            "The registered model could not be loaded using either "
            "the MLflow XGBoost flavor or sklearn flavor.\n"
            f"XGBoost error: {xgboost_error}\n"
            f"Sklearn error: {sklearn_error}"
        ) from sklearn_error


def write_json_atomically(
    path: Path,
    data: dict[str, Any],
) -> None:
    """
    Write a JSON file atomically.

    The parent directory is created when it does not already exist.
    """
    path.parent.mkdir(parents=True, exist_ok=True)

    temporary_path = path.with_suffix(path.suffix + ".tmp")

    with temporary_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)
        file.write("\n")

    temporary_path.replace(path)


def backup_file(path: Path) -> None:
    """Create a backup before replacing an existing production file."""
    if not path.exists():
        return

    backup_path = path.with_suffix(path.suffix + ".bak")
    shutil.copy2(path, backup_path)

    print(f"Backup created: {backup_path}")


def validate_model_version(model_version: Any) -> None:
    """Ensure the registered MLflow model version is ready."""
    status = str(model_version.status).upper()

    if status != "READY":
        raise RuntimeError(
            "The registered model version is not ready. "
            f"Current status: {model_version.status}"
        )


def validate_run(run: Any) -> None:
    """Ensure the source MLflow run finished and contains metrics."""
    run_status = str(run.info.status).upper()

    if run_status != "FINISHED":
        raise RuntimeError(
            "The source MLflow run is not finished. "
            f"Current status: {run.info.status}"
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


def get_dataset_hash(run: Any) -> str:
    """Read the dataset hash from the MLflow run."""
    dataset_hash = (
        run.data.tags.get("dataset_hash")
        or run.data.params.get("dataset_hash")
    )

    if not dataset_hash:
        raise RuntimeError(
            "The MLflow run does not contain a dataset_hash "
            "tag or parameter."
        )

    return str(dataset_hash)


def save_production_model(
    promoted_model: Any,
    model_output: Path,
) -> str:
    """
    Save the promoted model as the production pickle.

    Returns the SHA-256 hash of the saved artifact.
    """
    model_output.parent.mkdir(parents=True, exist_ok=True)

    temporary_model = model_output.with_suffix(
        model_output.suffix + ".tmp"
    )

    with temporary_model.open("wb") as file:
        pickle.dump(promoted_model, file)

    temporary_model.replace(model_output)

    return calculate_sha256(model_output)


def build_model_metadata(
    *,
    artifact_hash: str,
    dataset_hash: str,
    run: Any,
    run_id: str,
    model_version_number: str,
) -> dict[str, Any]:
    """Build production model metadata from the MLflow run."""
    trained_timestamp = (
        run.info.start_time
        if run.info.start_time is not None
        else run.info.end_time
    )

    return {
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
        "model_version": f"v{model_version_number}",
        "status": "production",
        "trained_at": mlflow_time_to_iso(trained_timestamp),
    }


def build_pipeline_status(
    promotion_time: str,
) -> dict[str, Any]:
    """Build the pipeline status exposed by the monitoring API."""
    return {
        "deployment": "promoted",
        "evaluation": "completed",
        "registry": "champion_registered",
        "training": "completed",
        "updated_at": promotion_time,
    }


def build_lifecycle_status(
    *,
    run: Any,
    run_id: str,
    model_version_number: str,
    promotion_time: str,
) -> dict[str, Any]:
    """Build the candidate/champion model lifecycle status."""
    training_started_at = (
        run.info.start_time
        if run.info.start_time is not None
        else run.info.end_time
    )

    training_completed_at = (
        run.info.end_time
        if run.info.end_time is not None
        else run.info.start_time
    )

    return {
        "current_champion": {
            "model_version": model_version_number,
            "run_id": run_id,
            "promoted_at": promotion_time,
        },
        "last_promotion": {
            "model_version": model_version_number,
            "run_id": run_id,
            "promoted_at": promotion_time,
            "status": "completed",
        },
        "last_training_run": {
            "completed_at": mlflow_time_to_iso(
                training_completed_at
            ),
            "run_id": run_id,
            "status": "completed",
        },
        "latest_candidate": {
            "model_version": model_version_number,
            "quality_gate": "approved",
            "run_id": run_id,
            "trained_at": mlflow_time_to_iso(
                training_started_at
            ),
        },
    }


def parse_arguments() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description=(
            "Promote an MLflow registered-model version, replace the "
            "production model, and generate monitoring metadata."
        )
    )

    parser.add_argument(
        "--version",
        required=True,
        help="Registered model version number, for example 4.",
    )

    parser.add_argument(
        "--registry-model-name",
        default=os.getenv(
            "MLFLOW_MODEL_NAME",
            "tool-wear-regressor",
        ),
        help="Name of the registered MLflow model.",
    )

    parser.add_argument(
        "--tracking-uri",
        default=os.getenv("MLFLOW_TRACKING_URI"),
        help="MLflow tracking server URI.",
    )

    parser.add_argument(
        "--model-output",
        default="models/xgboost_tool_wear.pkl",
        help="Path for the promoted production model.",
    )

    parser.add_argument(
        "--metadata-output",
        default="models/model_metadata.json",
        help="Path for the production model metadata.",
    )

    parser.add_argument(
        "--pipeline-status-output",
        default=str(DEFAULT_PIPELINE_STATUS_PATH),
        help="Path for pipeline monitoring status.",
    )

    parser.add_argument(
        "--lifecycle-status-output",
        default=str(DEFAULT_LIFECYCLE_STATUS_PATH),
        help="Path for model lifecycle status.",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_arguments()

    if args.tracking_uri:
        mlflow.set_tracking_uri(args.tracking_uri)

    client = MlflowClient()

    registry_model_name = args.registry_model_name
    requested_version = str(args.version)

    print(
        f"Reading {registry_model_name} version "
        f"{requested_version} from MLflow..."
    )

    model_version = client.get_model_version(
        name=registry_model_name,
        version=requested_version,
    )

    validate_model_version(model_version)

    run_id = model_version.run_id

    if not run_id:
        raise RuntimeError(
            "The registered model version does not contain "
            "a source run ID."
        )

    run = client.get_run(run_id)

    validate_run(run)

    dataset_hash = get_dataset_hash(run)

    actual_version = str(model_version.version)

    model_uri = (
        f"models:/{registry_model_name}/{actual_version}"
    )

    print(f"Loading model from {model_uri}...")

    promoted_model = load_registered_model(model_uri)

    model_output = Path(args.model_output)
    metadata_output = Path(args.metadata_output)
    pipeline_status_output = Path(
        args.pipeline_status_output
    )
    lifecycle_status_output = Path(
        args.lifecycle_status_output
    )

    backup_file(model_output)
    backup_file(metadata_output)

    artifact_hash = save_production_model(
        promoted_model=promoted_model,
        model_output=model_output,
    )

    metadata = build_model_metadata(
        artifact_hash=artifact_hash,
        dataset_hash=dataset_hash,
        run=run,
        run_id=run_id,
        model_version_number=actual_version,
    )

    write_json_atomically(
        metadata_output,
        metadata,
    )

    # Assign the champion alias to the approved model version.
    client.set_registered_model_alias(
        name=registry_model_name,
        alias="champion",
        version=actual_version,
    )

    # Record the deployment state on the registered model version.
    client.set_model_version_tag(
        name=registry_model_name,
        version=actual_version,
        key="deployment_status",
        value="production",
    )

    promotion_time = current_utc_iso()

    pipeline_status = build_pipeline_status(
        promotion_time=promotion_time,
    )

    lifecycle_status = build_lifecycle_status(
        run=run,
        run_id=run_id,
        model_version_number=actual_version,
        promotion_time=promotion_time,
    )

    write_json_atomically(
        pipeline_status_output,
        pipeline_status,
    )

    write_json_atomically(
        lifecycle_status_output,
        lifecycle_status,
    )

    print()
    print("Promotion completed successfully.")
    print(f"Registry model: {registry_model_name}")
    print(f"Model version: v{actual_version}")
    print(f"Run ID: {run_id}")
    print(f"MAE: {run.data.metrics['mae']}")
    print(f"RMSE: {run.data.metrics['rmse']}")
    print(f"R2: {run.data.metrics['r2']}")
    print(f"Dataset hash: {dataset_hash}")
    print(f"Production model: {model_output}")
    print(f"Metadata: {metadata_output}")
    print(f"Pipeline status: {pipeline_status_output}")
    print(f"Lifecycle status: {lifecycle_status_output}")
    print("MLflow alias: champion")


if __name__ == "__main__":
    main()