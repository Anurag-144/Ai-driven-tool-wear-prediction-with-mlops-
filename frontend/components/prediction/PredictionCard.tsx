"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Gauge,
    LoaderCircle,
    ShieldAlert,
    Wrench,
} from "lucide-react";

import { getWearStatus, type WearBandKey } from "@/lib/wear-status";

interface PredictionCardProps {
    prediction: number | null;
    loading: boolean;
}

const DISPLAY_MAX_WEAR = 0.5;

const statusIcons = {
    low: CheckCircle2,
    medium: AlertTriangle,
    high: ShieldAlert,
} satisfies Record<WearBandKey, typeof CheckCircle2>;

export default function PredictionCard({
    prediction,
    loading,
}: PredictionCardProps) {
    const percentage =
        prediction === null
            ? 0
            : Math.min(
                Math.max((prediction / DISPLAY_MAX_WEAR) * 100, 0),
                100
            );

    return (
        <aside className="glass-panel h-auto overflow-hidden rounded-[30px]">
            <div className="border-b border-white/50 p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-blue-700">
                            Model output
                        </p>
                        <h2 className="mt-1 text-3xl font-black tracking-[-0.03em] text-zinc-950">
                            Tool wear result
                        </h2>
                    </div>

                    <div className="glass-panel-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-blue-700">
                        <Gauge size={23} aria-hidden="true" />
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-7">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <LoadingState />
                    ) : prediction === null ? (
                        <EmptyState />
                    ) : (
                        <motion.div
                            key={prediction}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.35 }}
                        >
                            <PredictionResult
                                prediction={prediction}
                                percentage={percentage}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </aside>
    );
}

function LoadingState() {
    return (
        <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-10 text-center"
        >
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="glass-panel-soft flex h-20 w-20 items-center justify-center rounded-3xl text-blue-700"
            >
                <LoaderCircle size={36} aria-hidden="true" />
            </motion.div>

            <h3 className="mt-7 text-2xl font-black text-zinc-950">
                Running prediction
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-600">
                Sending the twelve current inputs to the deployed FastAPI service.
            </p>
        </motion.div>
    );
}

function EmptyState() {
    return (
        <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 text-center"
        >
            <div className="glass-panel-soft flex h-20 w-20 items-center justify-center rounded-3xl text-zinc-600">
                <Activity size={34} aria-hidden="true" />
            </div>
            <h3 className="mt-7 text-2xl font-black text-zinc-950">
                Ready for a prediction
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-600">
                Review the machining setup and normalized sensor measurements,
                then send them to the model.
            </p>

            <div className="mt-8 w-full rounded-2xl border border-blue-200/70 bg-blue-50/70 p-4 text-left text-xs leading-5 text-blue-900">
                Low, medium, and high are dashboard interpretation bands. They
                are not model confidence scores.
            </div>
        </motion.div>
    );
}

function PredictionResult({
    prediction,
    percentage,
}: {
    prediction: number;
    percentage: number;
}) {
    const status = getWearStatus(prediction);
    const StatusIcon = statusIcons[status.key];

    return (
        <div>
            <div className="mb-7 flex items-center gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-3 text-emerald-900 shadow-sm backdrop-blur-xl">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={20} aria-hidden="true" />
                </div>
                <div>
                    <p className="text-sm font-bold">Prediction completed</p>
                    <p className="text-xs text-emerald-800">
                        A valid wear estimate was returned by the API.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[minmax(0,1fr)_128px]">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-600">
                        Predicted tool wear
                    </p>
                    <div className="mt-2 flex flex-wrap items-end gap-2">
                        <span className="break-all text-5xl font-black tracking-[-0.05em] text-zinc-950">
                            {prediction.toFixed(4)}
                        </span>
                        <span className="pb-1 text-base font-medium text-zinc-500">
                            VB
                        </span>
                    </div>
                    <span
                        className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${status.badgeClass}`}
                    >
                        {status.level}
                    </span>
                </div>

                <CircularGauge
                    percentage={percentage}
                    strokeClass={status.strokeClass}
                />
            </div>

            <div className="glass-panel-soft mt-8 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${status.iconClass}`}
                    >
                        <StatusIcon size={23} aria-hidden="true" />
                    </div>
                    <div>
                        <h3 className="font-bold text-zinc-950">{status.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-zinc-700">
                            {status.summary}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-200/70 bg-blue-50/70 p-5">
                <div className="flex items-start gap-3">
                    <Wrench
                        size={21}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-blue-700"
                    />
                    <div>
                        <p className="text-sm font-bold text-blue-950">
                            Recommended next step
                        </p>
                        <p className="mt-1 text-sm leading-6 text-blue-900">
                            {status.recommendation}
                        </p>
                    </div>
                </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-zinc-600">
                This result is a model estimate and should be combined with
                physical inspection and established maintenance procedures.
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
                The circular gauge is a display scale, not a confidence score.
                Status bands: below 0.20 low, below 0.35 medium, otherwise high.
            </p>
        </div>
    );
}

function CircularGauge({
    percentage,
    strokeClass,
}: {
    percentage: number;
    strokeClass: string;
}) {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative mx-auto h-32 w-32 shrink-0" aria-hidden="true">
            <svg viewBox="0 0 110 110" className="h-full w-full">
                <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.75)"
                    strokeWidth="9"
                />
                <motion.circle
                    cx="55"
                    cy="55"
                    r={radius}
                    fill="none"
                    strokeWidth="9"
                    strokeLinecap="round"
                    className={strokeClass}
                    transform="rotate(-90 55 55)"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-zinc-950">
                    {percentage.toFixed(0)}%
                </span>
                <span className="text-xs font-medium text-zinc-500">display scale</span>
            </div>
        </div>
    );
}
