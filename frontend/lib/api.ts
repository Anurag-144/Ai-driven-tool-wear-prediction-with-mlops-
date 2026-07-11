import { PredictionRequest } from "@/types/prediction";

const API_URL = "https://toolwear-api.onrender.com";

export async function predictToolWear(data: PredictionRequest) {
    const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Prediction failed");
    }

    return response.json();
}