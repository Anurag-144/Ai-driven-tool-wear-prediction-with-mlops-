"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Boxes,
    CheckCircle2,
    Clock3,
    Database,
    GitBranch,
    RefreshCw,
    ServerCog,
    ShieldCheck,
} from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { fetchMonitoringSnapshot } from "@/lib/monitoring-api";
import type {
    ApiResult,
    LifecycleStatus,
    MonitoringSnapshot,
} from "@/types/monitoring";

const emptySnapshot: MonitoringSnapshot = {
    modelInfo: { data: null, error: null },
    summary: { data: null, error: null },
    latency: { data: null, error: null },
    distribution: { data: null, error: null },
    drift: { data: null, error: null },
    lifecycle: { data: null, error: null },
    pipeline: { data: null, error: null },
};

function failedSnapshot(message: string): MonitoringSnapshot {
    const failed = { data: null, error: message };
    return {
        modelInfo: failed,
        summary: failed,
        latency: failed,
        distribution: failed,
        drift: failed,
        lifecycle: failed,
        pipeline: failed,
    };
}

function formatNumber(value: number | null | undefined, digits = 3): string {
    return typeof value === "number" && Number.isFinite(value)
        ? value.toFixed(digits)
        : "Unavailable";
}

function formatDate(value: string | null | undefined): string {
    if (!value) return "Unavailable";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "Unavailable"
        : new Intl.DateTimeFormat(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
          }).format(date);
}

function shortened(value: string | null | undefined): string {
    if (!value) return "Unavailable";
    return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value;
}

