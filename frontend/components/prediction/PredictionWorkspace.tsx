"use client";

import { useState } from "react";

import MachineInputs from "./MachineInputs";
import SensorSliders from "./SensorSliders";
import PredictionCard from "./PredictionCard";
import PredictButton from "./PredictButton";

import { predictToolWear } from "@/lib/api";

export default function PredictionWorkspace() {
    const [prediction, setPrediction] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    async function handlePredict() {
        setLoading(true);

        try {
            const result = await predictToolWear({
                case: 1,
                run: 1,
                time: 10,
                DOC: 2,
                feed: 0.3,
                material: 1,
                smcAC_mean: 0.5,
                smcDC_mean: 0.4,
                vib_table_mean: 0.2,
                vib_spindle_mean: 0.3,
                AE_table_mean: 0.6,
                AE_spindle_mean: 0.7,
            });

            const value = Object.values(result)[0] as number;

            setPrediction(value);

        } catch (err) {
            console.error(err);
            alert("Prediction failed.");
        }

        setLoading(false);
    }

    return (
        <section className="max-w-7xl mx-auto px-6 py-24">

            <div className="grid lg:grid-cols-3 gap-8">

                <div className="space-y-8">
                    <MachineInputs />
                    <SensorSliders />
                    <PredictButton
                        loading={loading}
                        onClick={handlePredict}
                    />
                </div>

                <div className="lg:col-span-2">
                    <PredictionCard
                        prediction={prediction}
                        loading={loading}
                    />
                </div>

            </div>

        </section>
    );
}