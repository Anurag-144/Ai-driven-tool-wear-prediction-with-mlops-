import type { Metadata } from "next";

import Footer from "@/components/footer/Footer";
import DashboardNavbar from "@/components/layout/DashboardNavbar";
import PredictionWorkspace from "@/components/prediction/PredictionWorkspace";

export const metadata: Metadata = {
    title: "Prediction Dashboard | ToolWear AI",
    description:
        "Enter machining and normalized sensor inputs to request a cutting-tool wear estimate.",
};

export default function DashboardPage() {
    return (
        <main id="top" className="min-h-screen w-full overflow-x-hidden bg-[#f3f1ec]">
            <DashboardNavbar />
            <PredictionWorkspace />
            <Footer />
        </main>
    );
}
