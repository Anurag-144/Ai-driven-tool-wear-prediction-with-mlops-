import { Activity } from "lucide-react";

export default function Loading() {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f1ec]">
            <div className="pointer-events-none absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-blue-300/30 blur-[120px]" />

            <div className="pointer-events-none absolute -right-40 bottom-0 h-[460px] w-[460px] rounded-full bg-violet-300/25 blur-[130px]" />

            <div className="glass-panel relative flex w-[min(90%,420px)] flex-col items-center rounded-[32px] p-10 text-center">
                <div className="relative flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 animate-spin rounded-3xl border-2 border-transparent border-t-blue-600 border-r-blue-600" />

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/25">
                        <Activity size={27} />
                    </div>
                </div>

                <h1 className="mt-7 text-2xl font-black tracking-tight text-zinc-950">
                    Loading ToolWear AI
                </h1>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                    Preparing the predictive-maintenance dashboard.
                </p>

                <div className="mt-7 h-2 w-full overflow-hidden rounded-full bg-white/60 shadow-inner">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
                </div>
            </div>
        </main>
    );
}