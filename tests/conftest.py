from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import joblib
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from src.common.config import RuntimeSettings
from src.monitoring.database import PredictionDatabase


VALID_PAYLOAD: dict[str, float | int] = {
    "case": 1,
    "run": 1,
    "time": 2.0,
    "DOC": 1.5,
    "feed": 0.5,
    "material": 1,
    "smcAC_mean": 0.5,
    "smcDC_mean": 0.5,
    "vib_table_mean": 0.5,
    "vib_spindle_mean": 0.5,
    "AE_table_mean": 0.5,
    "AE_spindle_mean": 0.5,
}


@pytest.fixture
def prediction_database(tmp_path: Path) -> PredictionDatabase:
    database = PredictionDatabase(f"sqlite:///{(tmp_path / 'predictions.db').as_posix()}")
    database.initialize()
    return database


@pytest.fixture
def runtime_settings(tmp_path: Path) -> RuntimeSettings:
    root = Path(__file__).resolve().parents[1]
    return RuntimeSettings(
        database_url=f"sqlite:///{(tmp_path / 'predictions.db').as_posix()}",
        model_metadata_path=root / "models" / "model_metadata.json",
        production_model_path=root / "models" / "xgboost_tool_wear.pkl",
        drift_summary_path=tmp_path / "latest_summary.json",
        lifecycle_path=tmp_path / "lifecycle_status.json",
        pipeline_status_path=tmp_path / "pipeline_status.json",
        admin_token=None,
    )


@pytest.fixture
def client(
    runtime_settings: RuntimeSettings,
    prediction_database: PredictionDatabase,
) -> Iterator[TestClient]:
    model = joblib.load(runtime_settings.production_model_path)
    application = create_app(
        settings_override=runtime_settings,
        database_override=prediction_database,
        model_override=model,
    )
    with TestClient(application) as test_client:
        yield test_client
