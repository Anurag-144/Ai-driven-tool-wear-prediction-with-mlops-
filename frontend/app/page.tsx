import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/hero/Hero";
import PredictionWorkspace from "@/components/prediction/PredictionWorkspace";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <PredictionWorkspace />
    </>
  );
}