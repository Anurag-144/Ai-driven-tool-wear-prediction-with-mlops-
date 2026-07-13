import type { WearStatus } from "@/types/prediction";

export const WEAR_THRESHOLDS = {
    lowUpperBound: 0.2,
    mediumUpperBound: 0.35,
} as const;

export type WearBandKey = "low" | "medium" | "high";

export type WearStatusDetails = {
    key: WearBandKey;
    level: WearStatus;
    title: string;
    summary: string;
    recommendation: string;
    badgeClass: string;
    iconClass: string;
    strokeClass: string;
    chartColor: string;
};

export function getWearStatus(value: number): WearStatusDetails {
    if (value < WEAR_THRESHOLDS.lowUpperBound) {
        return {
            key: "low",
            level: "Low wear",
            title: "Lower estimated wear",
            summary:
                "The model estimates a lower level of wear for the current inputs.",
            recommendation:
                "Continue following the established inspection and maintenance procedure.",
            badgeClass: "bg-emerald-100/85 text-emerald-800",
            iconClass: "bg-emerald-100 text-emerald-700",
            strokeClass: "stroke-emerald-500",
            chartColor: "#10b981",
        };
    }

    if (value < WEAR_THRESHOLDS.mediumUpperBound) {
        return {
            key: "medium",
            level: "Medium wear",
            title: "Moderate estimated wear",
            summary:
                "The model estimates moderate wear. Review the tool and continue monitoring.",
            recommendation:
                "Review the tool condition and continue monitoring according to your procedure.",
            badgeClass: "bg-amber-100/85 text-amber-800",
            iconClass: "bg-amber-100 text-amber-700",
            strokeClass: "stroke-amber-500",
            chartColor: "#f59e0b",
        };
    }

    return {
        key: "high",
        level: "High wear",
        title: "Higher estimated wear",
        summary:
            "The model estimates a higher level of wear. Inspect the tool before continuing production.",
        recommendation:
            "Inspect the cutting tool before continuing production and follow established maintenance procedures.",
        badgeClass: "bg-red-100/85 text-red-800",
        iconClass: "bg-red-100 text-red-700",
        strokeClass: "stroke-red-500",
        chartColor: "#ef4444",
    };
}
