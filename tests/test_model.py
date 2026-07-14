from __future__ import annotations

import math
from pathlib import Path

import joblib
import pandas as pd

from src.common.config import FEATURES


def test_production_model_loads_and_predicts() -> None:
    root = Path(__file__).resolve().parents[1]
    model = joblib.load(root / "models" / "xgboost_tool_wear.pkl")
    sample = pd.DataFrame(
        [[1, 1, 2.0, 1.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]],
        columns=FEATURES,
    )

    prediction = float(model.predict(sample)[0])

    assert math.isfinite(prediction)
