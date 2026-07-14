from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import time
from pathlib import Path
from typing import Any

import joblib
import mlflow
import pandas as pd
from xgboost import XGBRegressor

from src.common.config import FEATURES, TARGET, TrackingSettings, load_params
from src.common.paths import ARTIFACTS_DIR, PROJECT_ROOT, project_path
from src.data.validate import validate_dataframe
from src.training.registry import configure_tracking, log_and_register_candidate


TRAINING_SCRIPT_VERSION = "1"


def git_commit() -> str:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=PROJECT_ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "unavailable"


def fit_candidate(
    train_frame: pd.DataFrame, model_parameters: dict[str, Any]
) -> tuple[XGBRegressor, float]:
    validate_dataframe(train_frame, features=FEATURES, target=TARGET)
    model = XGBRegressor(**model_parameters)
    started = time.perf_counter()
    model.fit(train_frame.loc[:, FEATURES], train_frame[TARGET])
    duration = time.perf_counter() - started
    return model, duration


def smoke_test_model(model: XGBRegressor, sample: pd.DataFrame) -> float:
    validate_dataframe(sample, features=FEATURES)
    prediction = model.predict(sample.loc[:, FEATURES].head(1))
    value = float(prediction[0])
    if not math.isfinite(value):
        raise RuntimeError("Candidate model smoke test returned a non-finite value.")
    return value


def train_candidate(
    params: dict[str, Any] | None = None,
    *,
    tracking_enabled: bool = True,
    train_path_override: Path | None = None,
    candidate_path_override: Path | None = None,
    data_metadata_path_override: Path | None = None,
    manifest_path_override: Path | None = None,
) -> dict[str, Any]:
    params = params or load_params()
    data_params = params["data"]
    model_params = params["model"]
    train_path = train_path_override or project_path(data_params["train_output"])
    candidate_path = candidate_path_override or project_path(
        model_params["candidate_output"]
    )
    data_metadata_path = (
        data_metadata_path_override or ARTIFACTS_DIR / "data_metadata.json"
    )

    train_frame = pd.read_csv(train_path)
    model, duration = fit_candidate(train_frame, model_params["parameters"])
    smoke_prediction = smoke_test_model(model, train_frame)
    candidate_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, candidate_path)

    try:
        candidate_manifest_path = str(candidate_path.relative_to(PROJECT_ROOT))
    except ValueError:
        candidate_manifest_path = str(candidate_path)

    manifest: dict[str, Any] = {
        "model_name": os.getenv("MLFLOW_MODEL_NAME", model_params["name"]),
        "model_version": None,
        "mlflow_run_id": None,
        "experiment_id": None,
        "dataset_hash": None,
        "git_commit": git_commit(),
        "training_duration_seconds": duration,
        "smoke_prediction": smoke_prediction,
        "candidate_model_path": candidate_manifest_path,
    }
    if data_metadata_path.exists():
        data_metadata = json.loads(data_metadata_path.read_text(encoding="utf-8"))
        manifest["dataset_hash"] = data_metadata.get("dataset_hash")
    else:
        data_metadata = {}

    if tracking_enabled:
        tracking = TrackingSettings.from_environment()
        experiment_id = configure_tracking(tracking)
        with mlflow.start_run() as run:
            manifest["mlflow_run_id"] = run.info.run_id
            manifest["experiment_id"] = experiment_id
            mlflow.log_params(model_params["parameters"])
            mlflow.log_params(
                {
                    "random_seed": data_params["random_seed"],
                    "test_size": data_params["test_size"],
                    "target_name": TARGET,
                    "feature_count": len(FEATURES),
                }
            )
            mlflow.log_metric("training_duration_seconds", duration)
            mlflow.set_tags(
                {
                    "git_commit": manifest["git_commit"],
                    "dataset_hash": manifest["dataset_hash"] or "unavailable",
                    "model_type": model_params["type"],
                    "environment": os.getenv("MLOPS_ENVIRONMENT", "local"),
                    "training_script_version": TRAINING_SCRIPT_VERSION,
                }
            )

            dataset = mlflow.data.from_pandas(
                train_frame,
                source=str(train_path),
                name=Path(data_params["source"]).name,
                targets=TARGET,
            )
            mlflow.log_input(dataset, context="training")
            mlflow.log_dict(
                {
                    "features": list(FEATURES),
                    "target": TARGET,
                    "dtypes": {
                        column: str(train_frame[column].dtype)
                        for column in [*FEATURES, TARGET]
                    },
                },
                "input_schema.json",
            )
            mlflow.log_dict(data_metadata, "dataset_lineage.json")
            mlflow.log_artifact(candidate_path, artifact_path="candidate")
            mlflow.log_artifact(PROJECT_ROOT / "params.yaml")
            manifest["model_version"] = log_and_register_candidate(
                model=model,
                model_name=tracking.model_name,
                sample=train_frame.loc[:, FEATURES].head(10),
                predictions=model.predict(train_frame.loc[:, FEATURES].head(10)),
            )

    manifest_path = manifest_path_override or ARTIFACTS_DIR / "training_run.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps(manifest, indent=2, sort_keys=True), encoding="utf-8"
    )
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a candidate XGBoost model.")
    parser.add_argument("--params", default="params.yaml")
    parser.add_argument("--no-mlflow", action="store_true")
    args = parser.parse_args()
    manifest = train_candidate(
        load_params(args.params), tracking_enabled=not args.no_mlflow
    )
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
