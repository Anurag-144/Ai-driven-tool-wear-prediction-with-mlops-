import { PredictionRequest } from "@/types/prediction";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://toolwear-api.onrender.com";

export async function predictToolWear(data: PredictionRequest) {
    const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result?.detail
                ? JSON.stringify(result.detail)
                : "Prediction failed"
        );
    }

    return result;
}