"use client";

import { useState } from "react";
import { CategoryDonut } from "@/components/insights/CategoryDonut";
import { PeriodBars } from "@/components/insights/PeriodBars";
import { Amount } from "@/components/ui/Amount";
import { Card, SectionLabel } from "@/components/ui/Card";
import { byCategory, bucketTotals, type InsightEntry } from "@/lib/insights";
import type { Period } from "@/lib/period";

type Props = {
  entries: InsightEntry[];
  period: Period;
  offset: number;
  /** Rendered between the bars and the entry list, above the fold-out detail. */
  habits: React.ReactNode;
};

export function InsightsClient({ entries, period, offset, habits }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const slices = byCategory(entries);
  const total = entries.reduce((n, e) => n + e.amountMinor, 0);
  const listed = selected ? entries.filter((e) => e.categoryName === selected) : entries;
  // Bars follow the selection so donut, chart and list all describe the same slice.
  const bars = bucketTotals(listed, period, offset);

  if (entries.length === 0) {
    return (
      <section className="px-6">
        <Card>
          <p className="text-sm text-sky-200">
            Nothing logged in this period yet. Charts appear here once there is
            spending to draw.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <>
      <section className="px-6">
        <CategoryDonut
          slices={slices}
          total={total}
          selected={selected}
          onSelect={setSelected}
        />
      </section>

      <section className="px-6">
        <div className="flex flex-wrap gap-2">
          {slices.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setSelected(s.name === selected ? null : s.name)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${
                s.name === selected
                  ? "bg-sky-400 font-semibold text-ink-900"
                  : "bg-ink-700 text-sky-200"
              }`}
            >
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: `var(--color-${s.color})` }}
              />
              {s.emoji} {s.name}
            </button>
          ))}
        </div>
      </section>

      <section className="px-6">
        <SectionLabel>
          {selected ? `${selected} across the ${period}` : `Across the ${period}`}
        </SectionLabel>
        <PeriodBars data={bars} />
      </section>

      {habits}

      <section className="px-6">
        <SectionLabel>
          {selected ? `${selected} · ${listed.length}` : `All ${listed.length} entries`}
        </SectionLabel>
        <ul className="mt-2 divide-y divide-ink-700">
          {listed.slice(0, 20).map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 py-3">
              <span className="text-lg">{entry.categoryEmoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-sky-100">{entry.categoryName}</p>
                <p className="truncate text-xs text-sky-300">
                  {entry.note ? `${entry.note} · ` : ""}
                  {entry.day}
                </p>
              </div>
              <Amount minor={entry.amountMinor} size="sm" tone="paper" />
            </li>
          ))}
        </ul>
        {listed.length > 20 && (
          <p className="mt-3 text-xs text-sky-400">
            Showing the 20 most recent of {listed.length}.
          </p>
        )}
      </section>
    </>
  );
}
