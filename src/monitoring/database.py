from __future__ import annotations

from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, Integer, String, create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from src.common.config import FEATURES


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url.removeprefix("postgres://")
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    return url


class Base(DeclarativeBase):
    pass


class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    request_id: Mapped[str] = mapped_column(String(64), index=True)
    model_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    model_version: Mapped[str | None] = mapped_column(String(128), nullable=True)
    mlflow_run_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    dataset_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)

    case: Mapped[int] = mapped_column(Integer)
    run: Mapped[int] = mapped_column(Integer)
    time: Mapped[float] = mapped_column(Float)
    DOC: Mapped[float] = mapped_column(Float)
    feed: Mapped[float] = mapped_column(Float)
    material: Mapped[int] = mapped_column(Integer)
    smcAC_mean: Mapped[float] = mapped_column(Float)
    smcDC_mean: Mapped[float] = mapped_column(Float)
    vib_table_mean: Mapped[float] = mapped_column(Float)
    vib_spindle_mean: Mapped[float] = mapped_column(Float)
    AE_table_mean: Mapped[float] = mapped_column(Float)
    AE_spindle_mean: Mapped[float] = mapped_column(Float)

    predicted_wear: Mapped[float | None] = mapped_column(Float, nullable=True)
    wear_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    latency_ms: Mapped[float] = mapped_column(Float)
    actual_wear: Mapped[float | None] = mapped_column(Float, nullable=True)
    feedback_timestamp: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    request_success: Mapped[bool] = mapped_column(Boolean, index=True)
    error_type: Mapped[str | None] = mapped_column(String(255), nullable=True)

    def feature_values(self) -> dict[str, float | int]:
        return {feature: getattr(self, feature) for feature in FEATURES}


class PredictionDatabase:
    def __init__(self, url: str) -> None:
        normalized = normalize_database_url(url)
        connect_args = {"check_same_thread": False} if normalized.startswith("sqlite") else {}
        self.url = normalized
        self.engine: Engine = create_engine(
            normalized, pool_pre_ping=True, connect_args=connect_args
        )
        self.session_factory = sessionmaker(
            bind=self.engine, autoflush=False, expire_on_commit=False
        )

    def initialize(self) -> None:
        Base.metadata.create_all(self.engine)

    def is_connected(self) -> bool:
        try:
            with self.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return True
        except Exception:
            return False

    @contextmanager
    def session(self) -> Iterator[Session]:
        session = self.session_factory()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def add_prediction(
        self,
        *,
        request_id: str,
        features: Mapping[str, float | int],
        prediction: float | None,
        wear_status: str | None,
        latency_ms: float,
        request_success: bool,
        model_metadata: Mapping[str, Any],
        error_type: str | None = None,
    ) -> int:
        record = PredictionLog(
            request_id=request_id,
            model_name=_optional_string(model_metadata.get("model_name")),
            model_version=_optional_string(model_metadata.get("model_version")),
            mlflow_run_id=_optional_string(model_metadata.get("mlflow_run_id")),
            dataset_hash=_optional_string(model_metadata.get("dataset_hash")),
            predicted_wear=prediction,
            wear_status=wear_status,
            latency_ms=latency_ms,
            request_success=request_success,
            error_type=error_type,
            **{feature: features[feature] for feature in FEATURES},
        )
        with self.session() as session:
            session.add(record)
            session.flush()
            return int(record.id)


def _optional_string(value: Any) -> str | None:
    return str(value) if value is not None else None
