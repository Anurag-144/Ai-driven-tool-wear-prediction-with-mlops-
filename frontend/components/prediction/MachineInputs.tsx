"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
    Box,
    ChevronDown,
    Clock3,
    Factory,
    Gauge,
    Layers3,
    Play,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import InfoTooltip from "@/components/ui/info-tooltip";
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
        <section className="glass-panel rounded-[30px] p-6">
            <div className="flex items-start justify-between gap-5">
                <div>
                    <p className="text-sm font-semibold text-zinc-600">
                        Input group 01
                    </p>

                    <h2 className="mt-1 text-3xl font-black tracking-[-0.03em] text-zinc-950">
                        Machining setup
                    </h2>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
                        Enter the current cutting setup. Depth of cut and feed units
                        come from the source milling dataset.
                    </p>
                </div>

                <div className="glass-panel-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-zinc-800">
                    <Factory size={23} aria-hidden="true" />
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <NumberField
                    id="cutting-time"
                    label="Cutting time"
                    technicalLabel="time"
                    description="Elapsed machining time supplied to the model."
                    icon={<Clock3 size={18} aria-hidden="true" />}
                    value={time}
                    onChange={setTime}
                    min={0}
                    step={0.1}
                />

                <NumberField
                    id="depth-of-cut"
                    label="Depth of cut"
                    technicalLabel="DOC"
                    description="How deeply the cutting tool engages the material."
                    icon={<Layers3 size={18} aria-hidden="true" />}
                    value={doc}
                    onChange={setDoc}
                    min={0}
                    step={0.1}
                    suffix="mm"
                />

                <NumberField
                    id="feed-rate"
                    label="Feed rate"
                    technicalLabel="feed"
                    description="The rate at which the tool advances through the material."
                    icon={<Gauge size={18} aria-hidden="true" />}
                    value={feed}
                    onChange={setFeed}
                    min={0}
                    step={0.01}
                    suffix="mm/rev"
                />

                <MaterialField value={material} onChange={setMaterial} />

                <details className="group rounded-2xl border border-white/60 bg-white/35 p-4 shadow-inner backdrop-blur-xl md:col-span-2">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                        <div>
                            <p className="font-bold text-zinc-950">Advanced setup</p>
                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                                Job identifiers used by the model.
                            </p>
                        </div>
                        <ChevronDown
                            size={20}
                            aria-hidden="true"
                            className="shrink-0 text-zinc-500 transition group-open:rotate-180"
                        />
                    </summary>

                    <div className="mt-4 grid grid-cols-1 gap-4 border-t border-zinc-900/10 pt-4 md:grid-cols-2">
                        <NumberField
                            id="job-case"
                            label="Job case"
                            technicalLabel="case"
                            description="Identifier for the machining case used by the model."
                            icon={<Box size={18} aria-hidden="true" />}
                            value={caseNo}
                            onChange={setCaseNo}
                            min={1}
                            max={16}
                            step={1}
                            rangeNote="Dataset cases 1-16"
                        />

                        <NumberField
                            id="production-run"
                            label="Production run"
                            technicalLabel="run"
                            description="The machining run or cycle being analyzed."
                            icon={<Play size={18} aria-hidden="true" />}
                            value={run}
                            onChange={setRun}
                            min={1}
                            step={1}
                        />
                    </div>
                </details>
            </div>
        </section>
    );
}

interface NumberFieldProps {
    id: string;
    label: string;
    technicalLabel: string;
    description: string;
    icon: ReactNode;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max?: number;
    step: number;
    suffix?: string;
    rangeNote?: string;
}

function NumberField({
    id,
    label,
    technicalLabel,
    description,
    icon,
    value,
    onChange,
    min,
    max,
    step,
    suffix,
    rangeNote,
}: NumberFieldProps) {
    return (
        <div className="glass-panel-soft h-full rounded-2xl p-4 transition hover:bg-white/60">
            <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 text-zinc-700 shadow-sm">
                    {icon}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <Label
                                htmlFor={id}
                                className="text-sm font-bold text-zinc-950"
                            >
                                {label}
                            </Label>
                            <p className="mt-0.5 font-mono text-xs text-zinc-500">
                                Model feature: {technicalLabel}
                            </p>
                        </div>
                        <InfoTooltip label={label} text={description} />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                        {description}
                    </p>
                </div>
            </div>

            <div className="relative">
                <Input
                    id={id}
                    aria-label={`${label}, model feature ${technicalLabel}`}
                    type="number"
                    value={value}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(event) => {
                        const nextValue = event.target.valueAsNumber;

                        if (Number.isFinite(nextValue)) {
                            onChange(nextValue);
                        }
                    }}
                    className={`h-12 rounded-xl border-white/60 bg-white/45 px-4 font-semibold text-zinc-950 shadow-inner backdrop-blur-xl transition focus-visible:border-blue-300 focus-visible:ring-blue-200/40 ${suffix ? "pr-20" : ""}`}
                />
                {suffix && (
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-semibold text-zinc-500">
                        {suffix}
                    </span>
                )}
            </div>

            {rangeNote && (
                <p className="mt-2 text-xs font-medium text-zinc-500">
                    {rangeNote}
                </p>
            )}
        </div>
    );
}

function MaterialField({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}) {
    const description =
        "Dataset material category. The source documentation maps code 1 to cast iron and code 2 to steel.";

    return (
        <div className="glass-panel-soft h-full rounded-2xl p-4 transition hover:bg-white/60">
            <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 text-zinc-700 shadow-sm">
                    <Box size={18} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <Label
                                htmlFor="material-code"
                                className="text-sm font-bold text-zinc-950"
                            >
                                Material
                            </Label>
                            <p className="mt-0.5 font-mono text-xs text-zinc-500">
                                Model feature: material
                            </p>
                        </div>
                        <InfoTooltip label="Material" text={description} />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                        Select the documented material code used by the model.
                    </p>
                </div>
            </div>

            <select
                id="material-code"
                aria-label="Material, model feature material"
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="h-12 w-full rounded-xl border border-white/60 bg-white/55 px-4 text-sm font-semibold text-zinc-950 shadow-inner outline-none backdrop-blur-xl transition focus:border-blue-300 focus:ring-4 focus:ring-blue-200/40"
            >
                <option value={1}>Cast iron - code 1</option>
                <option value={2}>Steel - code 2</option>
            </select>
        </div>
    );
}
