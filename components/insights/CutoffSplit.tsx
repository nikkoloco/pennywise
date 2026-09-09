"use client";

import { Amount } from "@/components/ui/Amount";
import { Card, SectionLabel } from "@/components/ui/Card";
import { cutoffLabel } from "@/lib/payPeriod";
import type { byCutoff } from "@/lib/insights";

type Row = ReturnType<typeof byCutoff>[number];

/**
 * The period split by pay packet.
 *
 * A calendar month is not how the money arrives: it comes twice, and what is
 * left depends on which packet you are spending from. Showing both halves
 * answers the question the monthly total cannot.
 *
 * Hidden when there is only one row, where it would restate the total, and
 * when there are many, where a year of packets is a list nobody reads.
 */
export function CutoffSplit({ rows }: { rows: Row[] }) {
  if (rows.length < 2 || rows.length > 6) return null;

  const largest = Math.max(...rows.map((r) => r.total));

  return (
    <section className="px-6">
      <SectionLabel>By cutoff</SectionLabel>
      <Card className="mt-3">
        <ul className="flex flex-col gap-4">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-sky-100">
                    {cutoffLabel(row.cutoff)}
                  </p>
                  <p className="text-xs text-sky-300">{row.label}</p>
                </div>
                <Amount minor={row.total} size="sm" tone="paper" />
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-600">
                <div
                  className="h-full rounded-full bg-sky-400"
                  style={{ width: `${largest === 0 ? 0 : (row.total / largest) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
