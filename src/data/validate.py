from __future__ import annotations

from collections.abc import Sequence

import numpy as np
import pandas as pd
from pandas.api.types import is_numeric_dtype


class DatasetValidationError(ValueError):
    """Raised when a dataset cannot safely be used by the model pipeline."""


def validate_dataframe(
    frame: pd.DataFrame,
    *,
    features: Sequence[str],
    target: str | None = None,
) -> None:
    if frame.empty:
        raise DatasetValidationError("The dataset is empty.")

    required = list(features) + ([target] if target else [])
    missing = [column for column in required if column not in frame.columns]
    if missing:
        raise DatasetValidationError(
            f"Missing required columns: {', '.join(missing)}"
        )

    non_numeric = [
        column for column in required if not is_numeric_dtype(frame[column])
    ]
    if non_numeric:
        raise DatasetValidationError(
            f"Expected numeric columns: {', '.join(non_numeric)}"
        )

    values = frame[required].to_numpy(dtype=float)
    if not np.isfinite(values).all():
        invalid_columns = [
            column
            for column in required
            if not np.isfinite(frame[column].to_numpy(dtype=float)).all()
        ]
        raise DatasetValidationError(
            "NaN or infinite values remain in required columns: "
            + ", ".join(invalid_columns)
        )
