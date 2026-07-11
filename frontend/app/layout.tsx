import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ToolWear AI | Predictive Maintenance",
  description:
    "AI-driven cutting-tool wear prediction using XGBoost, FastAPI and machining sensor data.",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen w-full overflow-x-hidden bg-white text-zinc-950 antialiased">
        {children}
      </body>
    </html>
  );
}