import type {
    ApiResult,
    DriftFeature,
    DriftSummary,
    LatencyPoint,
    LatencySeries,
    LifecycleStatus,
    ModelInfo,
    MonitoringSnapshot,
    MonitoringSummary,
    PipelineStatus,
    PredictionDistribution,
} from "@/types/monitoring";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://toolwear-api.onrender.com";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown, label: string): JsonRecord {
    if (!isRecord(value)) {
        throw new Error(`${label} returned malformed data.`);
    }
    return value;
}

function stringOrNull(value: unknown): string | null {
    return typeof value === "string" ? value : null;
}

function finiteNumber(value: unknown, fallback = 0): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function numberOrNull(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanOrNull(value: unknown): boolean | null {
    return typeof value === "boolean" ? value : null;
}

async function fetchJson(path: string, signal: AbortSignal): Promise<unknown> {
    const response = await fetch(`${API_URL}${path}`, {
        cache: "no-store",
        signal,
    });
    if (!response.ok) {
        throw new Error(`${path} returned HTTP ${response.status}.`);
    }
    return response.json() as Promise<unknown>;
}

function parseModelInfo(value: unknown): ModelInfo {
    const record = asRecord(value, "Model information");
    const metricRecord = isRecord(record.metrics) ? record.metrics : {};
    const metrics = Object.fromEntries(
        Object.entries(metricRecord).filter(
            (entry): entry is [string, number] =>
                typeof entry[1] === "number" && Number.isFinite(entry[1]),
        ),
    );
    return {
        status: stringOrNull(record.status) ?? "unavailable",
        model_name: stringOrNull(record.model_name),
        model_version: stringOrNull(record.model_version),
        mlflow_run_id: stringOrNull(record.mlflow_run_id),
        dataset_hash: stringOrNull(record.dataset_hash),
        trained_at: stringOrNull(record.trained_at),
        features: Array.isArray(record.features)
            ? record.features.filter((feature): feature is string => typeof feature === "string")
            : [],
        metrics,
    };
}

function parseMonitoringSummary(value: unknown): MonitoringSummary {
    const record = asRecord(value, "Monitoring summary");
    const performance = isRecord(record.performance) ? record.performance : {};
    return {
        status: stringOrNull(record.status) ?? "unavailable",
        prediction_count: finiteNumber(record.prediction_count),
        successful_requests: finiteNumber(record.successful_requests),
        failed_requests: finiteNumber(record.failed_requests),
        average_latency_ms: numberOrNull(record.average_latency_ms),
        p95_latency_ms: numberOrNull(record.p95_latency_ms),
        p95_minimum_samples: finiteNumber(record.p95_minimum_samples, 20),
        performance: {
            labeled_prediction_count: finiteNumber(performance.labeled_prediction_count),
            mae: numberOrNull(performance.mae),
            rmse: numberOrNull(performance.rmse),
        },
        updated_at: stringOrNull(record.updated_at),
    };
}

function parseLatency(value: unknown): LatencySeries {
    const record = asRecord(value, "Latency monitoring");
    const points: LatencyPoint[] = Array.isArray(record.points)
        ? record.points.flatMap((item) => {
              if (!isRecord(item)) return [];
              const timestamp = stringOrNull(item.timestamp);
              const latency = numberOrNull(item.latency_ms);
              if (!timestamp || latency === null || typeof item.request_success !== "boolean") {
                  return [];
              }
              return [{ timestamp, latency_ms: latency, request_success: item.request_success }];
          })
        : [];
    return {
        status: stringOrNull(record.status) ?? (points.length ? "available" : "empty"),
        points,
    };
}

function parseDistribution(value: unknown): PredictionDistribution {
    const record = asRecord(value, "Prediction distribution");
    const bands = Array.isArray(record.bands)
        ? record.bands.flatMap((item) => {
              if (!isRecord(item)) return [];
              const status = stringOrNull(item.status);
              const count = numberOrNull(item.count);
              return status && count !== null ? [{ status, count }] : [];
          })
        : [];
    return {
        status: stringOrNull(record.status) ?? (bands.length ? "available" : "empty"),
        total: finiteNumber(record.total),
        bands,
        interpretation:
            stringOrNull(record.interpretation) ??
            "Dashboard wear bands, not model confidence.",
    };
}

function parseDrift(value: unknown): DriftSummary {
    const record = asRecord(value, "Drift monitoring");
    const features: DriftFeature[] = Array.isArray(record.features)
        ? record.features.flatMap((item) => {
              if (!isRecord(item)) return [];
              const feature = stringOrNull(item.feature);
              return feature
                  ? [{
                        feature,
                        drift_score: numberOrNull(item.drift_score),
                        drift_detected: booleanOrNull(item.drift_detected),
                    }]
                  : [];
          })
        : [];
    return {
        status: stringOrNull(record.status) ?? "unavailable",
        generated_at: stringOrNull(record.generated_at),
        current_sample_count: finiteNumber(record.current_sample_count),
        minimum_current_samples: numberOrNull(record.minimum_current_samples),
        dataset_drift_detected: booleanOrNull(record.dataset_drift_detected),
        drifted_feature_count: numberOrNull(record.drifted_feature_count),
        drifted_feature_share: numberOrNull(record.drifted_feature_share),
        prediction_drift_detected: booleanOrNull(record.prediction_drift_detected),
        features,
        message: stringOrNull(record.message) ?? "Drift status is unavailable.",
    };
}

function parseLifecycle(value: unknown): LifecycleStatus {
    const record = asRecord(value, "Model lifecycle");
    return {
        status: stringOrNull(record.status) ?? undefined,
        current_champion: record.current_champion ?? null,
        latest_candidate: record.latest_candidate ?? null,
        last_training_run: record.last_training_run ?? null,
        last_promotion: record.last_promotion ?? null,
    };
}

function parsePipeline(value: unknown): PipelineStatus {
    const record = asRecord(value, "Pipeline status");
    return {
        status: stringOrNull(record.status) ?? undefined,
        updated_at: stringOrNull(record.updated_at),
        training: stringOrNull(record.training) ?? "unavailable",
        evaluation: stringOrNull(record.evaluation) ?? "unavailable",
        registry: stringOrNull(record.registry) ?? "unavailable",
        deployment: stringOrNull(record.deployment) ?? "unavailable",
    };
}

function settled<T>(result: PromiseSettledResult<T>): ApiResult<T> {
    if (result.status === "fulfilled") {
        return { data: result.value, error: null };
    }
    const message = result.reason instanceof Error ? result.reason.message : "Request failed.";
    return { data: null, error: message };
}

export async function fetchMonitoringSnapshot(
    signal: AbortSignal,
): Promise<MonitoringSnapshot> {
    const results = await Promise.allSettled([
        fetchJson("/model-info", signal).then(parseModelInfo),
        fetchJson("/monitoring/summary", signal).then(parseMonitoringSummary),
        fetchJson("/monitoring/latency", signal).then(parseLatency),
        fetchJson("/monitoring/prediction-distribution", signal).then(parseDistribution),
        fetchJson("/monitoring/drift/latest", signal).then(parseDrift),
        fetchJson("/monitoring/lifecycle", signal).then(parseLifecycle),
        fetchJson("/monitoring/pipeline", signal).then(parsePipeline),
    ] as const);

    return {
        modelInfo: settled(results[0]),
        summary: settled(results[1]),
        latency: settled(results[2]),
        distribution: settled(results[3]),
        drift: settled(results[4]),
        lifecycle: settled(results[5]),
        pipeline: settled(results[6]),
    };
}
