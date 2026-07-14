#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
TRACKING_URI="${MLFLOW_TRACKING_URI:-sqlite:///$(pwd)/mlflow.db}"
PYTHON="${PYTHON:-.venv/bin/python}"
if [ ! -x "$PYTHON" ]; then
  PYTHON=python
fi
exec "$PYTHON" -m mlflow server \
  --backend-store-uri "$TRACKING_URI" \
  --default-artifact-root "$(pwd)/mlartifacts" \
  --host 127.0.0.1 \
  --port 5000
