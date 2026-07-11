import Image from "next/image";
import { ExternalLink } from "lucide-react";

import ApiStatus from "./ApiStatus";

const API_DOCS = "https://toolwear-api.onrender.com/docs";

const GITHUB =
    "https://github.com/Anurag-144/Ai-driven-tool-wear-prediction-with-mlops-";

export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200/70 bg-white/80 backdrop-blur-2xl">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-6">
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
                            priority
                            className="h-12 w-12 object-contain"
                        />
                    </div>

                    <div>
                        <p className="text-xl font-bold tracking-tight text-zinc-950">
                            ToolWear AI
                        </p>

                        <p className="text-sm text-zinc-500">
                            Predictive maintenance
                        </p>
                    </div>
                </a>

                {/* Navigation links */}
                <nav className="hidden items-center gap-8 lg:flex">
                    <a
                        href="#prediction"
                        className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
                    >
                        Prediction
                    </a>

                    <a
                        href={API_DOCS}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
                    >
                        API Docs
                        <ExternalLink size={14} />
                    </a>

                    <a
                        href={GITHUB}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
                    >
                        GitHub
                        <ExternalLink size={14} />
                    </a>
                </nav>

                {/* Right-side actions */}
                <div className="flex shrink-0 items-center gap-3">
                    <a
                        href="#prediction"
                        className="rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-950/10 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-600"
                    >
                        Try Demo
                    </a>

                    <div className="hidden md:block">
                        <ApiStatus />
                    </div>
                </div>
            </div>
        </header>
    );
}