"use client";

import { Clock3, Trash2 } from "lucide-react";

import { getWearStatus } from "@/lib/wear-status";
import type { PredictionHistoryEntry } from "@/types/prediction";

function formatTimestamp(timestamp: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "medium",
    }).format(new Date(timestamp));
}

function materialName(code: number) {
    if (code === 1) return "Cast iron";
    if (code === 2) return "Steel";
    return `Code ${code}`;
}

export default function PredictionHistory({
    history,
    onRemove,
    onClear,
}: {
    history: PredictionHistoryEntry[];
    onRemove: (id: string) => void;
    onClear: () => void;
}) {
    return (
        <section className="glass-panel rounded-[30px] p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-semibold text-blue-700">Saved locally</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                        Recent results
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                        History stays in this browser and is limited to twenty entries.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClear}
                    disabled={history.length === 0}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white/60 px-4 text-sm font-bold text-zinc-800 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Trash2 size={16} aria-hidden="true" />
                    Clear history
                </button>
            </div>

            {history.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white/30 p-8 text-center">
                    <Clock3 className="mx-auto text-zinc-400" aria-hidden="true" />
                    <p className="mt-3 font-bold text-zinc-800">No saved results</p>
                    <p className="mt-2 text-sm text-zinc-600">
                        Successful predictions will appear here.
                    </p>
                </div>
            ) : (
                <ol className="mt-6 space-y-3">
                    {history.map((entry) => {
                        const status = getWearStatus(entry.prediction);

                        return (
                            <li
                                key={entry.id}
                                className="rounded-2xl border border-white/70 bg-white/50 p-4 shadow-sm"
                            >
                                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xl font-black text-zinc-950">
                                                {entry.prediction.toFixed(4)} VB
                                            </span>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-bold ${status.badgeClass}`}
                                            >
                                                {status.level}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-zinc-500">
                                            {formatTimestamp(entry.timestamp)}
                                        </p>
                                        <p className="mt-3 text-sm leading-6 text-zinc-700">
                                            Case {entry.inputs.case}, run {entry.inputs.run} · {materialName(entry.inputs.material)} · DOC {entry.inputs.DOC} mm · feed {entry.inputs.feed} mm/rev
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onRemove(entry.id)}
                                        aria-label={`Remove prediction from ${formatTimestamp(entry.timestamp)}`}
                                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50/70 px-4 text-sm font-bold text-red-800 transition hover:bg-red-100"
                                    >
                                        <Trash2 size={16} aria-hidden="true" />
                                        Remove
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}
