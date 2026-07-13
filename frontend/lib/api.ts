import type {
    PredictionRequest,
    PredictionResponse,
} from "@/types/prediction";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://toolwear-api.onrender.com";

export async function predictToolWear(
    data: PredictionRequest
): Promise<PredictionResponse> {
    const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const result: unknown = await response.json();

    if (!response.ok) {
        const detail =
            typeof result === "object" &&
            result !== null &&
            "detail" in result
                ? result.detail
                : null;

        throw new Error(
            detail
                ? JSON.stringify(detail)
                : "Prediction failed"
        );
    }

    if (
        typeof result !== "object" ||
        result === null ||
        !("Predicted Tool Wear (VB)" in result) ||
        typeof result["Predicted Tool Wear (VB)"] !== "number"
    ) {
        throw new Error("The API returned an invalid prediction.");
    }

    return {
        "Predicted Tool Wear (VB)": result["Predicted Tool Wear (VB)"],
    };
}
