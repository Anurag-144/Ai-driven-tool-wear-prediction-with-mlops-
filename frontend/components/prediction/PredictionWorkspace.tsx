"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PredictionAnalytics from "@/components/dashboard/PredictionAnalytics";
import {
    limitPredictionHistory,
    parsePredictionHistory,
    PREDICTION_HISTORY_KEY,
} from "@/lib/prediction-history";
import { predictToolWear } from "@/lib/api";
import { getWearStatus } from "@/lib/wear-status";
import type {
    PredictionHistoryEntry,
    PredictionRequest,
} from "@/types/prediction";

import MachineInputs from "./MachineInputs";
import PredictButton from "./PredictButton";
import PredictionCard from "./PredictionCard";
import SensorSliders from "./SensorSliders";

export default function PredictionWorkspace() {
    const [prediction, setPrediction] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<PredictionHistoryEntry[]>([]);

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

    useEffect(() => {
        const loadHistory = window.setTimeout(() => {
            const storedHistory = window.localStorage.getItem(
                PREDICTION_HISTORY_KEY
            );
            setHistory(parsePredictionHistory(storedHistory));
        }, 0);

        return () => window.clearTimeout(loadHistory);
    }, []);

    const currentInputs: PredictionRequest = useMemo(
        () => ({
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
        }),
        [
            aeSpindle,
            aeTable,
            caseNo,
            doc,
            feed,
            material,
            run,
            smcAC,
            smcDC,
            time,
            vibSpindle,
            vibTable,
        ]
    );

    const sensors = useMemo(
        () => [
            { label: "AC current", value: smcAC },
            { label: "DC current", value: smcDC },
            { label: "Table vibration", value: vibTable },
            { label: "Spindle vibration", value: vibSpindle },
            { label: "Table acoustic activity", value: aeTable },
            { label: "Spindle acoustic activity", value: aeSpindle },
        ],
        [aeSpindle, aeTable, smcAC, smcDC, vibSpindle, vibTable]
    );

    function saveHistory(nextHistory: PredictionHistoryEntry[]) {
        const limitedHistory = limitPredictionHistory(nextHistory);
        setHistory(limitedHistory);
        window.localStorage.setItem(
            PREDICTION_HISTORY_KEY,
            JSON.stringify(limitedHistory)
        );
    }

    async function handlePredict() {
        setLoading(true);
        setError(null);

        try {
            const result = await predictToolWear(currentInputs);
            const value = result["Predicted Tool Wear (VB)"];

            if (!Number.isFinite(value)) {
                throw new Error("The API returned an invalid prediction.");
            }

            setPrediction(value);

            const entry: PredictionHistoryEntry = {
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                prediction: value,
                status: getWearStatus(value).level,
                inputs: currentInputs,
            };

            saveHistory([entry, ...history]);
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

    function handleRemoveHistory(id: string) {
        saveHistory(history.filter((entry) => entry.id !== id));
    }

    function handleClearHistory() {
        setHistory([]);
        window.localStorage.removeItem(PREDICTION_HISTORY_KEY);
    }

    return (
        <section
            id="dashboard"
            className="page-noise relative w-full overflow-hidden bg-[#f3f1ec] py-16 md:py-24"
        >
            <div className="pointer-events-none absolute -left-40 top-24 h-[460px] w-[460px] rounded-full bg-blue-300/30 blur-[120px]" />
            <div className="pointer-events-none absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-violet-300/25 blur-[130px]" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-cyan-200/25 blur-[120px]" />

            <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
                <DashboardHeader />

                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
                    <div className="min-w-0 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.5 }}
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
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.5, delay: 0.08 }}
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
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.5, delay: 0.16 }}
                        className="min-w-0 xl:sticky xl:top-24"
                    >
                        <PredictionCard prediction={prediction} loading={loading} />

                        <div className="mt-4">
                            <PredictButton loading={loading} onClick={handlePredict} />
                            {error && <ErrorMessage message={error} />}
                        </div>
                    </motion.div>
                </div>

                <PredictionAnalytics
                    sensors={sensors}
                    history={history}
                    onRemove={handleRemoveHistory}
                    onClear={handleClearHistory}
                />
            </div>
        </section>
    );
}

function ErrorMessage({ message }: { message: string }) {
    return (
        <div
            role="alert"
            className="mt-4 rounded-2xl border border-red-200/70 bg-red-50/80 px-5 py-4 text-sm font-medium text-red-800 backdrop-blur-xl"
        >
            {message}
        </div>
    );
}
