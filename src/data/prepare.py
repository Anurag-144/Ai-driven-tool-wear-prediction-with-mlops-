from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from scipy.io import loadmat
from sklearn.model_selection import train_test_split

from src.common.config import FEATURES, TARGET, load_params
from src.common.paths import ARTIFACTS_DIR, ensure_output_directories, project_path
from src.data.validate import DatasetValidationError, validate_dataframe


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_milling_dataset(source: Path) -> pd.DataFrame:
    if not source.exists():
        raise FileNotFoundError(f"Source dataset was not found: {source}")

    loaded = loadmat(source)
    if "mill" not in loaded:
        raise DatasetValidationError("The MATLAB file does not contain 'mill'.")

    mill = loaded["mill"]
    if mill.size == 0:
        raise DatasetValidationError("The 'mill' dataset is empty.")

    expected_fields = {
        "case",
        "run",
        "VB",
        "time",
        "DOC",
        "feed",
        "material",
        "smcAC",
        "smcDC",
        "vib_table",
        "vib_spindle",
        "AE_table",
        "AE_spindle",
    }
    available_fields = set(mill.dtype.names or ())
    missing_fields = sorted(expected_fields - available_fields)
    if missing_fields:
        raise DatasetValidationError(
            "The source dataset is missing fields: " + ", ".join(missing_fields)
        )

    rows: list[dict[str, float | int]] = []
    for sample in mill.reshape(-1):
        rows.append(
            {
                "case": int(sample["case"][0][0]),
                "run": int(sample["run"][0][0]),
                TARGET: float(sample[TARGET][0][0]),
                "time": float(sample["time"][0][0]),
                "DOC": float(sample["DOC"][0][0]),
                "feed": float(sample["feed"][0][0]),
                "material": int(sample["material"][0][0]),
                "smcAC_mean": float(np.mean(sample["smcAC"])),
                "smcDC_mean": float(np.mean(sample["smcDC"])),
                "vib_table_mean": float(np.mean(sample["vib_table"])),
                "vib_spindle_mean": float(np.mean(sample["vib_spindle"])),
                "AE_table_mean": float(np.mean(sample["AE_table"])),
                "AE_spindle_mean": float(np.mean(sample["AE_spindle"])),
            }
        )

    return pd.DataFrame(rows)


def prepare_dataset(
    params: dict[str, Any] | None = None,
    *,
    source_override: Path | None = None,
    output_directory: Path | None = None,
) -> dict[str, Any]:
    params = params or load_params()
    data_params = params["data"]
    source = source_override or project_path(data_params["source"])
    dataset_hash = sha256_file(source)

    raw_frame = load_milling_dataset(source)
    if TARGET not in raw_frame.columns:
        raise DatasetValidationError(f"Target column '{TARGET}' is absent.")

    labeled_frame = raw_frame.dropna(subset=[TARGET]).reset_index(drop=True)
    validate_dataframe(labeled_frame, features=FEATURES, target=TARGET)

    train_frame, test_frame = train_test_split(
        labeled_frame,
        test_size=float(data_params["test_size"]),
        random_state=int(data_params["random_seed"]),
    )
    train_frame = train_frame.reset_index(drop=True)
    test_frame = test_frame.reset_index(drop=True)

    if output_directory is None:
        train_path = project_path(data_params["train_output"])
        test_path = project_path(data_params["test_output"])
        reference_path = project_path(data_params["reference_output"])
        metadata_path = ARTIFACTS_DIR / "data_metadata.json"
    else:
        train_path = output_directory / "train.csv"
        test_path = output_directory / "test.csv"
        reference_path = output_directory / "reference.csv"
        metadata_path = output_directory / "data_metadata.json"

    ensure_output_directories()
    for path in (train_path, test_path, reference_path, metadata_path):
        path.parent.mkdir(parents=True, exist_ok=True)

    train_frame.to_csv(train_path, index=False)
    test_frame.to_csv(test_path, index=False)
    labeled_frame.to_csv(reference_path, index=False)

    metadata: dict[str, Any] = {
        "dataset_name": source.name,
        "dataset_hash": dataset_hash,
        "source_rows": int(len(raw_frame)),
        "labeled_rows": int(len(labeled_frame)),
        "train_rows": int(len(train_frame)),
        "test_rows": int(len(test_frame)),
        "features": list(FEATURES),
        "target": TARGET,
        "random_seed": int(data_params["random_seed"]),
        "test_size": float(data_params["test_size"]),
    }
    metadata_path.write_text(
        json.dumps(metadata, indent=2, sort_keys=True), encoding="utf-8"
    )
    return metadata


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare the milling dataset.")
    parser.add_argument("--params", default="params.yaml")
    args = parser.parse_args()
    metadata = prepare_dataset(load_params(args.params))
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
