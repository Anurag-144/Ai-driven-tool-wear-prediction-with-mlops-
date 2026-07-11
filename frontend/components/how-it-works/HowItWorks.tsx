"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
    Activity,
    ArrowRight,
    BrainCircuit,
    Database,
    Gauge,
    Server,
    SlidersHorizontal,
} from "lucide-react";

interface WorkflowStep {
    number: string;
    title: string;
    description: string;
    icon: LucideIcon;
}

const steps: WorkflowStep[] = [
    {
        number: "01",
        title: "Machine parameters",
        description:
            "The user enters machining information such as case, run, time, depth of cut, feed rate and material.",
        icon: SlidersHorizontal,
    },
    {
        number: "02",
        title: "Sensor measurements",
        description:
            "Current, vibration and acoustic-emission measurements are collected from the machining system.",
        icon: Activity,
    },
    {
        number: "03",
        title: "FastAPI request",
        description:
            "The Next.js frontend sends all twelve input features to the deployed FastAPI backend.",
        icon: Server,
    },
    {
        number: "04",
        title: "XGBoost prediction",
        description:
            "The trained XGBoost regression model analyzes the features and estimates the tool-wear value.",
        icon: BrainCircuit,
    },
    {
        number: "05",
        title: "Maintenance insight",
        description:
            "The result is converted into a wear level and a recommended maintenance action.",
        icon: Gauge,
    },
];

export default function HowItWorks() {
    return (
        <section
            id="how-it-works"
            className="w-full scroll-mt-20 border-t border-zinc-200 bg-white py-24"
        >
            <div className="mx-auto max-w-7xl px-6">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                        <BrainCircuit size={17} />
                        System architecture
                    </div>

                    <h2 className="mt-5 text-4xl font-bold tracking-tight text-zinc-950 md:text-5xl">
                        From machining data to maintenance insight.
                    </h2>

                    <p className="mt-5 text-lg leading-8 text-zinc-600">
                        ToolWear AI connects the Next.js interface, FastAPI backend and
                        XGBoost model in one complete prediction workflow.
                    </p>
                </div>

                <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                    {steps.map((step, index) => {
                        const Icon = step.icon;

                        return (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.25 }}
                                transition={{
                                    duration: 0.45,
                                    delay: index * 0.08,
                                }}
                                className="relative"
                            >
                                <div className="h-full rounded-3xl border border-zinc-200 bg-zinc-50 p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-950/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                                            <Icon size={23} />
                                        </div>

                                        <span className="text-sm font-bold text-zinc-300">
                                            {step.number}
                                        </span>
                                    </div>

                                    <h3 className="mt-6 text-lg font-bold text-zinc-950">
                                        {step.title}
                                    </h3>

                                    <p className="mt-3 text-sm leading-6 text-zinc-500">
                                        {step.description}
                                    </p>
                                </div>

                                {index < steps.length - 1 && (
                                    <div className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 xl:flex">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm">
                                            <ArrowRight size={15} />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                <div className="mt-14 rounded-[32px] bg-zinc-950 p-8 text-white md:p-10">
                    <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">
                                Technology stack
                            </p>

                            <h3 className="mt-3 text-3xl font-bold">
                                Built as a complete machine-learning application.
                            </h3>

                            <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
                                The project combines data processing, model training, API
                                deployment, containerization and a responsive web dashboard.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <Technology icon={<BrainCircuit size={18} />} label="XGBoost" />
                            <Technology icon={<Server size={18} />} label="FastAPI" />
                            <Technology icon={<Database size={18} />} label="MLflow" />
                            <Technology icon={<Activity size={18} />} label="Next.js" />
                            <Technology icon={<Gauge size={18} />} label="Docker" />
                            <Technology
                                icon={<SlidersHorizontal size={18} />}
                                label="Tailwind"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Technology({
    icon,
    label,
}: {
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200">
            <span className="text-blue-400">{icon}</span>
            {label}
        </div>
    );
}