"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";

export default function Navbar() {
    return (
        <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-white/70 backdrop-blur-xl">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Activity className="h-7 w-7 text-blue-600" />
                    <span className="text-xl font-bold tracking-tight">
                        ToolWear AI
                    </span>
                </Link>

                {/* Navigation */}
                <nav className="hidden items-center gap-8 md:flex">
                    <Link href="#features" className="text-sm text-gray-600 hover:text-black transition">
                        Features
                    </Link>

                    <Link href="#technology" className="text-sm text-gray-600 hover:text-black transition">
                        Technology
                    </Link>

                    <Link href="#dashboard" className="text-sm text-gray-600 hover:text-black transition">
                        Dashboard
                    </Link>

                    <Link href="#faq" className="text-sm text-gray-600 hover:text-black transition">
                        FAQ
                    </Link>
                </nav>

                {/* CTA */}
                <Button className="rounded-full px-6">
                    Try Demo
                </Button>

            </div>
        </header>
    );
}