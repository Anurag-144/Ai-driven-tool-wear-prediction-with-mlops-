"use client";

import { motion } from "framer-motion";
import {
    Activity,
    BellRing,
    ClipboardCheck,
    Factory,
    type LucideIcon,
} from "lucide-react";

const benefits: Array<{
    title: string;
    description: string;
    icon: LucideIcon;
}> = [
    {
        title: "Spot possible deterioration earlier",
        description:
            "Review a model estimate before wear becomes an unexpected production issue.",
        icon: BellRing,
    },
    {
        title: "Monitor machining signals",
        description:
            "See current, vibration, and acoustic inputs together in one understandable view.",
        icon: Activity,
    },
    {
        title: "Support maintenance decisions",
        description:
            "Use the estimate alongside physical inspection and your established maintenance process.",
        icon: ClipboardCheck,
    },
    {
        title: "Reduce avoidable interruption",
        description:
            "Bring tool-condition review into the normal production workflow before work is disrupted.",
        icon: Factory,
    },
];

export default function Benefits() {
    return (
        <section id="benefits" className="scroll-mt-28 bg-white py-24 md:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="max-w-3xl">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
                        Practical benefits
                    </p>
                    <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-zinc-950 md:text-6xl">
                        Built for the people keeping production moving.
                    </h2>
                    <p className="mt-5 text-lg leading-8 text-zinc-700">
                        The interface turns twelve technical inputs into a focused
                        review that manufacturing teams can understand and discuss.
                    </p>
                </div>

                <div className="mt-14 grid gap-5 md:grid-cols-2">
                    {benefits.map((benefit, index) => {
                        const Icon = benefit.icon;
                        return (
                            <motion.article
                                key={benefit.title}
                                initial={{ opacity: 0, y: 22 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.45, delay: index * 0.06 }}
                                className="rounded-[28px] border border-zinc-200 bg-[#f7f5f0] p-7 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 md:p-8"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
                                    <Icon size={23} aria-hidden="true" />
                                </div>
                                <h3 className="mt-6 text-xl font-black text-zinc-950">
                                    {benefit.title}
                                </h3>
                                <p className="mt-3 leading-7 text-zinc-600">
                                    {benefit.description}
                                </p>
                            </motion.article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
