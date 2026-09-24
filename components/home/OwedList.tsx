"use client";

import { Amount } from "@/components/ui/Amount";
import { SectionLabel } from "@/components/ui/Card";
import { formatMinor } from "@/lib/money";
import { dayLabel } from "@/lib/time";

export type OwedItem = {
  id: string;
  amountMinor: number;
  note: string | null;
  owedTo: string;
  dueOn: string | null;
  categoryName: string;
  categoryEmoji: string;
};

type Props = {
  items: OwedItem[];
  todayKey: string;
  onSettle: (id: string) => void;
};

/**
 * Purchases made on a card or with borrowed money. They are logged, but the
 * money has not left yet, so they wait here until they are paid back.
 */
export function OwedList({ items, todayKey, onSettle }: Props) {
  if (items.length === 0) return null;

  const total = items.reduce((n, i) => n + i.amountMinor, 0);

  return (
    <section className="px-6">
      <div className="flex items-baseline justify-between">
        <SectionLabel>Still to pay back</SectionLabel>
        <span className="text-sm font-bold text-sky-100">{formatMinor(total)}</span>
      </div>
      <ul className="mt-2 divide-y divide-ink-700">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3">
            <span className="text-lg">{item.categoryEmoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-sky-100">
                {item.owedTo} · {item.note || item.categoryName}
              </p>
              {item.dueOn && (
                <p
                  className={`truncate text-xs ${
                    item.dueOn < todayKey ? "text-gold-500" : "text-sky-300"
                  }`}
                >
                  {item.dueOn < todayKey ? "Overdue since" : "Due"} {dayLabel(item.dueOn)}
                </p>
              )}
            </div>
            <Amount minor={item.amountMinor} size="sm" tone="paper" />
            <button
              type="button"
              onClick={() => onSettle(item.id)}
              className="min-h-11 shrink-0 rounded-full bg-ink-700 px-3 text-xs font-semibold text-sky-200"
            >
              Paid
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
