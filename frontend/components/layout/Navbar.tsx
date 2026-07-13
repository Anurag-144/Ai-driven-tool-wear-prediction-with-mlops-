"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Menu, X } from "lucide-react";
import { useState } from "react";

import ApiStatus from "./ApiStatus";

const API_DOCS = "https://toolwear-api.onrender.com/docs";
const GITHUB =
    "https://github.com/Anurag-144/Ai-driven-tool-wear-prediction-with-mlops-";

const sectionLinks = [
    { href: "#benefits", label: "Benefits" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#technology", label: "Technology" },
];

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
            <div className="glass-panel mx-auto max-w-7xl rounded-[24px] px-4 py-3 sm:px-5">
                <div className="flex items-center justify-between gap-4">
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
                            <p className="text-base font-black tracking-tight text-zinc-950 sm:text-lg">
                                ToolWear AI
                            </p>
                            <p className="hidden text-xs text-zinc-500 sm:block">
                                Cutting-tool condition
                            </p>
                        </div>
                    </Link>

                    <nav
                        aria-label="Landing page navigation"
                        className="hidden items-center gap-6 xl:flex"
                    >
                        {sectionLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
                            >
                                {link.label}
                            </a>
                        ))}
                        <a
                            href={API_DOCS}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
                        >
                            API Docs <ExternalLink size={14} aria-hidden="true" />
                        </a>
                        <a
                            href={GITHUB}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
                        >
                            GitHub <ExternalLink size={14} aria-hidden="true" />
                        </a>
                    </nav>

                    <div className="flex items-center gap-2">
                        <div className="hidden md:block">
                            <ApiStatus />
                        </div>
                        <Link
                            href="/dashboard"
                            className="hidden rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-zinc-950/10 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:inline-flex"
                        >
                            Open dashboard
                        </Link>
                        <button
                            type="button"
                            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((open) => !open)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/55 text-zinc-900 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 xl:hidden"
                        >
                            {menuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {menuOpen && (
                    <nav
                        aria-label="Mobile navigation"
                        className="mt-4 rounded-2xl border border-white/80 bg-[#f8f7f3] p-3 shadow-xl shadow-zinc-950/10 xl:hidden"
                    >
                        <div className="grid gap-2">
                            {sectionLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                    className="rounded-xl px-3 py-3 text-sm font-bold text-zinc-700 transition hover:bg-white/60 hover:text-zinc-950"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <a
                                href={API_DOCS}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl px-3 py-3 text-sm font-bold text-zinc-700 transition hover:bg-white/60"
                            >
                                API Docs
                            </a>
                            <a
                                href={GITHUB}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl px-3 py-3 text-sm font-bold text-zinc-700 transition hover:bg-white/60"
                            >
                                GitHub
                            </a>
                            <div className="px-3 py-2 md:hidden">
                                <ApiStatus />
                            </div>
                            <Link
                                href="/dashboard"
                                onClick={() => setMenuOpen(false)}
                                className="mt-2 inline-flex min-h-12 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-bold text-white sm:hidden"
                            >
                                Open dashboard
                            </Link>
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
}
