import type { Metadata } from "next";

import Footer from "@/components/footer/Footer";
import DashboardNavbar from "@/components/layout/DashboardNavbar";
import MlopsDashboard from "@/components/mlops/MlopsDashboard";

export const metadata: Metadata = {
    title: "MLOps Operations | ToolWear AI",
    description:
        "Review real ToolWear AI model metadata, service monitoring, drift, and lifecycle state.",
};

export default function MlopsPage() {
    return (
        <main id="top" className="min-h-screen w-full overflow-x-hidden bg-[#f3f1ec]">
            <DashboardNavbar current="mlops" />
            <MlopsDashboard />
            <Footer />
        </main>
    );
}
