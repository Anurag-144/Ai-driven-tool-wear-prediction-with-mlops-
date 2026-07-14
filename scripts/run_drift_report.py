from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.common.config import RuntimeSettings  # noqa: E402
from src.monitoring.database import PredictionDatabase  # noqa: E402
from src.monitoring.drift import generate_drift_report  # noqa: E402


def main() -> None:
    settings = RuntimeSettings.from_environment()
    database = PredictionDatabase(settings.database_url)
    database.initialize()
    summary = generate_drift_report(database)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