function titleCase(value: string): string {
    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function Panel({
    eyebrow,
    title,
    description,
    icon,
    children,
    className = "",
}: {
    eyebrow: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={`glass-panel rounded-[30px] p-6 sm:p-7 ${className}`}>
            <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/15">
                    {icon}
                </span>
                <div>
                    <p className="text-sm font-semibold text-blue-700">{eyebrow}</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                        {title}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                        {description}
                    </p>
                </div>
            </div>
            <div className="mt-6">{children}</div>
        </section>
    );
}

function Unavailable({ result }: { result: ApiResult<unknown> }) {
    return (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/35 p-6 text-center">
            <p className="font-bold text-zinc-800">Information unavailable</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
                {result.error ?? "The service has not recorded this information yet."}
            </p>
        </div>
    );
}

function DataField({ label, value, title }: { label: string; value: string; title?: string }) {
    return (
        <div className="rounded-2xl border border-white/70 bg-white/45 p-4">
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                {label}
            </dt>
            <dd className="mt-2 break-words text-sm font-bold text-zinc-950" title={title}>
                {value}
            </dd>
        </div>
    );
}

function MetricCard({
    label,
    value,
    note,
}: {
    label: string;
    value: string;
    note?: string;
}) {
    return (
        <div className="rounded-2xl border border-white/70 bg-white/48 p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-600">{label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{value}</p>
            {note && <p className="mt-2 text-xs leading-5 text-zinc-500">{note}</p>}
        </div>
    );
}

function lifecycleSummary(value: unknown): string {
    if (value === null || value === undefined) return "Unavailable";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (typeof value !== "object" || Array.isArray(value)) return "Unavailable";
    const record = value as Record<string, unknown>;
    const parts = [
        typeof record.model_version === "string" ? `Version ${record.model_version}` : null,
        typeof record.status === "string" ? titleCase(record.status) : null,
        typeof record.quality_gate === "string" ? `Gate: ${titleCase(record.quality_gate)}` : null,
        typeof record.run_id === "string" ? `Run ${shortened(record.run_id)}` : null,
    ].filter((part): part is string => part !== null);
    return parts.length ? parts.join(" · ") : "Recorded details unavailable";
}

function LifecycleGrid({ lifecycle }: { lifecycle: LifecycleStatus }) {
    const items = [
        ["Current champion", lifecycle.current_champion],
        ["Latest candidate", lifecycle.latest_candidate],
        ["Last training run", lifecycle.last_training_run],
        ["Last promotion", lifecycle.last_promotion],
    ] as const;
    return (
        <dl className="grid gap-3 sm:grid-cols-2">
            {items.map(([label, value]) => (
                <DataField key={label} label={label} value={lifecycleSummary(value)} />
            ))}
        </dl>
    );
}

export default function MlopsDashboard() {
    const [snapshot, setSnapshot] = useState<MonitoringSnapshot>(emptySnapshot);
    const [loading, setLoading] = useState(true);
    const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
    const controllerRef = useRef<AbortController | null>(null);

    const refresh = useCallback(async () => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        setLoading(true);
        const timeout = window.setTimeout(() => controller.abort(), 15000);
        try {
            const nextSnapshot = await fetchMonitoringSnapshot(controller.signal);
            if (controllerRef.current === controller) {
                setSnapshot(nextSnapshot);
                setRefreshedAt(new Date().toISOString());
            }
        } catch (error) {
            if (controllerRef.current === controller) {
                const message =
                    error instanceof DOMException && error.name === "AbortError"
                        ? "The monitoring API did not respond within 15 seconds."
                        : error instanceof Error
                          ? error.message
                          : "Monitoring request failed.";
                setSnapshot(failedSnapshot(message));
            }
        } finally {
            window.clearTimeout(timeout);
            if (controllerRef.current === controller) {
                controllerRef.current = null;
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const initial = window.setTimeout(() => void refresh(), 0);
        return () => {
            window.clearTimeout(initial);
            controllerRef.current?.abort();
            controllerRef.current = null;
        };
    }, [refresh]);

    const unavailableCount = useMemo(
        () => Object.values(snapshot).filter((result) => result.data === null).length,
        [snapshot],
    );
    const model = snapshot.modelInfo.data;
    const summary = snapshot.summary.data;
    const latency = snapshot.latency.data;
    const distribution = snapshot.distribution.data;
    const drift = snapshot.drift.data;
    const pipeline = snapshot.pipeline.data;

    const latencyChart = (latency?.points ?? []).map((point) => ({
        ...point,
        time: new Intl.DateTimeFormat(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(new Date(point.timestamp)),
    }));

    return (
        <div className="page-noise relative overflow-hidden">
            <div className="pointer-events-none absolute -left-28 top-32 h-80 w-80 rounded-full bg-blue-300/20 blur-[110px]" />
            <div className="pointer-events-none absolute -right-32 top-[34rem] h-96 w-96 rounded-full bg-violet-300/20 blur-[120px]" />

            <div className="relative mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-800">
                            <ServerCog size={15} aria-hidden="true" /> MLOps operations
                        </div>
                        <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.045em] text-zinc-950 sm:text-5xl lg:text-6xl">
                            Model and service health, without invented production data.
                        </h1>
                        <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-600 sm:text-lg">
                            Review model lineage, real prediction traffic, latency, drift,
                            and pipeline state reported by the FastAPI service.
                        </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 lg:items-end">
                        <button
                            type="button"
                            onClick={() => void refresh()}
                            disabled={loading}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
                        >
                            <RefreshCw
                                size={17}
                                className={loading ? "animate-spin" : ""}
                                aria-hidden="true"
                            />
                            {loading ? "Refreshing" : "Refresh monitoring"}
                        </button>
                        <p className="text-xs text-zinc-500" aria-live="polite">
                            {refreshedAt ? `Last refreshed ${formatDate(refreshedAt)}` : "Waiting for the API"}
                        </p>
                    </div>
                </div>

                {!loading && unavailableCount === Object.keys(snapshot).length && (
                    <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900" role="status">
                        <AlertTriangle className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
                        <p className="text-sm leading-6">
                            The monitoring API is offline or does not expose the new endpoints yet.
                            The page will keep its empty states instead of showing sample values.
                        </p>
                    </div>
                )}

                <div className="mt-10 grid gap-6 xl:grid-cols-2">
                    <Panel
                        eyebrow="Deployed artifact"
                        title="Current model"
                        description="Production metadata is shown only when it is associated with the model currently used for inference."
                        icon={<Boxes size={20} aria-hidden="true" />}
                    >
                        {model ? (
                            <dl className="grid gap-3 sm:grid-cols-2">
                                <DataField label="Model name" value={model.model_name ?? "Unavailable"} />
                                <DataField label="Model version" value={model.model_version ?? "Unavailable"} />
                                <DataField
                                    label="MLflow run ID"
                                    value={shortened(model.mlflow_run_id)}
                                    title={model.mlflow_run_id ?? undefined}
                                />
                                <DataField
                                    label="Dataset hash"
                                    value={shortened(model.dataset_hash)}
                                    title={model.dataset_hash ?? undefined}
                                />
                                <DataField label="Trained" value={formatDate(model.trained_at)} />
                                <DataField label="Expected features" value={String(model.features.length)} />
                            </dl>
                        ) : (
                            <Unavailable result={snapshot.modelInfo} />
                        )}
                    </Panel>

                    <Panel
                        eyebrow="Held-out evaluation"
                        title="Model evaluation"
                        description="Metrics remain unavailable until verified production-model metadata contains them."
                        icon={<BarChart3 size={20} aria-hidden="true" />}
                    >
                        {model ? (
                            <div className="grid gap-3 sm:grid-cols-3">
                                <MetricCard label="MAE" value={formatNumber(model.metrics.mae, 4)} />
                                <MetricCard label="RMSE" value={formatNumber(model.metrics.rmse, 4)} />
                                <MetricCard label="R²" value={formatNumber(model.metrics.r2, 4)} />
                            </div>
                        ) : (
                            <Unavailable result={snapshot.modelInfo} />
                        )}
                    </Panel>
                </div>

                <Panel
                    eyebrow="Real API traffic"
                    title="Service monitoring"
                    description="Counts and latency are aggregated from persisted prediction records; raw request features are not exposed."
                    icon={<Activity size={20} aria-hidden="true" />}
                    className="mt-6"
                >
                    {summary ? (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            <MetricCard label="Predictions" value={String(summary.prediction_count)} />
                            <MetricCard label="Successful" value={String(summary.successful_requests)} />
                            <MetricCard label="Failed" value={String(summary.failed_requests)} />
                            <MetricCard
                                label="Average latency"
                                value={summary.average_latency_ms === null ? "Unavailable" : `${formatNumber(summary.average_latency_ms, 1)} ms`}
                            />
                            <MetricCard
                                label="P95 latency"
                                value={summary.p95_latency_ms === null ? "Unavailable" : `${formatNumber(summary.p95_latency_ms, 1)} ms`}
                                note={summary.p95_latency_ms === null ? `Requires ${summary.p95_minimum_samples} requests.` : undefined}
                            />
                        </div>
                    ) : (
                        <Unavailable result={snapshot.summary} />
                    )}
                </Panel>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <Panel
                        eyebrow="Wear bands"
                        title="Prediction distribution"
                        description="Aggregated from successful production predictions using the dashboard interpretation bands."
                        icon={<Database size={20} aria-hidden="true" />}
                    >
                        {distribution?.bands.length ? (
                            <>
                                <div className="h-[300px] w-full" role="img" aria-label={`Bar chart of ${distribution.total} logged predictions by wear band`}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={distribution.bands} margin={{ top: 10, right: 8, left: -18, bottom: 4 }}>
                                            <CartesianGrid strokeDasharray="4 4" stroke="#d4d4d8" vertical={false} />
                                            <XAxis dataKey="status" tick={{ fontSize: 12, fill: "#52525b" }} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#52525b" }} />
                                            <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #e4e4e7" }} />
                                            <Bar dataKey="count" name="Predictions" fill="#2563eb" radius={[8, 8, 0, 0]} maxBarSize={54} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="mt-3 text-xs leading-5 text-zinc-600">{distribution.interpretation}</p>
                            </>
                        ) : distribution ? (
                            <Unavailable result={{ data: null, error: "No successful predictions have been logged." }} />
                        ) : (
                            <Unavailable result={snapshot.distribution} />
                        )}
                    </Panel>

                    <Panel
                        eyebrow="Request performance"
                        title="API latency"
                        description="The most recent request latencies from the prediction log."
                        icon={<Clock3 size={20} aria-hidden="true" />}
                    >
                        {latencyChart.length ? (
                            <div className="h-[330px] w-full" role="img" aria-label={`Line chart of ${latencyChart.length} real API latency observations`}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={latencyChart} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
                                        <CartesianGrid strokeDasharray="4 4" stroke="#d4d4d8" />
                                        <XAxis dataKey="time" minTickGap={28} tick={{ fontSize: 12, fill: "#52525b" }} />
                                        <YAxis width={52} unit=" ms" tick={{ fontSize: 12, fill: "#52525b" }} />
                                        <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} ms`, "Latency"]} contentStyle={{ borderRadius: 14, border: "1px solid #e4e4e7" }} />
                                        <Line type="monotone" dataKey="latency_ms" name="Latency" stroke="#2563eb" strokeWidth={3} dot={{ r: 3, fill: "#2563eb" }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : latency ? (
                            <Unavailable result={{ data: null, error: "No prediction latency has been logged." }} />
                        ) : (
                            <Unavailable result={snapshot.latency} />
                        )}
                    </Panel>
                </div>

                <Panel
                    eyebrow="Distribution checks"
                    title="Drift monitoring"
                    description="Compares real production inputs and predictions with the approved reference data."
                    icon={<ShieldCheck size={20} aria-hidden="true" />}
                    className="mt-6"
                >
                    {drift ? (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <MetricCard label="Latest report" value={formatDate(drift.generated_at)} />
                                <MetricCard label="Current samples" value={String(drift.current_sample_count)} />
                                <MetricCard
                                    label="Dataset drift"
                                    value={drift.dataset_drift_detected === null ? "Unavailable" : drift.dataset_drift_detected ? "Detected" : "Not detected"}
                                />
                                <MetricCard label="Drifted features" value={drift.drifted_feature_count === null ? "Unavailable" : String(drift.drifted_feature_count)} />
                            </div>
                            <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-sm leading-6 text-blue-950">
                                Data drift means production inputs differ from the training reference data. It does not automatically prove that model accuracy has decreased.
                            </div>
                            {drift.status === "insufficient_data" && (
                                <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white/35 p-5 text-sm leading-6 text-zinc-700">
                                    {drift.message}
                                </div>
                            )}
                            {drift.features.length > 0 && (
                                <div className="mt-5 overflow-x-auto rounded-2xl border border-white/70 bg-white/45">
                                    <table className="w-full min-w-[600px] text-left text-sm">
                                        <caption className="sr-only">Feature-level drift results</caption>
                                        <thead className="border-b border-zinc-200 text-xs uppercase tracking-[0.12em] text-zinc-500">
                                            <tr><th className="px-4 py-3">Feature</th><th className="px-4 py-3">Drift score</th><th className="px-4 py-3">Result</th></tr>
                                        </thead>
                                        <tbody>
                                            {drift.features.map((feature) => (
                                                <tr key={feature.feature} className="border-b border-zinc-100 last:border-0">
                                                    <th scope="row" className="px-4 py-3 font-bold text-zinc-900">{feature.feature}</th>
                                                    <td className="px-4 py-3 text-zinc-700">{formatNumber(feature.drift_score, 4)}</td>
                                                    <td className="px-4 py-3 text-zinc-700">{feature.drift_detected === null ? "Unavailable" : feature.drift_detected ? "Drift detected" : "No drift detected"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : (
                        <Unavailable result={snapshot.drift} />
                    )}
                </Panel>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <Panel
                        eyebrow="Registry workflow"
                        title="Model lifecycle"
                        description="Candidate and champion state is read from real training and promotion artifacts."
                        icon={<GitBranch size={20} aria-hidden="true" />}
                    >
                        {snapshot.lifecycle.data ? (
                            <LifecycleGrid lifecycle={snapshot.lifecycle.data} />
                        ) : (
                            <Unavailable result={snapshot.lifecycle} />
                        )}
                    </Panel>
                    <Panel
                        eyebrow="Reproducible workflow"
                        title="Pipeline status"
                        description="The latest recorded state for training, evaluation, registry, and deployment."
                        icon={<CheckCircle2 size={20} aria-hidden="true" />}
                    >
                        {pipeline ? (
                            <dl className="grid gap-3 sm:grid-cols-2">
                                {(["training", "evaluation", "registry", "deployment"] as const).map((stage) => (
                                    <DataField key={stage} label={titleCase(stage)} value={titleCase(pipeline[stage])} />
                                ))}
                            </dl>
                        ) : (
                            <Unavailable result={snapshot.pipeline} />
                        )}
                    </Panel>
                </div>
            </div>
        </div>
    );
}
