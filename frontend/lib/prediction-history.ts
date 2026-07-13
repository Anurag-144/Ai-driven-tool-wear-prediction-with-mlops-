import type {
    PredictionHistoryEntry,
    PredictionRequest,
    WearStatus,
} from "@/types/prediction";

export const PREDICTION_HISTORY_KEY = "toolwear-prediction-history";
export const MAX_HISTORY_ENTRIES = 20;

const statuses: WearStatus[] = ["Low wear", "Medium wear", "High wear"];
const inputKeys: Array<keyof PredictionRequest> = [
    "case",
    "run",
    "time",
    "DOC",
    "feed",
    "material",
    "smcAC_mean",
    "smcDC_mean",
    "vib_table_mean",
    "vib_spindle_mean",
    "AE_table_mean",
    "AE_spindle_mean",
];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isPredictionRequest(value: unknown): value is PredictionRequest {
    return (
        isRecord(value) &&
        inputKeys.every(
            (key) =>
                typeof value[key] === "number" &&
                Number.isFinite(value[key])
        )
    );
}

function isHistoryEntry(value: unknown): value is PredictionHistoryEntry {
    return (
        isRecord(value) &&
        typeof value.id === "string" &&
        typeof value.timestamp === "string" &&
        typeof value.prediction === "number" &&
        Number.isFinite(value.prediction) &&
        typeof value.status === "string" &&
        statuses.includes(value.status as WearStatus) &&
        isPredictionRequest(value.inputs)
    );
}

export function parsePredictionHistory(
    storedValue: string | null
): PredictionHistoryEntry[] {
    if (!storedValue) {
        return [];
    }

    try {
        const parsed: unknown = JSON.parse(storedValue);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(isHistoryEntry).slice(0, MAX_HISTORY_ENTRIES);
    } catch {
        return [];
    }
}

export function limitPredictionHistory(
    history: PredictionHistoryEntry[]
): PredictionHistoryEntry[] {
    return history.slice(0, MAX_HISTORY_ENTRIES);
}
