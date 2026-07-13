import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import ApiStatus from "./ApiStatus";

const API_DOCS = "https://toolwear-api.onrender.com/docs";

export default function DashboardNavbar() {
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
                        <p className="text-xs text-zinc-500">Prediction dashboard</p>
                    </div>
                </Link>

                <nav aria-label="Dashboard navigation" className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden md:block">
                        <ApiStatus />
                    </div>
                    <a
                        href={API_DOCS}
                        target="_blank"
                        rel="noreferrer"
                        className="hidden min-h-11 items-center gap-2 rounded-full border border-zinc-300 bg-white/55 px-4 text-sm font-bold text-zinc-800 transition hover:bg-white sm:inline-flex"
                    >
                        API Docs <ExternalLink size={15} aria-hidden="true" />
                    </a>
                    <Link
                        href="/"
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-blue-700 sm:px-5"
                    >
                        <ArrowLeft size={16} aria-hidden="true" />
                        <span className="hidden sm:inline">Back to overview</span>
                        <span className="sm:hidden">Overview</span>
                    </Link>
                </nav>
            </div>
        </header>
    );
}
