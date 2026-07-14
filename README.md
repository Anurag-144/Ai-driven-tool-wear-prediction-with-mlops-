# ToolWear AI

ToolWear AI is an end-to-end tool-wear regression project built around the NASA milling dataset. It combines a production FastAPI inference service, a Next.js prediction experience, reproducible XGBoost training, MLflow experiment tracking and registry support, DVC pipelines, persistent prediction logging, and Evidently-based drift monitoring.

The production prediction contract remains unchanged:

```http
POST /predict
```

```json
{
  "case": 1,
  "run": 1,
  "time": 2,
  "DOC": 1.5,
  "feed": 0.5,
  "material": 1,
  "smcAC_mean": 0.5,
  "smcDC_mean": 0.5,
  "vib_table_mean": 0.5,
  "vib_spindle_mean": 0.5,
  "AE_table_mean": 0.5,
  "AE_spindle_mean": 0.5
}
```

```json
{
  "Predicted Tool Wear (VB)": 0.0
}
```

The response above demonstrates the field shape only; it is not a sample prediction.

## Architecture

```text
Git + DVC
    ↓
Data validation and preparation
    ↓
XGBoost training
    ↓
MLflow experiment tracking
    ↓
Candidate model
    ↓
Evaluation quality gate
    ↓
Manual champion promotion
    ↓
FastAPI inference
    ↓
Prediction logging database
    ↓
Evidently drift monitoring
    ↓
Next.js MLOps dashboard
```

The production image contains only inference and database dependencies. MLflow, DVC, Evidently, plotting, and training packages remain outside the deployed API image.

## Repository structure

```text
app/                         FastAPI entry point
data/                        Source dataset and ignored processed outputs
models/                      Deployment-compatible production model and metadata
src/common/                  Paths, configuration, feature contract, metadata helpers
src/data/                    MATLAB data extraction and schema validation
src/training/                Training, evaluation, registry, and promotion logic
src/monitoring/              Database models, aggregates, and drift reporting
scripts/                     Training, promotion, drift, and MLflow launchers
tests/                       API, model, monitoring, and training tests
frontend/                    Next.js landing, prediction, and MLOps routes
reports/                     Ignored generated evaluation and drift reports
artifacts/                   Ignored candidates and lifecycle state
.github/workflows/           CI and manual candidate-training workflows
```

## Local setup

Python 3.12 and Node.js 22 are used by CI.

### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pip install -r requirements-mlops.txt
Copy-Item .env.example .env
```

### macOS or Linux

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m pip install -r requirements-mlops.txt
cp .env.example .env
```

Do not commit `.env`, local databases, generated reports, MLflow stores, processed data, or model candidates.

## Run inference locally

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The API is then available at:

- API: `http://127.0.0.1:8000`
- OpenAPI docs: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

The default local database is `sqlite:///./data/predictions.db`. SQLite is suitable for local development, but Render's filesystem is ephemeral and is not reliable production storage. Configure a managed PostgreSQL `DATABASE_URL` in production.

## Frontend

```powershell
Set-Location frontend
Copy-Item .env.example .env.local
npm ci --no-audit
npm run build
npm run dev
```

For local backend testing, set this in `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Routes:

- Landing page: `http://localhost:3000/`
- Prediction dashboard: `http://localhost:3000/dashboard`
- MLOps operations: `http://localhost:3000/mlops`

The MLOps page shows only backend aggregates and real status artifacts. It renders explicit offline, empty, malformed-response, and insufficient-data states.

## Reproducible training

`params.yaml` contains the split seed, test size, target, current XGBoost configuration, output paths, and promotion gates. The feature engineering is the repository's existing notebook logic: six signal arrays are reduced to their means and combined with the six machining fields.

Run the complete Python pipeline:

```powershell
.\.venv\Scripts\python.exe scripts\run_training.py
```

Or reproduce it with DVC:

```powershell
.\.venv\Scripts\python.exe -m dvc repro
.\.venv\Scripts\python.exe -m dvc metrics show
.\.venv\Scripts\python.exe -m dvc dag
```

Common DVC workflow after configuring a real remote:

```powershell
.\.venv\Scripts\python.exe -m dvc remote add -d storage <REMOTE>
.\.venv\Scripts\python.exe -m dvc pull
.\.venv\Scripts\python.exe -m dvc repro
.\.venv\Scripts\python.exe -m dvc metrics show
```

No fake remote is configured. The current deployment model remains at `models/xgboost_tool_wear.pkl` and remains Git-available for Render compatibility. DVC versions processed data and candidate/evaluation outputs first. Move the production model out of Git only after a durable DVC remote and deployment-time pull strategy are operational.

## MLflow experiment tracking

Training uses:

- Experiment: `tool-wear-regression`
- Registered model: `tool-wear-regressor`
- Candidate alias: `candidate`
- Champion alias: `champion` after explicit promotion

Start the local SQLite-backed tracking server:

```powershell
.\scripts\start_mlflow.bat
```

Or:

```bash
./scripts/start_mlflow.sh
```

Open `http://127.0.0.1:5000`. Training logs hyperparameters, split settings, duration, real evaluation metrics, Git SHA, dataset hash, input schema, dataset lineage, plots, candidate artifact, metadata, and a `params.yaml` snapshot.

## Registry, quality gate, promotion, and rollback

Training registers a candidate but never promotes it. Promotion requires all of the following:

