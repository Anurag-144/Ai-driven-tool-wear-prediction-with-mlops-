"use client";

import { Slider } from "@/components/ui/slider";

export default function SensorSliders() {
    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">

            <h2 className="text-2xl font-bold">
                Sensor Measurements
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
                Live machining sensor inputs used for prediction.
            </p>

            <div className="mt-8 space-y-8">

                <Sensor label="SMC AC Mean" value={50} />

                <Sensor label="SMC DC Mean" value={40} />

                <Sensor label="Vibration Table" value={25} />

                <Sensor label="Vibration Spindle" value={35} />

                <Sensor label="AE Table" value={60} />

                <Sensor label="AE Spindle" value={70} />

            </div>

        </div>
    );
}

function Sensor({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div>

            <div className="mb-3 flex justify-between">

                <span className="font-medium">
                    {label}
                </span>

                <span className="text-blue-600 font-semibold">
                    {value}
                </span>

            </div>

            <Slider
                defaultValue={[value]}
                max={100}
                step={1}
            />

        </div>
    );
}