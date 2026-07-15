from __future__ import annotations

import html
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from src.common.config import (
    FEATURES,
    PREDICTION_COLUMN,
    load_params,
)
from src.common.paths import project_path
from src.data.validate import validate_dataframe
from src.monitoring.database import (
    PredictionDatabase,
    PredictionLog,
)
from src.monitoring.metrics import (
    monitoring_summary,
    recent_prediction_rows,
)


def insufficient_data_summary(
    *,
    minimum_samples: int,
    current_samples: int,
    generated_at: str | None = None,
) -> dict[str, Any]:
    """Build the response returned when drift data is insufficient."""
    available_text = (
        "1 is available"
        if current_samples == 1
        else f"{current_samples} are available"
    )

    return {
        "status": "insufficient_data",
        "generated_at": (
            generated_at
            or datetime.now(timezone.utc).isoformat()
        ),
        "current_sample_count": current_samples,
        "reference_sample_count": None,
        "minimum_current_samples": minimum_samples,
        "dataset_drift_detected": None,
        "drifted_feature_count": None,
        "drifted_feature_share": None,
        "prediction_drift_detected": None,
        "features": [],
        "performance": {
            "status": "unavailable",
            "labeled_prediction_count": 0,
            "mae": None,
            "rmse": None,
            "message": (
                "Actual wear labels are required for "
                "performance drift monitoring."
            ),
        },
        "message": (
            f"At least {minimum_samples} real successful "
            f"predictions are required; {available_text}."
        ),
    }


def _current_frame(
    records: list[PredictionLog],
) -> pd.DataFrame:
    """Convert recent prediction records into an Evidently dataframe."""
    rows: list[dict[str, float | int]] = []

    for record in reversed(records):
        if record.predicted_wear is None:
            continue

        rows.append(
            {
                **record.feature_values(),
                PREDICTION_COLUMN: float(record.predicted_wear),
            }
        )

    return pd.DataFrame(rows)


def _reference_frame(
    reference_path: Path,
    model_path: Path,
    limit: int,
) -> pd.DataFrame:
    """Load reference features and generate reference predictions."""
    if not reference_path.exists():
        raise FileNotFoundError(
            f"Reference dataset was not found: {reference_path}"
        )

    if not model_path.exists():
        raise FileNotFoundError(
            f"Production model was not found: {model_path}"
        )

    reference = pd.read_csv(reference_path).head(limit).copy()

    validate_dataframe(
        reference,
        features=FEATURES,
    )

    model = joblib.load(model_path)

    prediction = np.asarray(
        model.predict(reference.loc[:, FEATURES]),
        dtype=float,
    )

    if not np.isfinite(prediction).all():
        raise RuntimeError(
            "Reference model predictions contain NaN or infinity."
        )

    reference[PREDICTION_COLUMN] = prediction

    return reference.loc[
        :,
        [*FEATURES, PREDICTION_COLUMN],
    ]


def _metric_entries(
    payload: dict[str, Any],
) -> list[dict[str, Any]]:
    """Return valid metric entries from an Evidently payload."""
    metrics = payload.get("metrics")

    if not isinstance(metrics, list):
        return []

    return [
        entry
        for entry in metrics
        if isinstance(entry, dict)
    ]


def _test_results_by_metric(
    payload: dict[str, Any],
) -> dict[str, bool | None]:
    """Map Evidently metric IDs to drift-test results."""
    results: dict[str, bool | None] = {}
    tests = payload.get("tests")

    if not isinstance(tests, list):
        return results

    for test in tests:
        if not isinstance(test, dict):
            continue

        metric_config = test.get("metric_config")

        if not isinstance(metric_config, dict):
            continue

        metric_id = metric_config.get("metric_id")

        if not isinstance(metric_id, str):
            continue

        test_status = str(
            test.get("status", "")
        ).upper()

        if test_status in {"FAIL", "FAILED"}:
            results[metric_id] = True
        elif test_status in {
            "SUCCESS",
            "PASS",
            "PASSED",
        }:
            results[metric_id] = False
        else:
            results[metric_id] = None

    return results


