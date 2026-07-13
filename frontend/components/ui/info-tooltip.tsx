import { HelpCircle } from "lucide-react";

type InfoTooltipProps = {
    label: string;
    text: string;
};

export default function InfoTooltip({ label, text }: InfoTooltipProps) {
    return (
        <span className="group/tooltip relative inline-flex shrink-0">
            <button
                type="button"
                aria-label={`Help for ${label}`}
                className="rounded-full p-1 text-zinc-400 transition hover:bg-white/70 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
                <HelpCircle size={17} aria-hidden="true" />
            </button>

            <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 w-64 translate-y-1 rounded-xl bg-zinc-950 px-3 py-2.5 text-left text-xs leading-5 text-white opacity-0 shadow-xl transition group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:translate-y-0 group-focus-within/tooltip:opacity-100"
            >
                {text}
            </span>
        </span>
    );
}
