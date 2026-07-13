import type { LucideIcon } from "lucide-react";
import {
    Boxes,
    BrainCircuit,
    Cloud,
    Code2,
    Container,
    FlaskConical,
    Server,
    Workflow,
} from "lucide-react";

const technologies: Array<{
    name: string;
    role: string;
    icon: LucideIcon;
}> = [
    { name: "Next.js", role: "Web application", icon: Boxes },
    { name: "TypeScript", role: "Typed interface", icon: Code2 },
    { name: "FastAPI", role: "Prediction API", icon: Server },
    { name: "XGBoost", role: "Wear model", icon: BrainCircuit },
    { name: "Docker", role: "Backend container", icon: Container },
    { name: "Render", role: "API hosting", icon: Cloud },
    { name: "Vercel", role: "Frontend hosting", icon: Workflow },
    { name: "MLflow", role: "Model experiment artifacts", icon: FlaskConical },
];

export default function Technology() {
    return (
        <section id="technology" className="scroll-mt-28 bg-white py-24 md:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="rounded-[36px] bg-zinc-950 p-6 text-white sm:p-10 md:p-14">
                    <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">
                                Technology
                            </p>
                            <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] md:text-5xl">
                                A complete path from interface to model.
                            </h2>
                            <p className="mt-5 max-w-xl leading-7 text-zinc-300">
                                The repository combines a typed web interface, deployed
                                API, trained model, container setup, and recorded MLflow
                                artifacts.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {technologies.map((technology) => {
                                const Icon = technology.icon;
                                return (
                                    <article
                                        key={technology.name}
                                        className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                                    >
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                                            <Icon size={21} aria-hidden="true" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">
                                                {technology.name}
                                            </h3>
                                            <p className="mt-1 text-xs text-zinc-400">
                                                {technology.role}
                                            </p>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
