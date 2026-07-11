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

interface PredictionCardProps {
    prediction: number | null;
    loading: boolean;
}

const DISPLAY_MAX_WEAR = 0.5;

function getWearStatus(value: number) {
    if (value < 0.2) {
        return {
            title: "Healthy Tool",
            level: "Low wear",
            description:
                "The predicted wear is low. The tool can continue operating under the current machining conditions.",
            recommendation:
                "Continue machining and follow the normal inspection schedule.",
            badgeClass: "bg-emerald-100/85 text-emerald-700",
            iconClass: "bg-emerald-100 text-emerald-600",
            strokeClass: "stroke-emerald-500",
            Icon: CheckCircle2,
        };
    }

    if (value < 0.35) {
        return {
            title: "Monitor Tool",
            level: "Medium wear",
            description:
                "The tool shows a moderate level of wear. Continue operation carefully and monitor the sensor readings.",
            recommendation:
                "Schedule an inspection and monitor vibration and acoustic signals.",
            badgeClass: "bg-amber-100/85 text-amber-700",
            iconClass: "bg-amber-100 text-amber-600",
            strokeClass: "stroke-amber-500",
            Icon: AlertTriangle,
        };
    }

    return {
        title: "Maintenance Required",
        level: "High wear",
        description:
            "The predicted wear is high. Continuing operation may affect machining quality or increase failure risk.",
        recommendation:
            "Inspect the cutting tool and consider replacing it before the next run.",
        badgeClass: "bg-red-100/85 text-red-700",
        iconClass: "bg-red-100 text-red-600",
        strokeClass: "stroke-red-500",
        Icon: ShieldAlert,
    };
}

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
        <motion.aside
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55 }}
            className="glass-panel overflow-hidden rounded-[34px]"
        >
            <div className="border-b border-white/50 px-8 py-7">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-blue-600">
                            AI model output
                        </p>

                        <h2 className="mt-1 text-3xl font-black tracking-[-0.03em] text-zinc-950">
                            Tool wear analysis
                        </h2>
                    </div>

                    <div className="glass-panel-soft flex h-14 w-14 items-center justify-center rounded-2xl text-blue-600">
                        <Gauge size={26} />
                    </div>
                </div>
            </div>

            <div className="p-8">
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
        </motion.aside>
    );
}

function LoadingState() {
    return (
        <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-[480px] flex-col items-center justify-center text-center"
        >
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="glass-panel-soft flex h-20 w-20 items-center justify-center rounded-3xl text-blue-600"
            >
                <LoaderCircle size={36} />
            </motion.div>

            <h3 className="mt-7 text-2xl font-black text-zinc-950">
                Running prediction
            </h3>

            <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500">
                Sending machining and sensor measurements to the deployed XGBoost
                model.
            </p>

            <div className="mt-8 h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-white/60 shadow-inner">
                <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "300%" }}
                    transition={{
                        duration: 1.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="h-full w-1/3 rounded-full bg-blue-600"
                />
            </div>
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
            className="flex min-h-[480px] flex-col items-center justify-center text-center"
        >
            <div className="glass-panel-soft flex h-20 w-20 items-center justify-center rounded-3xl text-zinc-600">
                <Activity size={34} />
            </div>

            <h3 className="mt-7 text-2xl font-black text-zinc-950">
                Ready for prediction
            </h3>

            <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500">
                Configure the machine and sensor inputs, then run the AI model.
            </p>

            <div className="mt-8 grid w-full grid-cols-2 gap-3">
                <InfoBox label="Model" value="XGBoost" />
                <InfoBox label="Features" value="12 inputs" />
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
    const StatusIcon = status.Icon;

    return (
        <div>
            <motion.div
                initial={{
                    opacity: 0,
                    y: -12,
                    scale: 0.97,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                }}
                transition={{
                    duration: 0.4,
                    ease: "easeOut",
                }}
                className="mb-7 flex items-center gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-3 text-emerald-800 shadow-sm backdrop-blur-xl"
            >
                <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 16,
                        delay: 0.1,
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"
                >
                    <CheckCircle2 size={20} />
                </motion.div>

                <div>
                    <p className="text-sm font-bold">
                        Prediction completed
                    </p>

                    <p className="text-xs text-emerald-700">
                        The XGBoost model returned a valid tool-wear result.
                    </p>
                </div>
            </motion.div>
            <div className="grid grid-cols-[minmax(0,1fr)_112px] items-center gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-500">
                        Predicted tool wear
                    </p>

                    <div className="mt-2 flex flex-wrap items-end gap-2">
                        <span className="text-5xl font-black tracking-[-0.05em] text-zinc-950">
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
                        <StatusIcon size={23} />
                    </div>

                    <div>
                        <h3 className="font-bold text-zinc-950">
                            {status.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                            {status.description}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-200/60 bg-blue-50/65 p-5 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                    <Wrench
                        size={21}
                        className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <div>
                        <p className="text-sm font-bold text-blue-950">
                            Recommended action
                        </p>

                        <p className="mt-1 text-sm leading-6 text-blue-800">
                            {status.recommendation}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
                <InfoBox label="Model" value="XGBoost" />
                <InfoBox label="API status" value="Connected" />
            </div>
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
    const offset =
        circumference - (percentage / 100) * circumference;

    return (
        <div className="relative h-28 w-28 shrink-0">
            <svg viewBox="0 0 110 110" className="h-full w-full">
                <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.7)"
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
                    transition={{
                        duration: 0.9,
                        ease: "easeOut",
                    }}
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-zinc-950">
                    {percentage.toFixed(0)}%
                </span>

                <span className="text-[10px] font-medium text-zinc-500">
                    relative wear
                </span>
            </div>
        </div>
    );
}
function InfoBox({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="glass-panel-soft rounded-2xl p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                {label}
            </p>

            <p className="mt-1 font-bold text-zinc-900">{value}</p>
        </div>
    );
}
