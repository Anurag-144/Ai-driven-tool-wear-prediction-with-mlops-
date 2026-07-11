"use client";

import { Button } from "@/components/ui/button";

interface PredictButtonProps {
    loading: boolean;
    onClick: () => void;
}

export default function PredictButton({
    loading,
    onClick,
}: PredictButtonProps) {
    return (
        <Button
            onClick={onClick}
            disabled={loading}
            className="w-full h-12 text-lg rounded-xl"
        >
            {loading ? "Predicting..." : "Predict Tool Wear"}
        </Button>
    );
}