def _apply_aggregate_feature_fallback(
    *,
    feature_results: list[dict[str, Any]],
    drift_count: int | None,
    column_count: int,
) -> None:
    """
    Fill missing feature-level results when aggregate results are decisive.

    Some Evidently versions do not expose matching test metric IDs in the
    serialized payload. If all columns drifted, every unknown result can
    safely be marked as drifted. If zero columns drifted, every unknown
    result can safely be marked as stable.

    Partial aggregate results remain unavailable because the aggregate count
    alone cannot identify which individual columns drifted.
    """
    if drift_count == column_count:
        fallback_value = True
    elif drift_count == 0:
        fallback_value = False
    else:
        return

    for feature_result in feature_results:
        if feature_result.get("drift_detected") is None:
            feature_result["drift_detected"] = fallback_value


def _extract_evidently_summary(
    payload: dict[str, Any],
    columns: list[str],
    drift_share_threshold: float,
) -> tuple[
    int | None,
    float | None,
    list[dict[str, Any]],
]:
    """Extract a compact dashboard summary from Evidently output."""
    del drift_share_threshold

    drift_count: int | None = None
    drift_share: float | None = None
    feature_results: list[dict[str, Any]] = []

    tests_by_metric = _test_results_by_metric(payload)

    for entry in _metric_entries(payload):
        metric_name = str(
            entry.get("metric_name") or ""
        )
        metric_id = str(entry.get("id") or "")
        config = entry.get("config")
        value = entry.get("value")

        if (
            "DriftedColumnsCount" in metric_name
            and isinstance(value, dict)
        ):
            raw_count = value.get("count")
            raw_share = value.get("share")

            if isinstance(raw_count, (int, float)):
                drift_count = int(raw_count)

            if isinstance(raw_share, (int, float)):
                drift_share = float(raw_share)

        if "ValueDrift" in metric_name:
            column = (
                config.get("column")
                if isinstance(config, dict)
                else None
            )

            score = (
                float(value)
                if isinstance(value, (int, float))
                else None
            )

            feature_results.append(
                {
                    "feature": (
                        column
                        if isinstance(column, str)
                        else metric_name
                    ),
                    "drift_score": score,
                    "drift_detected": (
                        tests_by_metric.get(metric_id)
                    ),
                }
            )

    if (
        drift_share is None
        and drift_count is not None
        and columns
    ):
        drift_share = drift_count / len(columns)

    if not feature_results:
        feature_results = [
            {
                "feature": column,
                "drift_score": None,
                "drift_detected": None,
            }
            for column in columns
        ]

    _apply_aggregate_feature_fallback(
        feature_results=feature_results,
        drift_count=drift_count,
        column_count=len(columns),
    )

    return (
        drift_count,
        drift_share,
        feature_results,
    )


def _write_insufficient_outputs(
    summary: dict[str, Any],
    json_path: Path,
    html_path: Path,
    summary_path: Path,
) -> None:
    """Write placeholder reports when too few predictions exist."""
    for path in (
        json_path,
        html_path,
        summary_path,
    ):
        path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

    serialized = json.dumps(
        summary,
        indent=2,
        sort_keys=True,
    )

    json_path.write_text(
        serialized,
        encoding="utf-8",
    )

    summary_path.write_text(
        serialized,
        encoding="utf-8",
    )

    html_path.write_text(
        (
            "<!doctype html>"
            "<html lang='en'>"
            "<head>"
            "<meta charset='utf-8'>"
            "<title>ToolWear drift report</title>"
            "</head>"
            "<body>"
            "<h1>Drift report unavailable</h1>"
            f"<p>{html.escape(str(summary['message']))}</p>"
            "</body>"
            "</html>"
        ),
        encoding="utf-8",
    )


