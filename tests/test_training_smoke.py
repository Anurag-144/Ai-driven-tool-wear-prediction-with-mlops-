from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from src.common.config import FEATURES, TARGET, load_params
from src.data.prepare import prepare_dataset
from src.data.validate import DatasetValidationError, validate_dataframe
from src.training.evaluate import evaluate_candidate
from src.training.promote_model import compare_with_champion
from src.training.train import train_candidate


def test_required_columns_and_numeric_values_are_validated() -> None:
    frame = pd.DataFrame({feature: [1.0] for feature in FEATURES})
    missing = frame.drop(columns=[FEATURES[0]])
    non_numeric = frame.copy()
    non_numeric[FEATURES[1]] = "not-a-number"
    non_finite = frame.copy()
    non_finite[FEATURES[2]] = np.inf

    with pytest.raises(DatasetValidationError, match="Missing required columns"):
        validate_dataframe(missing, features=FEATURES)
    with pytest.raises(DatasetValidationError, match="Expected numeric columns"):
        validate_dataframe(non_numeric, features=FEATURES)
    with pytest.raises(DatasetValidationError, match="NaN or infinite"):
        validate_dataframe(non_finite, features=FEATURES)


def test_split_is_deterministic(tmp_path: Path) -> None:
    root = Path(__file__).resolve().parents[1]
    params = load_params()
    first = tmp_path / "first"
    second = tmp_path / "second"

    prepare_dataset(params, source_override=root / "data" / "mill.mat", output_directory=first)
    prepare_dataset(params, source_override=root / "data" / "mill.mat", output_directory=second)

    assert (first / "train.csv").read_bytes() == (second / "train.csv").read_bytes()
    assert (first / "test.csv").read_bytes() == (second / "test.csv").read_bytes()


def test_training_and_evaluation_pipeline_smoke(tmp_path: Path) -> None:
    root = Path(__file__).resolve().parents[1]
    params = load_params()
    prepared = tmp_path / "prepared"
    reports = tmp_path / "reports"
    candidate = tmp_path / "candidate_model.pkl"
    manifest = tmp_path / "training_run.json"

    prepare_dataset(
        params,
        source_override=root / "data" / "mill.mat",
        output_directory=prepared,
    )
    training = train_candidate(
        params,
        tracking_enabled=False,
        train_path_override=prepared / "train.csv",
        candidate_path_override=candidate,
        data_metadata_path_override=prepared / "data_metadata.json",
        manifest_path_override=manifest,
    )
    metadata = evaluate_candidate(
        params,
        tracking_enabled=False,
        test_path_override=prepared / "test.csv",
        candidate_path_override=candidate,
        output_directory=reports,
        manifest_path_override=manifest,
        lifecycle_path_override=tmp_path / "lifecycle_status.json",
        pipeline_path_override=tmp_path / "pipeline_status.json",
    )
    metrics = json.loads((reports / "metrics.json").read_text(encoding="utf-8"))

    assert candidate.exists()
    assert math.isfinite(float(training["smoke_prediction"]))
    assert set(metrics) == {"mae", "rmse", "r2"}
    assert all(math.isfinite(float(value)) for value in metrics.values())
    assert metadata["features"] == list(FEATURES)
    assert metadata["target"] == TARGET
    assert (reports / "model_metadata.json").exists()


def test_candidate_metrics_are_compared_with_champion() -> None:
    candidate = {"mae": 0.08, "rmse": 0.11, "r2": 0.60}
    champion = {"mae": 0.09, "rmse": 0.12, "r2": 0.59}

    comparison = compare_with_champion(candidate, champion)

    assert comparison["status"] == "passed"
    assert comparison["passed"] is True
