from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
REPORTS_DIR = PROJECT_ROOT / "reports"
DRIFT_REPORTS_DIR = REPORTS_DIR / "drift"
MODELS_DIR = PROJECT_ROOT / "models"


def project_path(value: str | Path) -> Path:
    """Resolve a repository-relative path without changing absolute paths."""
    path = Path(value)
    return path if path.is_absolute() else PROJECT_ROOT / path


def ensure_output_directories() -> None:
    for directory in (
        PROCESSED_DATA_DIR,
        ARTIFACTS_DIR,
        REPORTS_DIR,
        DRIFT_REPORTS_DIR,
        MODELS_DIR,
    ):
        directory.mkdir(parents=True, exist_ok=True)
