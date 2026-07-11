"use client";

interface PredictionCardProps {
    prediction: number | null;
    loading: boolean;
}

export default function PredictionCard({
    prediction,
    loading,
}: PredictionCardProps) {
    const percentage =
        prediction !== null
            ? Math.min((prediction / 1.0) * 100, 100)
            : 0;

    let status = "Waiting";
    let color = "bg-gray-400";

    if (prediction !== null) {
        if (prediction < 0.3) {
            status = "Low Wear";
            color = "bg-green-500";
        } else if (prediction < 0.6) {
            status = "Moderate Wear";
            color = "bg-yellow-500";
        } else {
            status = "High Wear";
            color = "bg-red-500";
        }
    }

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">

            <h2 className="text-2xl font-bold">
                AI Prediction
            </h2>

            <p className="mt-2 text-zinc-500">
                Predicted tool wear from the AI model.
            </p>

            <div className="mt-10">

                <div className="text-6xl font-bold text-blue-600">
                    {loading
                        ? "..."
                        : prediction !== null
                            ? prediction.toFixed(4)
                            : "--"}
                </div>

                <div className="mt-2 text-zinc-500">
                    Tool Wear (VB)
                </div>

            </div>

            <div className="mt-8">

                <div className="h-3 overflow-hidden rounded-full bg-zinc-200">

                    <div
                        className={`h-full transition-all duration-700 ${color}`}
                        style={{ width: `${percentage}%` }}
                    />

                </div>

            </div>

            <div className="mt-6 flex items-center justify-between">

                <span className="font-medium">
                    Status
                </span>

                <span className="font-semibold">
                    {loading ? "Predicting..." : status}
                </span>

            </div>

        </div>
    );
}