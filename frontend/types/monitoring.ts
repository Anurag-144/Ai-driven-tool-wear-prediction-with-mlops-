export type ApiResult<T> = {
    data: T | null;
    error: string | null;
};

export type ModelInfo = {
    status: string;
    model_name: string | null;
    model_version: string | null;
    mlflow_run_id: string | null;
    dataset_hash: string | null;
    trained_at: string | null;
    features: string[];
    metrics: Record<string, number>;
};

export type MonitoringSummary = {
    status: string;
    prediction_count: number;
    successful_requests: number;
    failed_requests: number;
    average_latency_ms: number | null;
    p95_latency_ms: number | null;
    p95_minimum_samples: number;
    performance: {
        labeled_prediction_count: number;
        mae: number | null;
        rmse: number | null;
    };
    updated_at: string | null;
};

export type LatencyPoint = {
    timestamp: string;
    latency_ms: number;
    request_success: boolean;
};

export type LatencySeries = {
    status: string;
    points: LatencyPoint[];
};

export type PredictionDistribution = {
    status: string;
    total: number;
    bands: Array<{
        status: string;
        count: number;
    }>;
    interpretation: string;
};

export type DriftFeature = {
    feature: string;
    drift_score: number | null;
    drift_detected: boolean | null;
};

export type DriftSummary = {
    status: string;
    generated_at: string | null;
    current_sample_count: number;
    minimum_current_samples: number | null;
    dataset_drift_detected: boolean | null;
    drifted_feature_count: number | null;
    drifted_feature_share: number | null;
    prediction_drift_detected: boolean | null;
    features: DriftFeature[];
    message: string;
};

export type LifecycleStatus = {
    status?: string;
    current_champion: unknown;
    latest_candidate: unknown;
    last_training_run: unknown;
    last_promotion: unknown;
};

export type PipelineStatus = {
    status?: string;
    updated_at: string | null;
    training: string;
    evaluation: string;
    registry: string;
    deployment: string;
};

export type MonitoringSnapshot = {
    modelInfo: ApiResult<ModelInfo>;
    summary: ApiResult<MonitoringSummary>;
    latency: ApiResult<LatencySeries>;
    distribution: ApiResult<PredictionDistribution>;
    drift: ApiResult<DriftSummary>;
    lifecycle: ApiResult<LifecycleStatus>;
    pipeline: ApiResult<PipelineStatus>;
};
