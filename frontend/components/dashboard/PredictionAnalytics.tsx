"use client";

import PredictionHistory from "./PredictionHistory";
import SensorProfileChart, { type SensorProfileItem } from "./SensorProfileChart";
import WearHistoryChart from "./WearHistoryChart";
import type { PredictionHistoryEntry } from "@/types/prediction";

export default function PredictionAnalytics({
    sensors,
    history,
    onRemove,
    onClear,
}: {
    sensors: SensorProfileItem[];
    history: PredictionHistoryEntry[];
    onRemove: (id: string) => void;
    onClear: () => void;
}) {
    return (
        <div className="mt-10 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                <SensorProfileChart sensors={sensors} />
                <WearHistoryChart history={history} />
            </div>
            <PredictionHistory
                history={history}
                onRemove={onRemove}
                onClear={onClear}
            />
        </div>
    );
}
