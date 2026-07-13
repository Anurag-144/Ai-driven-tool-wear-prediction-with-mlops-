import Link from "next/link";
import { ArrowRight, Gauge } from "lucide-react";

export default function FinalCTA() {
    return (
        <section className="page-noise relative overflow-hidden bg-[#f3f1ec] py-24 md:py-32">
            <div className="pointer-events-none absolute left-1/4 top-0 h-72 w-72 rounded-full bg-blue-300/25 blur-[110px]" />
            <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
                <div className="glass-panel rounded-[36px] px-6 py-14 sm:px-10 md:py-20">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                        <Gauge size={25} aria-hidden="true" />
                    </div>
                    <h2 className="mx-auto mt-7 max-w-3xl text-4xl font-black tracking-[-0.04em] text-zinc-950 md:text-6xl">
                        Check tool condition with the current inputs.
                    </h2>
                    <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-700">
                        Open the live dashboard, review every field, and send one real
                        prediction request when you are ready.
                    </p>
                    <Link
                        href="/dashboard"
                        className="mt-9 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-zinc-950 px-8 font-bold text-white shadow-xl shadow-zinc-950/15 transition hover:-translate-y-1 hover:bg-blue-700"
                    >
                        Check tool condition
                        <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
