export interface PredictionRequest {
    case: number;
    run: number;
    time: number;
    DOC: number;
    feed: number;
    material: number;
    smcAC_mean: number;
    smcDC_mean: number;
    vib_table_mean: number;
    vib_spindle_mean: number;
    AE_table_mean: number;
    AE_spindle_mean: number;
}

export interface PredictionResponse {
    "Predicted Tool Wear (VB)": number;
}

export type WearStatus = "Low wear" | "Medium wear" | "High wear";

export type PredictionHistoryEntry = {
    id: string;
    timestamp: string;
    prediction: number;
    status: WearStatus;
    inputs: PredictionRequest;
};
