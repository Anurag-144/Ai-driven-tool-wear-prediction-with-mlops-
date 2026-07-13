"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
    Activity,
    ArrowRight,
    BrainCircuit,
    Eye,
    Send,
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
        title: "Enter machining setup",
        description:
            "Provide the cutting time, depth of cut, feed, case, run, and documented material code.",
        icon: SlidersHorizontal,
    },
    {
        number: "02",
        title: "Adjust sensor measurements",
        description:
            "Set the six normalized current, vibration, and acoustic measurements.",
        icon: Activity,
    },
    {
        number: "03",
        title: "Send data to FastAPI",
        description:
            "The dashboard sends all twelve values to the deployed prediction endpoint over HTTPS.",
        icon: Send,
    },
    {
        number: "04",
        title: "Run the XGBoost model",
        description:
            "The backend passes the values to the trained regression model without changing the feature names.",
        icon: BrainCircuit,
    },
    {
        number: "05",
        title: "Review the result",
        description:
            "See the predicted VB value, dashboard wear band, practical explanation, and saved history.",
        icon: Eye,
    },
];

export default function HowItWorks() {
    return (
        <section
            id="how-it-works"
            className="scroll-mt-28 border-y border-zinc-200 bg-[#f3f1ec] py-24 md:py-32"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mx-auto max-w-3xl text-center">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
                        How it works
                    </p>
                    <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-zinc-950 md:text-6xl">
                        From machine inputs to a clear wear estimate.
                    </h2>
                    <p className="mt-5 text-lg leading-8 text-zinc-700">
                        Five straightforward steps connect the shop-floor information
                        to the model result.
                    </p>
                </div>

                <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <motion.article
                                key={step.number}
                                initial={{ opacity: 0, y: 22 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.45, delay: index * 0.06 }}
                                className="relative"
                            >
                                <div className="glass-panel h-full rounded-[26px] p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                                            <Icon size={22} aria-hidden="true" />
                                        </div>
                                        <span className="text-sm font-black text-zinc-400">
                                            {step.number}
                                        </span>
                                    </div>
                                    <h3 className="mt-6 text-lg font-black text-zinc-950">
                                        {step.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-zinc-600">
                                        {step.description}
                                    </p>
                                </div>

                                {index < steps.length - 1 && (
                                    <div className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 xl:flex">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm">
                                            <ArrowRight size={15} aria-hidden="true" />
                                        </div>
                                    </div>
                                )}
                            </motion.article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
