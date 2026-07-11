"use client";

import { motion } from "framer-motion";
import {
    Activity,
    ArrowRight,
    BrainCircuit,
    CheckCircle2,
    Cpu,
} from "lucide-react";

export default function Hero() {
    return (
        <section
            id="home"
            className="page-noise relative w-full scroll-mt-20 overflow-hidden bg-[#f6f4ef]"
        >
            <div className="pointer-events-none absolute -left-40 top-20 h-[460px] w-[460px] rounded-full bg-blue-300/30 blur-[120px]" />
            <div className="pointer-events-none absolute -right-48 bottom-0 h-[520px] w-[520px] rounded-full bg-violet-300/25 blur-[140px]" />

            <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-[1.05fr_0.95fr]">
                <motion.div
                    initial={{ opacity: 0, y: 36 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.75, ease: "easeOut" }}
                >
                    <div className="glass-panel-soft inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-zinc-800">
                        <BrainCircuit size={17} />
                        AI-driven predictive maintenance
                    </div>

                    <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[1.02] tracking-[-0.04em] text-zinc-950 md:text-7xl">
                        Predict tool wear before production stops.
                    </h1>

                    <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-600 md:text-xl">
                        Analyze machining conditions and sensor signals with an XGBoost
                        model to estimate cutting-tool wear before it causes downtime.
                    </p>

                    <div className="mt-10 flex flex-wrap gap-4">
                        <a
                            href="#prediction"
                            className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-7 py-4 font-semibold text-white shadow-xl shadow-zinc-950/15 transition duration-300 hover:-translate-y-1 hover:bg-blue-600 hover:shadow-blue-600/25"
                        >
                            Start prediction
                            <ArrowRight size={18} />
                        </a>

                        <a
                            href="#how-it-works"
                            className="glass-panel-soft inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-zinc-900 transition duration-300 hover:-translate-y-1 hover:bg-white/70"
                        >
                            See how it works
                        </a>
                    </div>

                    <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 text-sm text-zinc-600">
                        <TrustItem text="XGBoost model" />
                        <TrustItem text="FastAPI backend" />
                        <TrustItem text="Real-time prediction" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 42, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.85, delay: 0.12, ease: "easeOut" }}
                    className="relative"
                >
                    <div className="glass-panel rounded-[36px] p-4">
                        <div className="rounded-[28px] border border-white/60 bg-white/45 p-8 backdrop-blur-2xl">
                            <div className="flex items-center justify-between gap-5">
                                <div>
                                    <p className="text-sm font-medium text-zinc-500">
                                        Prediction system
                                    </p>
                                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">
                                        Tool health analysis
                                    </h2>
                                </div>

                                <span className="rounded-full border border-emerald-200/70 bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-emerald-700 backdrop-blur-xl">
                                    API connected
                                </span>
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <FeatureCard
                                    icon={<Cpu size={23} />}
                                    title="Machine data"
                                    text="Case, run, time, DOC and feed"
                                />

                                <FeatureCard
                                    icon={<Activity size={23} />}
                                    title="Sensor data"
                                    text="Current, vibration and acoustic signals"
                                />
                            </div>

                            <div className="glass-panel-dark mt-6 rounded-[28px] p-7 text-white">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-zinc-400">
                                        Sample prediction
                                    </span>

                                    <span className="rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-300">
                                        Medium wear
                                    </span>
                                </div>

                                <div className="mt-5 flex items-end gap-2">
                                    <span className="text-6xl font-black tracking-[-0.05em]">
                                        0.2595
                                    </span>
                                    <span className="pb-2 text-zinc-400">VB</span>
                                </div>

                                <div className="mt-7">
                                    <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
                                        <span>Relative wear level</span>
                                        <span>52%</span>
                                    </div>

                                    <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "52%" }}
                                            transition={{ duration: 1, delay: 0.6 }}
                                            className="h-full rounded-full bg-amber-400"
                                        />
                                    </div>
                                </div>

                                <p className="mt-5 text-sm leading-6 text-zinc-400">
                                    This sample shows how the live workspace converts model output
                                    into a practical maintenance recommendation.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function TrustItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-2">
            <CheckCircle2 size={17} className="text-emerald-500" />
            {text}
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    text,
}: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <div className="glass-panel-soft rounded-2xl p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100/80 text-blue-600">
                {icon}
            </div>

            <h3 className="mt-4 font-bold text-zinc-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
        </div>
    );
}
