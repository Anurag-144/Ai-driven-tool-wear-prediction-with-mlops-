"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
    Activity,
    AudioWaveform,
    Radio,
    Waves,
    Zap,
} from "lucide-react";

import InfoTooltip from "@/components/ui/info-tooltip";
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

const sensorRange = { min: 0, max: 1, step: 0.01 } as const;

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
        <section className="glass-panel rounded-[30px] p-6">
            <div className="flex items-start justify-between gap-5">
                <div>
                    <p className="text-sm font-semibold text-zinc-600">
                        Input group 02
                    </p>

                    <h2 className="mt-1 text-3xl font-black tracking-[-0.03em] text-zinc-950">
                        Sensor measurements
                    </h2>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
                        Adjust the six normalized model inputs. The controls do not
                        label values as good or bad.
                    </p>
                </div>

                <div className="glass-panel-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-blue-700">
                    <Activity size={23} aria-hidden="true" />
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Sensor
                    label="AC motor current"
                    technicalLabel="SMC AC mean"
                    description="Normalized alternating-current measurement from the machining system."
                    icon={<Zap size={18} aria-hidden="true" />}
                    value={smcAC}
                    onChange={setSmcAC}
                />

                <Sensor
                    label="DC motor current"
                    technicalLabel="SMC DC mean"
                    description="Normalized direct-current measurement from the machining system."
                    icon={<Radio size={18} aria-hidden="true" />}
                    value={smcDC}
                    onChange={setSmcDC}
                />

                <Sensor
                    label="Machine-table vibration"
                    technicalLabel="Vibration table mean"
                    description="Normalized vibration measured at the machine table."
                    icon={<Waves size={18} aria-hidden="true" />}
                    value={vibTable}
                    onChange={setVibTable}
                />

                <Sensor
                    label="Spindle vibration"
                    technicalLabel="Vibration spindle mean"
                    description="Normalized vibration measured near the spindle."
                    icon={<Waves size={18} aria-hidden="true" />}
                    value={vibSpindle}
                    onChange={setVibSpindle}
                />

                <Sensor
                    label="Table acoustic activity"
                    technicalLabel="AE table mean"
                    description="Normalized acoustic-emission activity measured at the table."
                    icon={<AudioWaveform size={18} aria-hidden="true" />}
                    value={aeTable}
                    onChange={setAeTable}
                />

                <Sensor
                    label="Spindle acoustic activity"
                    technicalLabel="AE spindle mean"
                    description="Normalized acoustic-emission activity measured near the spindle."
                    icon={<AudioWaveform size={18} aria-hidden="true" />}
                    value={aeSpindle}
                    onChange={setAeSpindle}
                />
            </div>
        </section>
    );
}

interface SensorProps {
    label: string;
    technicalLabel: string;
    description: string;
    icon: ReactNode;
    value: number;
    onChange: (value: number) => void;
}

function Sensor({
    label,
    technicalLabel,
    description,
    icon,
    value,
    onChange,
}: SensorProps) {
    const safeValue = Number.isFinite(value) ? value : 0;

    return (
        <div className="glass-panel-soft group h-full rounded-2xl p-4 transition hover:bg-white/60">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 text-zinc-700 shadow-sm transition group-hover:text-blue-700">
                        {icon}
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-950">{label}</p>
                        <p className="mt-0.5 font-mono text-xs text-zinc-500">
                            Model feature: {technicalLabel}
                        </p>
                        <p className="mt-1.5 text-xs leading-5 text-zinc-600">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <span className="min-w-14 rounded-xl bg-blue-50/90 px-2.5 py-1.5 text-center text-sm font-bold text-blue-700 shadow-sm">
                        {safeValue.toFixed(2)}
                    </span>
                    <InfoTooltip label={label} text={description} />
                </div>
            </div>

            <Slider
                aria-label={`${label}, ${technicalLabel}, normalized range 0 to 1`}
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
                min={sensorRange.min}
                max={sensorRange.max}
                step={sensorRange.step}
            />

            <div className="mt-3 flex justify-between text-xs font-medium text-zinc-500">
                <span>0.00</span>
                <span>Normalized range</span>
                <span>1.00</span>
            </div>
        </div>
    );
}
