"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    Activity,
    ArrowRight,
    CheckCircle2,
    Cpu,
    Gauge,
} from "lucide-react";

export default function Hero() {
    return (
        <section
            id="top"
            className="page-noise relative overflow-hidden bg-[#f6f4ef] pt-28 sm:pt-32"
        >
            <div className="pointer-events-none absolute -left-40 top-20 h-[460px] w-[460px] rounded-full bg-blue-300/30 blur-[120px]" />
            <div className="pointer-events-none absolute -right-48 bottom-0 h-[520px] w-[520px] rounded-full bg-violet-300/25 blur-[140px]" />

            <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.05fr_0.95fr]">
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                >
                    <div className="glass-panel-soft inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-zinc-800">
                        <Gauge size={17} aria-hidden="true" />
                        A clearer view of cutting-tool condition
                    </div>

                    <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.05em] text-zinc-950 sm:text-6xl md:text-7xl">
                        Understand cutting-tool condition before it interrupts production.
                    </h1>

                    <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-700 md:text-xl">
                        Enter the machining setup and current sensor measurements.
                        ToolWear AI sends them to the deployed model and returns a
                        plain-language wear estimate for review.
                    </p>

                    <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <Link
                            href="/dashboard"
                            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-zinc-950 px-7 font-bold text-white shadow-xl shadow-zinc-950/15 transition hover:-translate-y-1 hover:bg-blue-700"
                        >
                            Open prediction dashboard
                            <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                        <a
                            href="#how-it-works"
                            className="glass-panel-soft inline-flex min-h-14 items-center justify-center rounded-full px-7 font-bold text-zinc-900 transition hover:-translate-y-1 hover:bg-white/75"
                        >
                            See how it works
                        </a>
                    </div>

                    <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-zinc-600">
                        <TrustItem text="Simple guided inputs" />
                        <TrustItem text="Live FastAPI request" />
                        <TrustItem text="Saved local history" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 36, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                    className="relative"
                >
                    <div className="glass-panel rounded-[36px] p-3 sm:p-4">
                        <div className="rounded-[28px] border border-white/60 bg-white/45 p-5 backdrop-blur-2xl sm:p-8">
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                    <p className="text-sm font-medium text-zinc-500">
                                        Dashboard preview
                                    </p>
                                    <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                                        Tool condition overview
                                    </h2>
                                </div>
                                <span className="w-fit rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-blue-800">
                                    Illustrative sample
                                </span>
                            </div>

                            <div className="mt-7 grid gap-4 sm:grid-cols-2">
                                <PreviewFeature
                                    icon={<Cpu size={22} />}
                                    title="Machining setup"
                                    text="Cutting time, depth, feed, case, run, and material"
                                />
                                <PreviewFeature
                                    icon={<Activity size={22} />}
                                    title="Sensor profile"
                                    text="Normalized current, vibration, and acoustic inputs"
                                />
                            </div>

                            <div className="glass-panel-dark mt-5 rounded-[26px] p-6 text-white sm:p-7">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className="text-sm text-zinc-300">
                                        Illustrative result - not live data
                                    </span>
                                    <span className="rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-bold text-amber-200">
                                        Medium wear
                                    </span>
                                </div>
                                <div className="mt-5 flex items-end gap-2">
                                    <span className="text-5xl font-black tracking-[-0.05em] sm:text-6xl">
                                        0.2595
                                    </span>
                                    <span className="pb-2 text-zinc-400">VB</span>
                                </div>
                                <p className="mt-5 text-sm leading-6 text-zinc-300">
                                    A real result appears only after the dashboard receives a
                                    successful API response.
                                </p>
                                <div className="mt-6 grid grid-cols-6 items-end gap-2" aria-hidden="true">
                                    {[42, 58, 36, 70, 52, 63].map((height, index) => (
                                        <div
                                            key={index}
                                            className="rounded-t-md bg-blue-400/70"
                                            style={{ height: `${height}px` }}
                                        />
                                    ))}
                                </div>
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
            <CheckCircle2 size={17} className="text-emerald-600" aria-hidden="true" />
            {text}
        </div>
    );
}

function PreviewFeature({
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
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100/80 text-blue-700" aria-hidden="true">
                {icon}
            </div>
            <h3 className="mt-4 font-bold text-zinc-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p>
        </div>
    );
}
