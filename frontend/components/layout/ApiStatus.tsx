"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { RefreshCw } from "lucide-react";

const API_URL = "https://toolwear-api.onrender.com";

type ApiState = "checking" | "online" | "offline";

export default function ApiStatus() {
    const [status, setStatus] = useState<ApiState>("checking");

    const controllerRef = useRef<AbortController | null>(null);

    const checkApi = useCallback(async () => {
        // Cancel a previous unfinished request.
        controllerRef.current?.abort();

        const controller = new AbortController();
        controllerRef.current = controller;

        const timeout = window.setTimeout(() => {
            controller.abort();
        }, 15000);

        try {
            const response = await fetch(API_URL, {
                method: "GET",
                cache: "no-store",
                signal: controller.signal,
            });

            // Only update state if this is still the latest request.
            if (controllerRef.current === controller) {
                setStatus(response.ok ? "online" : "offline");
            }
        } catch (error) {
            if (controllerRef.current === controller) {
                setStatus("offline");

                if (
                    !(
                        error instanceof DOMException &&
                        error.name === "AbortError"
                    )
                ) {
                    console.error("API health check failed:", error);
                }
            }
        } finally {
            window.clearTimeout(timeout);

            if (controllerRef.current === controller) {
                controllerRef.current = null;
            }
        }
    }, []);

    useEffect(() => {
        // Run after the effect finishes instead of synchronously inside it.
        const initialCheck = window.setTimeout(() => {
            void checkApi();
        }, 0);

        const interval = window.setInterval(() => {
            void checkApi();
        }, 30000);

        return () => {
            window.clearTimeout(initialCheck);
            window.clearInterval(interval);

            const activeController = controllerRef.current;
            controllerRef.current = null;
            activeController?.abort();
        };
    }, [checkApi]);

    function handleManualCheck() {
        // This is an event handler, so setting checking state here is valid.
        setStatus("checking");
        void checkApi();
    }

    const styles = {
        checking: {
            wrapper: "border-amber-200 bg-amber-50 text-amber-700",
            dot: "bg-amber-500",
            text: "Checking API",
        },
        online: {
            wrapper:
                "border-emerald-200 bg-emerald-50 text-emerald-700",
            dot: "bg-emerald-500",
            text: "API online",
        },
        offline: {
            wrapper: "border-red-200 bg-red-50 text-red-700",
            dot: "bg-red-500",
            text: "API offline",
        },
    };

    const current = styles[status];

    return (
        <button
            type="button"
            onClick={handleManualCheck}
            title="Check API status again"
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition hover:opacity-80 ${current.wrapper}`}
        >
            <span className="relative flex h-2.5 w-2.5">
                {status === "online" && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                )}

                <span
                    className={`relative inline-flex h-2.5 w-2.5 rounded-full ${current.dot}`}
                />
            </span>

            <span>{current.text}</span>

            {status !== "online" && (
                <RefreshCw
                    size={13}
                    className={
                        status === "checking" ? "animate-spin" : ""
                    }
                />
            )}
        </button>
    );
}