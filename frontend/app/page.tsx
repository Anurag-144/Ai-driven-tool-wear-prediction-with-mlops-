import Benefits from "@/components/landing/Benefits";
import FinalCTA from "@/components/landing/FinalCTA";
import Technology from "@/components/landing/Technology";
import Footer from "@/components/footer/Footer";
import Hero from "@/components/hero/Hero";
import HowItWorks from "@/components/how-it-works/HowItWorks";
import Navbar from "@/components/layout/Navbar";

export default function Home() {
    return (
        <main className="min-h-screen w-full overflow-x-hidden bg-[#f6f4ef]">
            <Navbar />
            <Hero />
            <Benefits />
            <HowItWorks />
            <Technology />
            <FinalCTA />
            <Footer />
        </main>
    );
}
