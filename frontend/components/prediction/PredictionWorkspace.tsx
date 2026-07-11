"use client";

import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import {
    Activity,
    BrainCircuit,
    Database,
    Server,
} from "lucide-react";

import MachineInputs from "./MachineInputs";
import SensorSliders from "./SensorSliders";
import PredictionCard from "./PredictionCard";
import PredictButton from "./PredictButton";

import { predictToolWear } from "@/lib/api";

type PredictionApiResponse = {
    "Predicted Tool Wear (VB)": number;
};

export default function PredictionWorkspace() {
    const [prediction, setPrediction] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [caseNo, setCaseNo] = useState(1);
    const [run, setRun] = useState(1);
    const [time, setTime] = useState(10);
    const [doc, setDoc] = useState(2);
    const [feed, setFeed] = useState(0.3);
    const [material, setMaterial] = useState(1);

    const [smcAC, setSmcAC] = useState(0.5);
    const [smcDC, setSmcDC] = useState(0.4);
    const [vibTable, setVibTable] = useState(0.2);
    const [vibSpindle, setVibSpindle] = useState(0.3);
    const [aeTable, setAeTable] = useState(0.6);
    const [aeSpindle, setAeSpindle] = useState(0.7);

    async function handlePredict() {
        setLoading(true);
        setError(null);

        try {
            const result = (await predictToolWear({
                case: caseNo,
                run,
                time,
                DOC: doc,
                feed,
                material,
                smcAC_mean: smcAC,
                smcDC_mean: smcDC,
                vib_table_mean: vibTable,
                vib_spindle_mean: vibSpindle,
                AE_table_mean: aeTable,
                AE_spindle_mean: aeSpindle,
            })) as PredictionApiResponse;

            const value = result["Predicted Tool Wear (VB)"];

            if (typeof value !== "number" || !Number.isFinite(value)) {
                throw new Error("The API returned an invalid prediction.");
            }

            setPrediction(value);
        } catch (predictionError) {
            console.error(predictionError);

            setError(
                predictionError instanceof Error
                    ? predictionError.message
                    : "Prediction failed. Please check the API connection."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <section
            id="prediction"
            className="page-noise relative w-full scroll-mt-20 overflow-hidden bg-[#f3f1ec] py-28"
        >
            <div className="pointer-events-none absolute -left-40 top-24 h-[460px] w-[460px] rounded-full bg-blue-300/30 blur-[120px]" />
            <div className="pointer-events-none absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-violet-300/25 blur-[130px]" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-cyan-200/25 blur-[120px]" />

            <div className="relative mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6 }}
                    className="mb-14 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"
                >
                    <div className="max-w-3xl">
                        <div className="glass-panel-soft inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-zinc-800">
                            <BrainCircuit size={17} />
                            Live prediction dashboard
                        </div>

                        <h2 className="mt-6 text-4xl font-black leading-tight tracking-[-0.035em] text-zinc-950 md:text-6xl">
                            Analyze your cutting tool in real time.
                        </h2>

                        <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
                            Configure the machine, adjust the sensor signals and send all
                            twelve features to the deployed XGBoost model.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <HeaderStat icon={<Activity size={19} />} value="12" label="Features" />
                        <HeaderStat icon={<Database size={19} />} value="XGBoost" label="Model" />
                        <HeaderStat icon={<Server size={19} />} value="FastAPI" label="Backend" />
                    </div>
                </motion.div>

                <div className="mb-8 xl:hidden">
                    <PredictButton loading={loading} onClick={handlePredict} />
                    {error && <ErrorMessage message={error} />}
                </div>

                <div className="grid items-start gap-8 lg:grid-cols-2 xl:grid-cols-3">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.55, delay: 0.05 }}
                    >
                        <MachineInputs
                            caseNo={caseNo}
                            setCaseNo={setCaseNo}
                            run={run}
                            setRun={setRun}
                            time={time}
                            setTime={setTime}
                            doc={doc}
                            setDoc={setDoc}
                            feed={feed}
                            setFeed={setFeed}
                            material={material}
                            setMaterial={setMaterial}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.55, delay: 0.15 }}
                    >
                        <SensorSliders
                            smcAC={smcAC}
                            setSmcAC={setSmcAC}
                            smcDC={smcDC}
                            setSmcDC={setSmcDC}
                            vibTable={vibTable}
                            setVibTable={setVibTable}
                            vibSpindle={vibSpindle}
                            setVibSpindle={setVibSpindle}
                            aeTable={aeTable}
                            setAeTable={setAeTable}
                            aeSpindle={aeSpindle}
                            setAeSpindle={setAeSpindle}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.55, delay: 0.25 }}
                        className="lg:col-span-2 xl:col-span-1"
                    >
                        <div className="space-y-5 xl:sticky xl:top-28">
                            <PredictionCard prediction={prediction} loading={loading} />

                            <div className="hidden xl:block">
                                <PredictButton loading={loading} onClick={handlePredict} />
                                {error && <ErrorMessage message={error} />}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

function HeaderStat({
    icon,
    value,
    label,
}: {
    icon: ReactNode;
    value: string;
    label: string;
}) {
    return (
        <div className="glass-panel min-w-24 rounded-2xl p-4">
            <div className="text-zinc-700">{icon}</div>
            <p className="mt-3 text-sm font-bold text-zinc-950">{value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
        </div>
    );
}

function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="mt-4 rounded-2xl border border-red-200/70 bg-red-50/70 px-5 py-4 text-sm font-medium text-red-700 backdrop-blur-xl">
            {message}
        </div>
    );
}
