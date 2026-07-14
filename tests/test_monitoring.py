from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from src.common.config import FEATURES, load_params
from src.monitoring.database import PredictionDatabase
from src.monitoring.drift import generate_drift_report
from src.monitoring.metrics import monitoring_summary
from tests.conftest import VALID_PAYLOAD


def _add_prediction(
    database: PredictionDatabase,
    *,
    request_id: str,
    success: bool,
    latency_ms: float,
) -> int:
    return database.add_prediction(
        request_id=request_id,
        features={feature: VALID_PAYLOAD[feature] for feature in FEATURES},
        prediction=0.25 if success else None,
        wear_status="Medium wear" if success else None,
        latency_ms=latency_ms,
        request_success=success,
        model_metadata={},
        error_type=None if success else "TestError",
    )


def test_monitoring_summary_aggregates_real_records(
    prediction_database: PredictionDatabase,
) -> None:
    _add_prediction(
        prediction_database, request_id="success", success=True, latency_ms=10
    )
    _add_prediction(
        prediction_database, request_id="failure", success=False, latency_ms=20
    )

    summary = monitoring_summary(prediction_database)

    assert summary["prediction_count"] == 2
    assert summary["successful_requests"] == 1
    assert summary["failed_requests"] == 1
    assert summary["average_latency_ms"] == 15
    assert summary["p95_latency_ms"] is None


def test_feedback_endpoint_validates_actual_wear(
    client: TestClient, prediction_database: PredictionDatabase
) -> None:
    prediction_id = _add_prediction(
        prediction_database, request_id="feedback", success=True, latency_ms=8
    )

    accepted = client.post(
        f"/monitoring/feedback/{prediction_id}", json={"actual_wear": 0.18}
    )
    rejected = client.post(
        f"/monitoring/feedback/{prediction_id}", json={"actual_wear": -0.1}
    )

    assert accepted.status_code == 200
    assert accepted.json()["actual_wear"] == 0.18
    assert rejected.status_code == 422


def test_drift_report_returns_insufficient_data(
    prediction_database: PredictionDatabase, tmp_path: Path
) -> None:
    params = load_params()
    params["monitoring"] = {
        **params["monitoring"],
        "minimum_current_samples": 3,
        "report_html": str(tmp_path / "latest.html"),
        "report_json": str(tmp_path / "latest.json"),
        "summary_json": str(tmp_path / "latest_summary.json"),
    }
    _add_prediction(
        prediction_database, request_id="one", success=True, latency_ms=5
    )

    summary = generate_drift_report(prediction_database, params)

    assert summary["status"] == "insufficient_data"
    assert summary["current_sample_count"] == 1
    assert summary["dataset_drift_detected"] is None
    assert (tmp_path / "latest_summary.json").exists()
