FROM python:3.12-slim

RUN pip install --no-cache-dir mlflow==3.14.0 "psycopg[binary]==3.3.4"

WORKDIR /mlflow

CMD ["sh", "-c", "mlflow server --host 0.0.0.0 --port ${PORT:-5000}"]