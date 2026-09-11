"use client";

import { usePaySchedule } from "@/components/PayScheduleProvider";
import { cutoffCount, cutoffLabel } from "@/lib/payPeriod";

type Props = {
  value: number;
  onChange: (cutoff: number) => void;
  label?: string;
  /** Umber for future money, matching whichever sheet this sits in. */
  tone?: "ink" | "umber";
};

/**
 * Which of the month's cutoffs covers something. Always one of them, and
 * nothing to show when the account is paid once a month, since a choice of
 * one is not a choice.
 */
export function CutoffToggle({ value, onChange, label = "Paid on", tone = "ink" }: Props) {
  const schedule = usePaySchedule();
  const count = cutoffCount(schedule);
  if (count === 1) return null;

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
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: count }, (_, i) => i + 1).map((cutoff) => (
          <button
            key={cutoff}
            type="button"
            onClick={() => onChange(cutoff)}
            className={`min-h-11 rounded-2xl px-3 text-sm ${
              cutoff === value ? selected : unselected
            }`}
          >
            {cutoffLabel(cutoff, schedule)}
          </button>
        ))}
      </div>
    </div>
  );
}
