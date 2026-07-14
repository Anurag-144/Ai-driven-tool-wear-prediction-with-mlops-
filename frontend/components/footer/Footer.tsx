import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, GitBranch } from "lucide-react";

const GITHUB =
    "https://github.com/Anurag-144/Ai-driven-tool-wear-prediction-with-mlops-";
const API_DOCS = "https://toolwear-api.onrender.com/docs";

export default function Footer() {
    return (
        <footer className="relative w-full overflow-hidden border-t border-white/60 bg-[#ebe8e1]">
            <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-blue-300/20 blur-[110px]" />
            <div className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-violet-300/20 blur-[110px]" />

            <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6">
                <div className="glass-panel rounded-[30px] px-6 py-7 md:px-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <Link href="/" className="flex shrink-0 items-center gap-3">
                            <Image
                                src="/toolwear-logo.png"
                                alt="ToolWear AI logo"
                                width={44}
                                height={44}
                                className="h-11 w-11 object-contain"
                            />
                            <div>
                                <p className="text-lg font-black tracking-tight text-zinc-950">
                                    ToolWear AI
                                </p>
                                <p className="text-xs text-zinc-500">
                                    Cutting-tool condition support
                                </p>
                            </div>
                        </Link>

                        <nav
                            aria-label="Footer navigation"
                            className="flex flex-wrap items-center gap-x-6 gap-y-3"
                        >
                            <Link
                                href="/dashboard"
                                className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/mlops"
                                className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
                            >
                                MLOps
                            </Link>
                            <a
                                href={GITHUB}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
                            >
                                <GitBranch size={16} aria-hidden="true" /> GitHub
                                <ArrowUpRight size={13} aria-hidden="true" />
                            </a>
                            <a
                                href={API_DOCS}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
                            >
                                <ExternalLink size={16} aria-hidden="true" /> API Docs
                                <ArrowUpRight size={13} aria-hidden="true" />
                            </a>
                            <a
                                href="#top"
                                className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
                            >
                                Back to top
                            </a>
                        </nav>

                        <p className="text-sm text-zinc-500">
                            © {new Date().getFullYear()} ToolWear AI
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
