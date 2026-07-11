"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
    Activity,
    AudioWaveform,
    Radio,
    Waves,
    Zap,
} from "lucide-react";

import { Slider } from "@/components/ui/slider";

interface SensorSlidersProps {
    smcAC: number;
    setSmcAC: Dispatch<SetStateAction<number>>;
    smcDC: number;
    setSmcDC: Dispatch<SetStateAction<number>>;
    vibTable: number;
    setVibTable: Dispatch<SetStateAction<number>>;
    vibSpindle: number;
    setVibSpindle: Dispatch<SetStateAction<number>>;
    aeTable: number;
    setAeTable: Dispatch<SetStateAction<number>>;
    aeSpindle: number;
    setAeSpindle: Dispatch<SetStateAction<number>>;
}

export default function SensorSliders({
    smcAC,
    setSmcAC,
    smcDC,
    setSmcDC,
    vibTable,
    setVibTable,
    vibSpindle,
    setVibSpindle,
    aeTable,
    setAeTable,
    aeSpindle,
    setAeSpindle,
}: SensorSlidersProps) {
    return (
        <div className="glass-panel rounded-[34px] p-8 transition duration-500 hover:-translate-y-2 hover:shadow-2xl">
            <div className="flex items-start justify-between gap-5">
                <div>
                    <p className="text-sm font-semibold text-zinc-600">
                        Live sensor data
                    </p>

                    <h2 className="mt-1 text-3xl font-black tracking-[-0.03em] text-zinc-950">
                        Sensor measurements
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-zinc-600">
                        Adjust the normalized current, vibration and acoustic signals.
                    </p>
                </div>

                <div className="glass-panel-soft flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-blue-600">
                    <Activity size={25} />
                </div>
            </div>

            <div className="mt-8 space-y-5">
                <Sensor
                    label="SMC AC Mean"
                    description="Alternating current signal"
                    icon={<Zap size={18} />}
                    value={smcAC}
                    onChange={setSmcAC}
                />

                <Sensor
                    label="SMC DC Mean"
                    description="Direct current signal"
                    icon={<Radio size={18} />}
                    value={smcDC}
                    onChange={setSmcDC}
                />

                <Sensor
                    label="Vibration Table"
                    description="Machine table vibration"
                    icon={<Waves size={18} />}
                    value={vibTable}
                    onChange={setVibTable}
                />

                <Sensor
                    label="Vibration Spindle"
                    description="Spindle vibration signal"
                    icon={<Waves size={18} />}
                    value={vibSpindle}
                    onChange={setVibSpindle}
                />

                <Sensor
                    label="AE Table"
                    description="Table acoustic emission"
                    icon={<AudioWaveform size={18} />}
                    value={aeTable}
                    onChange={setAeTable}
                />

                <Sensor
                    label="AE Spindle"
                    description="Spindle acoustic emission"
                    icon={<AudioWaveform size={18} />}
                    value={aeSpindle}
                    onChange={setAeSpindle}
                />
            </div>
        </div>
    );
}

interface SensorProps {
    label: string;
    description: string;
    icon: ReactNode;
    value: number;
    onChange: (value: number) => void;
}

function Sensor({
    label,
    description,
    icon,
    value,
    onChange,
}: SensorProps) {
    const safeValue = Number.isFinite(value) ? value : 0;

    return (
        <div className="glass-panel-soft group rounded-2xl p-4 transition duration-300 hover:bg-white/65">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-zinc-700 shadow-sm transition group-hover:text-blue-600">
                        {icon}
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-zinc-950">{label}</p>
                        <p className="text-xs text-zinc-500">{description}</p>
                    </div>
                </div>

                <span className="min-w-16 rounded-xl bg-blue-50/80 px-3 py-2 text-center text-sm font-bold text-blue-600 shadow-sm">
                    {safeValue.toFixed(2)}
                </span>
            </div>

            <Slider
                value={[safeValue]}
                onValueChange={(values) => {
                    const nextValue = values[0];

                    if (
                        typeof nextValue === "number" &&
                        Number.isFinite(nextValue)
                    ) {
                        onChange(nextValue);
                    }
                }}
                min={0}
                max={1}
                step={0.01}
            />

            <div className="mt-3 flex justify-between text-[11px] font-medium text-zinc-400">
                <span>0.00</span>
                <span>1.00</span>
            </div>
        </div>
    );
}
