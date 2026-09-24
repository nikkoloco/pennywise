"use client";

import { Amount } from "@/components/ui/Amount";
import { Card, SectionLabel } from "@/components/ui/Card";
import type { byLender } from "@/lib/insights";
import { formatMinor } from "@/lib/money";

type Row = ReturnType<typeof byLender>[number];

/**
 * How much of the period was bought on a card or with borrowed money, by who
 * is owed. Each bar is the amount put on that card or person, with the part
 * still unpaid drawn in gold, so what is left to settle stands out.
 *
 * Hidden when nothing in the period was paid later.
 */
export function OwedSplit({ rows, total }: { rows: Row[]; total: number }) {
  if (rows.length === 0) return null;

  const owed = rows.reduce((n, r) => n + r.total, 0);
  const unpaid = rows.reduce((n, r) => n + r.unpaid, 0);
  const largest = Math.max(...rows.map((r) => r.total));

  return (
    <section className="px-6">
      <SectionLabel>Paid later</SectionLabel>
      <Card className="mt-3">
        <p className="text-sm text-sky-200">
          {formatMinor(owed)} of {formatMinor(total)} went on a card or borrowed money
          {unpaid > 0 ? `, ${formatMinor(unpaid)} still to pay back.` : ", all paid back."}
        </p>
        <ul className="mt-4 flex flex-col gap-4">
          {rows.map((row) => (
            <li key={row.owedTo}>
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-sky-100">{row.owedTo}</p>
                  <p className={`text-xs ${row.unpaid > 0 ? "text-gold-300" : "text-sky-300"}`}>
                    {row.unpaid > 0 ? `${formatMinor(row.unpaid)} unpaid` : "Paid back"}
                  </p>
                </div>
                <Amount minor={row.total} size="sm" tone="paper" />
              </div>
              <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-ink-600">
                <div
                  className="h-full bg-sky-400"
                  style={{ width: `${((row.total - row.unpaid) / largest) * 100}%` }}
                />
                <div
                  className="h-full bg-gold-500"
                  style={{ width: `${(row.unpaid / largest) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