1. An explicit `--approve` flag.
2. A valid registered candidate version and artifact.
3. Exact feature-schema compatibility.
4. A successful model smoke prediction.
5. A real metrics file.
6. Configured and passing quality thresholds in `params.yaml`.

The repository does not invent accepted thresholds. Configure authoritative `max_mae`, `max_rmse`, and `min_r2` values before attempting promotion.

```powershell
.\.venv\Scripts\python.exe scripts\promote_model.py --candidate-version <VERSION> --approve
```

Successful promotion copies the previous production artifact into `artifacts/rollback/`, updates `models/model_metadata.json`, sets the MLflow champion alias, and appends an audit record. It never deletes the previous champion. To roll back, validate the selected rollback artifact, copy it back to the production path, restore its matching metadata, and record that operation in the promotion audit before redeploying.

If the tracking server or registry is unavailable, promotion fails clearly and the existing production model remains untouched.

## Prediction logging and monitoring

Every validated prediction attempts to write:

- Request and model lineage identifiers
- All 12 model features
- Predicted wear and dashboard wear band
- Inference latency and request outcome
- Optional later actual wear feedback

Database errors are logged by the API but do not replace a successful inference response. Raw production records are not exposed by monitoring endpoints.

Available endpoints:

- `GET /health`
- `GET /model-info`
- `GET /monitoring/summary`
- `GET /monitoring/latency`
- `GET /monitoring/prediction-distribution`
- `GET /monitoring/drift/latest`
- `GET /monitoring/lifecycle`
- `GET /monitoring/pipeline`
- `POST /monitoring/feedback/{prediction_id}`

Set `MLOPS_ADMIN_TOKEN` before exposing feedback in production. Clients then send the token in the `X-Admin-Token` header. Without a configured token the local endpoint is unprotected and should not be exposed publicly.

## Drift monitoring

Run:

```powershell
.\.venv\Scripts\python.exe scripts\run_drift_report.py
```

Evidently compares the prepared training reference with recent successful production records for all 12 input features and `Predicted Tool Wear (VB)`. It writes ignored `reports/drift/latest.html`, `latest.json`, and `latest_summary.json` files. If fewer than `DRIFT_MIN_SAMPLES` real predictions exist, the script returns `status: insufficient_data` and does not fabricate observations.

Monitoring terms are deliberately separated:

- Data drift: production input distributions differ from reference inputs.
- Prediction drift: predicted-wear distribution differs from the reference distribution.
- Performance drift: measured MAE or RMSE changes; this requires actual wear feedback.
- Concept drift: the input-target relationship changes; distribution drift alone does not prove it.

## Tests and CI

```powershell
.\.venv\Scripts\python.exe -m pytest -v
Set-Location frontend
npm run lint
npm run build
```

`.github/workflows/ci.yml` runs backend tests, a production model smoke test, FastAPI import validation, a Docker build, frontend lint/build, DVC configuration checks, and a lightweight training-pipeline smoke test. `.github/workflows/train-model.yml` is manual and produces a candidate evaluation artifact; it never promotes or deploys a model.

## Docker Compose for local MLOps

```powershell
docker compose -f docker-compose.mlops.yml up --build
```

This starts PostgreSQL on `5432`, MLflow on `5000`, and FastAPI on `8000` using named volumes and local-only default credentials. Override those credentials through environment variables before using the stack outside a local machine.

## Production environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite locally or managed PostgreSQL in production |
| `MLFLOW_TRACKING_URI` | MLflow database/server URI used by training tools |
| `MLFLOW_EXPERIMENT_NAME` | Experiment name, defaults to `tool-wear-regression` |
| `MLFLOW_MODEL_NAME` | Registry model name, defaults to `tool-wear-regressor` |
| `MODEL_METADATA_PATH` | Production model metadata JSON path |
| `PRODUCTION_MODEL_PATH` | Production Joblib model path |
| `DRIFT_MIN_SAMPLES` | Minimum real current records before drift analysis |
| `DRIFT_CURRENT_WINDOW` | Maximum recent production records used for drift |
| `MLOPS_ADMIN_TOKEN` | Optional protection for actual-wear feedback |
| `NEXT_PUBLIC_API_URL` | Browser-visible FastAPI base URL |

## Render and Vercel deployment

Render can continue building the existing `Dockerfile`; the `/predict` payload and response remain unchanged. Add a managed PostgreSQL database and set `DATABASE_URL`, `MODEL_METADATA_PATH`, `PRODUCTION_MODEL_PATH`, and `MLOPS_ADMIN_TOKEN`. Generated drift reports and local artifact state are not durable on an ephemeral web-service filesystem; use scheduled monitoring with durable object storage or a separate monitoring service for production reports.

Vercel needs `NEXT_PUBLIC_API_URL=https://toolwear-api.onrender.com`. Deploy the backend changes before expecting all `/mlops` panels to populate. The frontend handles old/offline endpoints as unavailable states until then.

## Known limitations

- Data drift does not prove performance degradation.
- Performance monitoring requires actual wear labels submitted as feedback.
- Local SQLite is not persistent on Render.
- Generated local lifecycle and drift files are not shared across multiple API instances.
- Automatic retraining is intentionally not enabled.
- Model promotion requires explicit approval and authoritative quality thresholds.
- The legacy production model has no verified MLflow run ID, version, training time, or evaluation metadata; those fields remain unavailable until an approved candidate is promoted.
