"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

export type SensorProfileItem = {
    label: string;
    value: number;
};

export default function SensorProfileChart({
    sensors,
}: {
    sensors: SensorProfileItem[];
}) {
    return (
        <section className="glass-panel rounded-[30px] p-6">
            <div>
                <p className="text-sm font-semibold text-blue-700">Live inputs</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                    Current sensor profile
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                    The chart updates as the six normalized sliders move.
                </p>
            </div>

            <div
                className="mt-6 h-[330px] w-full"
                role="img"
                aria-label="Bar chart of the six current normalized sensor values"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sensors}
                        layout="vertical"
                        margin={{ top: 4, right: 12, left: 6, bottom: 4 }}
                    >
                        <CartesianGrid
                            strokeDasharray="4 4"
                            horizontal={false}
                            stroke="#d4d4d8"
                        />
                        <XAxis
                            type="number"
                            domain={[0, 1]}
                            tickCount={6}
                            tick={{ fontSize: 12, fill: "#52525b" }}
                        />
                        <YAxis
                            type="category"
                            dataKey="label"
                            width={112}
                            tick={{ fontSize: 12, fill: "#3f3f46" }}
                        />
                        <Tooltip
                            cursor={{ fill: "rgba(59, 130, 246, 0.06)" }}
                            formatter={(value) => [
                                Number(value).toFixed(2),
                                "Normalized value",
                            ]}
                            contentStyle={{
                                borderRadius: 14,
                                border: "1px solid #e4e4e7",
                                boxShadow: "0 12px 30px rgba(24,24,27,0.10)",
                            }}
                        />
                        <Bar
                            dataKey="value"
                            name="Normalized value"
                            fill="#2563eb"
                            radius={[0, 8, 8, 0]}
                            maxBarSize={24}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <ul className="mt-5 grid gap-2 text-xs text-zinc-600 sm:grid-cols-2">
                {sensors.map((sensor) => (
                    <li
                        key={sensor.label}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white/45 px-3 py-2"
                    >
                        <span>{sensor.label}</span>
                        <span className="font-bold text-zinc-950">
                            {sensor.value.toFixed(2)}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
