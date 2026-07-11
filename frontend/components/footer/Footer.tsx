import Image from "next/image";
import {
    ArrowUpRight,
    ExternalLink,
    GitBranch,
} from "lucide-react";

const GITHUB =
    "https://github.com/Anurag-144/Ai-driven-tool-wear-prediction-with-mlops-";

const API_DOCS =
    "https://toolwear-api.onrender.com/docs";

export default function Footer() {
    return (
        <footer className="relative w-full overflow-hidden border-t border-white/60 bg-[#ebe8e1]">
            <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-blue-300/20 blur-[110px]" />

            <div className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-violet-300/20 blur-[110px]" />

            <div className="relative mx-auto max-w-7xl px-6 py-12">
                <div className="glass-panel rounded-[36px] p-8 md:p-10">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                        {/* Logo */}
                        <a
                            href="#home"
                            className="flex shrink-0 items-center gap-3"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                                <Image
                                    src="/toolwear-logo.png"
                                    alt="ToolWear AI logo"
                                    width={48}
                                    height={48}
                                    className="h-12 w-12 object-contain"
                                />
                            </div>

                            <div>
                                <p className="text-xl font-black tracking-tight text-zinc-950">
                                    ToolWear AI
                                </p>

                                <p className="text-sm text-zinc-500">
                                    Predictive maintenance
                                </p>
                            </div>
                        </a>

                        {/* Footer navigation */}
                        <nav className="flex flex-wrap items-center gap-x-7 gap-y-4">
                            <a
                                href={GITHUB}
                                target="_blank"
                                rel="noreferrer"
                                className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
                            >
                                <GitBranch size={17} />

                                GitHub

                                <ArrowUpRight
                                    size={14}
                                    className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                />
                            </a>

                            <a
                                href={API_DOCS}
                                target="_blank"
                                rel="noreferrer"
                                className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
                            >
                                <ExternalLink size={17} />

                                API Docs

                                <ArrowUpRight
                                    size={14}
                                    className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                />
                            </a>

                            <FooterLink
                                href="#home"
                                label="Back to top"
                            />
                        </nav>

                        {/* Author */}
                        <div className="shrink-0 rounded-full border border-white/60 bg-white/40 px-4 py-2 text-sm font-medium text-zinc-700 backdrop-blur-xl">
                            Built by{" "}
                            <span className="font-bold text-zinc-950">
                                Anurag A M
                            </span>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col justify-between gap-4 border-t border-zinc-900/10 pt-6 text-sm text-zinc-500 sm:flex-row">
                        <p>
                            © {new Date().getFullYear()} ToolWear AI. All rights reserved.
                        </p>

                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterLink({
    href,
    label,
}: {
    href: string;
    label: string;
}) {
    return (
        <a
            href={href}
            className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
        >
            {label}

            <ArrowUpRight
                size={14}
                className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
        </a>
    );
}