import { Activity, Database, Server } from "lucide-react";
import type { ReactNode } from "react";

export default function DashboardHeader() {
    return (
        <header className="mb-12 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
                <p className="inline-flex rounded-full border border-blue-200 bg-blue-50/80 px-4 py-2 text-sm font-bold text-blue-800">
                    Live prediction dashboard
                </p>
                <h1 className="mt-6 text-4xl font-black leading-tight tracking-[-0.04em] text-zinc-950 md:text-6xl">
                    Check the current cutting-tool condition.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-700">
                    Enter the machining setup, adjust the normalized sensor inputs,
                    and review the wear estimate returned by the deployed model.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <HeaderStat icon={<Activity size={19} />} value="12" label="Inputs" />
                <HeaderStat icon={<Database size={19} />} value="XGBoost" label="Model" />
                <HeaderStat icon={<Server size={19} />} value="FastAPI" label="Service" />
            </div>
        </header>
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
        <div className="glass-panel min-w-0 rounded-2xl p-3 sm:min-w-24 sm:p-4">
            <div className="text-zinc-700" aria-hidden="true">{icon}</div>
            <p className="mt-3 truncate text-xs font-bold text-zinc-950 sm:text-sm">
                {value}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
        </div>
    );
}
