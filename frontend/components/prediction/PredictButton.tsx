"use client";

import { motion } from "framer-motion";
import { LoaderCircle, Sparkles } from "lucide-react";

interface PredictButtonProps {
    loading: boolean;
    onClick: () => void;
}

export default function PredictButton({
    loading,
    onClick,
}: PredictButtonProps) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            disabled={loading}
            whileHover={loading ? undefined : { scale: 1.025, y: -2 }}
            whileTap={loading ? undefined : { scale: 0.985 }}
            className="group flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-zinc-950 px-6 text-base font-bold text-white shadow-xl shadow-zinc-950/15 transition duration-300 hover:bg-blue-600 hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-70"
        >
            {loading ? (
                <>
                    <LoaderCircle size={21} className="animate-spin" />
                    Running XGBoost model...
                </>
            ) : (
                <>
                    <Sparkles
                        size={21}
                        className="transition duration-300 group-hover:rotate-12"
                    />
                    Run AI prediction
                </>
            )}
        </motion.button>
    );
}
