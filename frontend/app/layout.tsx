import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
    const requestHeaders = await headers();
    const host =
        requestHeaders.get("x-forwarded-host") ??
        requestHeaders.get("host") ??
        "localhost:3000";
    const protocol =
        requestHeaders.get("x-forwarded-proto") ??
        (host.startsWith("localhost") ? "http" : "https");
    const metadataBase = new URL(`${protocol}://${host}`);
    const title = "ToolWear AI | Cutting-Tool Condition";
    const description =
        "A plain-language interface for reviewing cutting-tool wear estimates from machining and sensor inputs.";

    return {
        metadataBase,
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
            images: [
                {
                    url: "/og.png",
                    width: 1733,
                    height: 909,
                    alt: "ToolWear AI cutting-tool condition dashboard",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: ["/og.png"],
        },
    };
}

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en">
            <body className="min-h-screen w-full overflow-x-hidden bg-[#f6f4ef] text-zinc-950 antialiased">
                {children}
            </body>
        </html>
    );
}
