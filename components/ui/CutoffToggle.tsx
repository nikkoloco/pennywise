"use client";

import { cutoffLabel } from "@/lib/payPeriod";

type Props = {
  value: 1 | 2;
  onChange: (cutoff: 1 | 2) => void;
  label?: string;
  /** Umber for future money, matching whichever sheet this sits in. */
  tone?: "ink" | "umber";
};

/** Which half of the month's pay covers something. Always one or the other. */
export function CutoffToggle({ value, onChange, label = "Paid on", tone = "ink" }: Props) {
  const unselected = tone === "umber" ? "bg-umber-700 text-gold-300" : "bg-ink-700 text-sky-200";
  const selected =
    tone === "umber" ? "bg-gold-500 font-semibold text-ink-900" : "bg-sky-400 font-semibold text-ink-900";

  return (
    <div>
      <p
        className={`mb-2 text-xs tracking-[0.15em] uppercase ${
          tone === "umber" ? "text-umber-300" : "text-sky-300"
        }`}
      >
        {label}
      </p>
      <div className="flex gap-2">
        {([1, 2] as const).map((cutoff) => (
          <button
            key={cutoff}
            type="button"
            onClick={() => onChange(cutoff)}
            className={`min-h-11 flex-1 rounded-2xl px-3 text-sm ${
              cutoff === value ? selected : unselected
            }`}
          >
            {cutoffLabel(cutoff)}
          </button>
        ))}
      </div>
    </div>
  );
}
