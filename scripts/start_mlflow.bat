@echo off
setlocal
cd /d "%~dp0.."
if not defined MLFLOW_TRACKING_URI set "MLFLOW_TRACKING_URI=sqlite:///%CD%/mlflow.db"
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" -m mlflow server --backend-store-uri "%MLFLOW_TRACKING_URI%" --default-artifact-root "%CD%\mlartifacts" --host 127.0.0.1 --port 5000
) else (
  python -m mlflow server --backend-store-uri "%MLFLOW_TRACKING_URI%" --default-artifact-root "%CD%\mlartifacts" --host 127.0.0.1 --port 5000
)
