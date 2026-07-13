"use client";

import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { WEAR_THRESHOLDS } from "@/lib/wear-status";
import type { PredictionHistoryEntry } from "@/types/prediction";

function formatTime(timestamp: string) {
    return new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(new Date(timestamp));
}

export default function WearHistoryChart({
    history,
}: {
    history: PredictionHistoryEntry[];
}) {
    const chartData = history
        .slice()
        .reverse()
        .map((entry) => ({
            id: entry.id,
            time: formatTime(entry.timestamp),
            prediction: entry.prediction,
        }));

    return (
        <section className="glass-panel rounded-[30px] p-6">
            <div>
                <p className="text-sm font-semibold text-blue-700">Actual results</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                    Prediction history
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Up to twenty real API results from this browser are shown over time.
                </p>
            </div>

            {chartData.length === 0 ? (
                <div className="mt-6 flex h-[330px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/30 p-6 text-center">
                    <div>
                        <p className="font-bold text-zinc-800">No prediction history yet</p>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">
                            Run a prediction to add the first real result to this chart.
                        </p>
                    </div>
                </div>
            ) : (
                <div
                    className="mt-6 h-[330px] w-full"
                    role="img"
                    aria-label={`Line chart of ${chartData.length} saved tool-wear predictions`}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 12, right: 14, left: 0, bottom: 8 }}
                        >
                            <CartesianGrid strokeDasharray="4 4" stroke="#d4d4d8" />
                            <XAxis
                                dataKey="time"
                                tick={{ fontSize: 12, fill: "#52525b" }}
                                minTickGap={24}
                            />
                            <YAxis
                                domain={[0, "auto"]}
                                tick={{ fontSize: 12, fill: "#52525b" }}
                                width={46}
                                label={{
                                    value: "VB",
                                    angle: -90,
                                    position: "insideLeft",
                                    fill: "#52525b",
                                }}
                            />
                            <Tooltip
                                formatter={(value) => [
                                    Number(value).toFixed(4),
                                    "Predicted VB",
                                ]}
                                contentStyle={{
                                    borderRadius: 14,
                                    border: "1px solid #e4e4e7",
                                    boxShadow: "0 12px 30px rgba(24,24,27,0.10)",
                                }}
                            />
                            <ReferenceLine
                                y={WEAR_THRESHOLDS.lowUpperBound}
                                stroke="#10b981"
                                strokeDasharray="5 5"
                                ifOverflow="extendDomain"
                                label={{
                                    value: "Low / medium 0.20",
                                    position: "insideTopRight",
                                    fill: "#047857",
                                    fontSize: 11,
                                }}
                            />
                            <ReferenceLine
                                y={WEAR_THRESHOLDS.mediumUpperBound}
                                stroke="#ef4444"
                                strokeDasharray="5 5"
                                ifOverflow="extendDomain"
                                label={{
                                    value: "Medium / high 0.35",
                                    position: "insideTopRight",
                                    fill: "#b91c1c",
                                    fontSize: 11,
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="prediction"
                                name="Predicted VB"
                                stroke="#2563eb"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            <p className="mt-5 text-xs leading-5 text-zinc-600">
                The threshold lines are dashboard interpretation bands, not model
                confidence. Below 0.20 is low, below 0.35 is medium, and values at
                or above 0.35 are high.
            </p>
        </section>
    );
}
