from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.common.config import load_params  # noqa: E402
from src.data.prepare import prepare_dataset  # noqa: E402
from src.training.evaluate import evaluate_candidate  # noqa: E402
from src.training.train import train_candidate  # noqa: E402


def main() -> None:
    params = load_params()
    data = prepare_dataset(params)
    training = train_candidate(params)
    evaluation = evaluate_candidate(params)
    print(
        json.dumps(
            {"data": data, "training": training, "evaluation": evaluation},
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
