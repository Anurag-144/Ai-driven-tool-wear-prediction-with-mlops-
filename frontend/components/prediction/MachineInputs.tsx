"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
    Box,
    Clock3,
    Factory,
    Gauge,
    Layers3,
    Play,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MachineInputsProps {
    caseNo: number;
    setCaseNo: Dispatch<SetStateAction<number>>;
    run: number;
    setRun: Dispatch<SetStateAction<number>>;
    time: number;
    setTime: Dispatch<SetStateAction<number>>;
    doc: number;
    setDoc: Dispatch<SetStateAction<number>>;
    feed: number;
    setFeed: Dispatch<SetStateAction<number>>;
    material: number;
    setMaterial: Dispatch<SetStateAction<number>>;
}

export default function MachineInputs({
    caseNo,
    setCaseNo,
    run,
    setRun,
    time,
    setTime,
    doc,
    setDoc,
    feed,
    setFeed,
    material,
    setMaterial,
}: MachineInputsProps) {
    return (
        <div className="glass-panel rounded-[34px] p-8 transition duration-500 hover:-translate-y-2 hover:shadow-2xl">
            <div className="flex items-start justify-between gap-5">
                <div>
                    <p className="text-sm font-semibold text-zinc-600">
                        Machine configuration
                    </p>

                    <h2 className="mt-1 text-3xl font-black tracking-[-0.03em] text-zinc-950">
                        Machine parameters
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-zinc-600">
                        Configure the machining conditions used by the prediction model.
                    </p>
                </div>

                <div className="glass-panel-soft flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-zinc-800">
                    <Factory size={25} />
                </div>
            </div>

            <div className="mt-8 space-y-5">
                <Field
                    label="Case"
                    description="Dataset case number"
                    icon={<Box size={18} />}
                    value={caseNo}
                    onChange={setCaseNo}
                    min={1}
                    step={1}
                />

                <Field
                    label="Run"
                    description="Machining run number"
                    icon={<Play size={18} />}
                    value={run}
                    onChange={setRun}
                    min={1}
                    step={1}
                />

                <Field
                    label="Time"
                    description="Machining duration"
                    icon={<Clock3 size={18} />}
                    value={time}
                    onChange={setTime}
                    min={0}
                    step={0.1}
                />

                <Field
                    label="Depth of Cut"
                    description="DOC value"
                    icon={<Layers3 size={18} />}
                    value={doc}
                    onChange={setDoc}
                    min={0}
                    step={0.1}
                />

                <Field
                    label="Feed Rate"
                    description="Cutting feed rate"
                    icon={<Gauge size={18} />}
                    value={feed}
                    onChange={setFeed}
                    min={0}
                    step={0.01}
                />

                <Field
                    label="Material"
                    description="Encoded material category"
                    icon={<Box size={18} />}
                    value={material}
                    onChange={setMaterial}
                    min={0}
                    step={1}
                />
            </div>
        </div>
    );
}

interface FieldProps {
    label: string;
    description: string;
    icon: ReactNode;
    value: number;
    onChange: (value: number) => void;
    min: number;
    step: number;
}

function Field({
    label,
    description,
    icon,
    value,
    onChange,
    min,
    step,
}: FieldProps) {
    return (
        <div className="glass-panel-soft rounded-2xl p-4 transition duration-300 hover:bg-white/65">
            <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 text-zinc-700 shadow-sm">
                    {icon}
                </div>

                <div>
                    <Label className="text-sm font-semibold text-zinc-950">
                        {label}
                    </Label>
                    <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
                </div>
            </div>

            <Input
                type="number"
                value={value}
                min={min}
                step={step}
                onChange={(event) => {
                    const nextValue = event.target.valueAsNumber;

                    if (Number.isFinite(nextValue)) {
                        onChange(nextValue);
                    }
                }}
                className="h-14 rounded-2xl border-white/60 bg-white/45 px-4 font-semibold text-zinc-950 shadow-inner backdrop-blur-xl transition focus-visible:border-blue-300 focus-visible:ring-blue-200/40"
            />
        </div>
    );
}
