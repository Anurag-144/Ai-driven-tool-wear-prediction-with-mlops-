from __future__ import annotations

from typing import Any

import joblib
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.main import create_app
from src.common.config import PREDICTION_COLUMN, RuntimeSettings
from src.monitoring.database import PredictionDatabase, PredictionLog
from tests.conftest import VALID_PAYLOAD


def test_valid_prediction_preserves_contract(
    client: TestClient, prediction_database: PredictionDatabase
) -> None:
    response = client.post("/predict", json=VALID_PAYLOAD)

    assert response.status_code == 200
    assert list(response.json()) == [PREDICTION_COLUMN]
    assert isinstance(response.json()[PREDICTION_COLUMN], float)
    assert response.headers["X-Request-ID"]
    with prediction_database.session() as session:
        assert session.scalar(select(func.count(PredictionLog.id))) == 1


def test_invalid_payload_returns_validation_error(client: TestClient) -> None:
    invalid = {key: value for key, value in VALID_PAYLOAD.items() if key != "feed"}

    response = client.post("/predict", json=invalid)

    assert response.status_code == 422


def test_health_and_model_info(client: TestClient) -> None:
    health = client.get("/health")
    model_info = client.get("/model-info")

    assert health.status_code == 200
    assert health.json()["model_loaded"] is True
    assert health.json()["database_connected"] is True
    assert model_info.status_code == 200
    assert model_info.json()["features"]
    assert model_info.json()["metrics"] == {}


class FailingLogDatabase(PredictionDatabase):
    def add_prediction(self, **kwargs: Any) -> int:
        raise RuntimeError("simulated logging outage")


def test_logging_failure_does_not_break_prediction(
    runtime_settings: RuntimeSettings,
) -> None:
    database = FailingLogDatabase(runtime_settings.database_url)
    model = joblib.load(runtime_settings.production_model_path)
    application = create_app(
        settings_override=runtime_settings,
        database_override=database,
        model_override=model,
    )

    with TestClient(application) as client:
        response = client.post("/predict", json=VALID_PAYLOAD)

    assert response.status_code == 200
    assert PREDICTION_COLUMN in response.json()
