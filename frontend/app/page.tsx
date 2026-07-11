import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/hero/Hero";
import PredictionWorkspace from "@/components/prediction/PredictionWorkspace";
import HowItWorks from "@/components/how-it-works/HowItWorks";
import Footer from "@/components/footer/Footer";

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white">
      <Navbar />
      <Hero />
      <PredictionWorkspace />
      <HowItWorks />
      <Footer />
    </main>
  );
}