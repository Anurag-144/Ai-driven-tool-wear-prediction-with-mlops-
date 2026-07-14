from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.training.promote_model import promote_candidate  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Promote a validated candidate model to the production path."
    )
    parser.add_argument("--candidate-version", required=True)
    parser.add_argument("--approve", action="store_true")
    args = parser.parse_args()
    result = promote_candidate(args.candidate_version, approve=args.approve)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
