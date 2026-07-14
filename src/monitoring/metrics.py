from __future__ import annotations

import math
from datetime import datetime, timezone
from statistics import mean
from typing import Any

from sqlalchemy import select

from src.common.config import classify_wear
from src.monitoring.database import PredictionDatabase, PredictionLog


def percentile(values: list[float], percentile_value: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    rank = (len(ordered) - 1) * percentile_value
    lower = math.floor(rank)
    upper = math.ceil(rank)
    if lower == upper:
        return ordered[lower]
    weight = rank - lower
    return ordered[lower] * (1 - weight) + ordered[upper] * weight


def monitoring_summary(database: PredictionDatabase) -> dict[str, Any]:
    with database.session() as session:
        records = list(
            session.scalars(select(PredictionLog).order_by(PredictionLog.timestamp.asc()))
        )
    successful = [record for record in records if record.request_success]
    failed = [record for record in records if not record.request_success]
    latencies = [float(record.latency_ms) for record in records]
    labeled = [
        record
        for record in successful
        if record.actual_wear is not None and record.predicted_wear is not None
    ]
    errors = [
        float(record.actual_wear) - float(record.predicted_wear)
        for record in labeled
    ]
    performance = {
        "labeled_prediction_count": len(labeled),
        "mae": mean(abs(error) for error in errors) if errors else None,
        "rmse": math.sqrt(mean(error * error for error in errors)) if errors else None,
    }
    return {
        "status": "available" if records else "empty",
        "prediction_count": len(records),
        "successful_requests": len(successful),
        "failed_requests": len(failed),
        "average_latency_ms": mean(latencies) if latencies else None,
        "p95_latency_ms": percentile(latencies, 0.95) if len(latencies) >= 20 else None,
        "p95_minimum_samples": 20,
        "performance": performance,
        "updated_at": records[-1].timestamp.isoformat() if records else None,
    }


def latency_series(database: PredictionDatabase, limit: int = 50) -> dict[str, Any]:
    with database.session() as session:
        newest = list(
            session.scalars(
                select(PredictionLog)
                .order_by(PredictionLog.timestamp.desc())
                .limit(limit)
            )
        )
    points = [
        {
            "timestamp": record.timestamp.isoformat(),
            "latency_ms": float(record.latency_ms),
            "request_success": bool(record.request_success),
        }
        for record in reversed(newest)
    ]
    return {"status": "available" if points else "empty", "points": points}


def prediction_distribution(database: PredictionDatabase) -> dict[str, Any]:
    with database.session() as session:
        predictions = list(
            session.scalars(
                select(PredictionLog.predicted_wear).where(
                    PredictionLog.request_success.is_(True),
                    PredictionLog.predicted_wear.is_not(None),
                )
            )
        )
    bands = {"Low wear": 0, "Medium wear": 0, "High wear": 0}
    for prediction in predictions:
        bands[classify_wear(float(prediction))] += 1
    return {
        "status": "available" if predictions else "empty",
        "total": len(predictions),
        "bands": [
            {"status": status, "count": count}
            for status, count in bands.items()
        ],
        "interpretation": "Dashboard wear bands, not model confidence.",
    }


def update_feedback(
    database: PredictionDatabase, prediction_id: int, actual_wear: float
) -> dict[str, Any] | None:
    with database.session() as session:
        record = session.get(PredictionLog, prediction_id)
        if record is None:
            return None
        record.actual_wear = actual_wear
        record.feedback_timestamp = datetime.now(timezone.utc)
        session.add(record)
        return {
            "prediction_id": record.id,
            "actual_wear": actual_wear,
            "feedback_timestamp": record.feedback_timestamp.isoformat(),
        }


def recent_prediction_rows(
    database: PredictionDatabase, limit: int
) -> list[PredictionLog]:
    with database.session() as session:
        return list(
            session.scalars(
                select(PredictionLog)
                .where(
                    PredictionLog.request_success.is_(True),
                    PredictionLog.predicted_wear.is_not(None),
                )
                .order_by(PredictionLog.timestamp.desc())
                .limit(limit)
            )
        )
