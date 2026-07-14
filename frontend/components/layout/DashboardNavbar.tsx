import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import ApiStatus from "./ApiStatus";

const API_DOCS = "https://toolwear-api.onrender.com/docs";

export default function DashboardNavbar({
    current,
}: {
    current: "dashboard" | "mlops";
}) {
    return (
        <header className="sticky top-0 z-50 border-b border-white/60 bg-[#f3f1ec]/85 backdrop-blur-2xl">
            <div className="mx-auto flex min-h-20 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex shrink-0 items-center gap-3">
                    <Image
                        src="/toolwear-logo.png"
                        alt="ToolWear AI logo"
                        width={44}
                        height={44}
                        priority
                        className="h-11 w-11 object-contain"
                    />
                    <div>
                        <p className="font-black tracking-tight text-zinc-950">
                            ToolWear AI
                        </p>
                        <p className="text-xs text-zinc-500">
                            {current === "dashboard" ? "Prediction dashboard" : "MLOps operations"}
                        </p>
                    </div>
                </Link>

                <nav aria-label="Dashboard navigation" className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden md:block">
                        <ApiStatus />
                    </div>
                    <Link
                        href="/dashboard"
                        aria-current={current === "dashboard" ? "page" : undefined}
                        className={`hidden min-h-11 items-center rounded-full px-4 text-sm font-bold transition sm:inline-flex ${
                            current === "dashboard"
                                ? "bg-zinc-950 text-white"
                                : "border border-zinc-300 bg-white/55 text-zinc-800 hover:bg-white"
                        }`}
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/mlops"
                        aria-current={current === "mlops" ? "page" : undefined}
                        className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold transition ${
                            current === "mlops"
                                ? "bg-zinc-950 text-white"
                                : "border border-zinc-300 bg-white/55 text-zinc-800 hover:bg-white"
                        }`}
                    >
                        MLOps
                    </Link>
                    <a
                        href={API_DOCS}
                        target="_blank"
                        rel="noreferrer"
                        className="hidden min-h-11 items-center gap-2 rounded-full border border-zinc-300 bg-white/55 px-4 text-sm font-bold text-zinc-800 transition hover:bg-white xl:inline-flex"
                    >
                        API Docs <ExternalLink size={15} aria-hidden="true" />
                    </a>
                    <Link
                        href="/"
                        className="hidden min-h-11 items-center gap-2 rounded-full border border-zinc-300 bg-white/55 px-4 text-sm font-bold text-zinc-800 transition hover:bg-white lg:inline-flex"
                    >
                        <ArrowLeft size={16} aria-hidden="true" />
                        <span>Overview</span>
                    </Link>
                </nav>
            </div>
        </header>
    );
}
