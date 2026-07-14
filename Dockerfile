FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .
RUN echo "Checking monitoring artifacts..." \
    && ls -la /app/artifacts \
    && test -f /app/artifacts/pipeline_status.json \
    && test -f /app/artifacts/lifecycle_status.json \
    && cat /app/artifacts/pipeline_status.json

ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]