def generate_drift_report(
    database: PredictionDatabase,
    params: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Generate Evidently drift reports from recent predictions."""
    params = params or load_params()

    monitoring = params["monitoring"]

    minimum_samples = int(
        os.getenv(
            "DRIFT_MIN_SAMPLES",
            monitoring["minimum_current_samples"],
        )
    )

    current_window = int(
        os.getenv(
            "DRIFT_CURRENT_WINDOW",
            monitoring["current_window_size"],
        )
    )

    reference_limit = int(
        monitoring["reference_sample_size"]
    )

    drift_share_threshold = float(
        monitoring["drift_share_threshold"]
    )

    html_path = project_path(
        monitoring["report_html"]
    )

    json_path = project_path(
        monitoring["report_json"]
    )

    summary_path = project_path(
        monitoring["summary_json"]
    )

    records = recent_prediction_rows(
        database,
        current_window,
    )

    generated_at = datetime.now(
        timezone.utc
    ).isoformat()

    if len(records) < minimum_samples:
        summary = insufficient_data_summary(
            minimum_samples=minimum_samples,
            current_samples=len(records),
            generated_at=generated_at,
        )

        _write_insufficient_outputs(
            summary,
            json_path,
            html_path,
            summary_path,
        )

        return summary

    current = _current_frame(records)

    if len(current) < minimum_samples:
        summary = insufficient_data_summary(
            minimum_samples=minimum_samples,
            current_samples=len(current),
            generated_at=generated_at,
        )

        _write_insufficient_outputs(
            summary,
            json_path,
            html_path,
            summary_path,
        )

        return summary

    reference = _reference_frame(
        project_path(
            params["data"]["reference_output"]
        ),
        project_path(
            params["model"]["production_output"]
        ),
        reference_limit,
    )

    columns = [
        *FEATURES,
        PREDICTION_COLUMN,
    ]

    validate_dataframe(
        current,
        features=columns,
    )

    from evidently import Report
    from evidently.presets import DataDriftPreset

    report = Report(
        [
            DataDriftPreset(
                columns=columns,
                drift_share=drift_share_threshold,
            )
        ],
        include_tests=True,
    )

    snapshot = report.run(
        current_data=current,
        reference_data=reference,
    )

    for path in (
        html_path,
        json_path,
        summary_path,
    ):
        path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

    snapshot.save_html(str(html_path))

    payload = snapshot.dict()

    json_path.write_text(
        json.dumps(
            payload,
            indent=2,
            default=str,
        ),
        encoding="utf-8",
    )

    (
        drift_count,
        drift_share,
        features,
    ) = _extract_evidently_summary(
        payload,
        columns,
        drift_share_threshold,
    )

    summary_metrics = monitoring_summary(database)

    performance_values = summary_metrics.get(
        "performance",
        {},
    )

    labeled_count = int(
        performance_values.get(
            "labeled_prediction_count",
            0,
        )
    )

    performance = {
        "status": (
            "available"
            if labeled_count > 0
            else "unavailable"
        ),
        **performance_values,
        "message": (
            None
            if labeled_count > 0
            else (
                "Actual wear labels are required for "
                "performance drift monitoring."
            )
        ),
    }

    prediction_feature = next(
        (
            item
            for item in features
            if item.get("feature")
            == PREDICTION_COLUMN
        ),
        None,
    )

    dataset_drift_detected = (
        drift_share >= drift_share_threshold
        if drift_share is not None
        else None
    )

    summary = {
        "status": "available",
        "generated_at": generated_at,
        "current_sample_count": len(current),
        "reference_sample_count": len(reference),
        "minimum_current_samples": minimum_samples,
        "dataset_drift_detected": (
            dataset_drift_detected
        ),
        "drifted_feature_count": drift_count,
        "drifted_feature_share": drift_share,
        "prediction_drift_detected": (
            prediction_feature.get(
                "drift_detected"
            )
            if prediction_feature
            else None
        ),
        "features": features,
        "performance": performance,
        "message": (
            "Data drift compares production inputs "
            "with the training reference. It does not "
            "prove that model accuracy changed."
        ),
    }

    summary_path.write_text(
        json.dumps(
            summary,
            indent=2,
            sort_keys=True,
        ),
        encoding="utf-8",
    )

    return summary