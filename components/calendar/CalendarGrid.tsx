"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteExpense, logExpense, updateExpense } from "@/app/actions";
import {
  LogSheet,
  type CategoryOption,
  type EventOption,
  type ExpenseDraft,
} from "@/components/keypad/LogSheet";
import { Amount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { formatCompact, formatMinor } from "@/lib/money";
import { dayLabel, monthLabel, shiftMonth } from "@/lib/time";

export type DayEntry = {
  id: string;
  day: string;
  amountMinor: number;
  note: string | null;
  /** Carried so an entry can be reopened for correction. */
  categoryId: string;
  eventId: string | null;
  time: string;
  categoryName: string;
  categoryEmoji: string;
};

type Props = {
  monthKey: string;
  entries: DayEntry[];
  todayKey: string;
  /** Days from this one to today can still be filled in or corrected; older ones are history. */
  editableFrom: string;
  categories: CategoryOption[];
  events: EventOption[];
  monthTotal: number;
  prevMonthTotal: number;
  /** True while the month is still running, so the comparison is like for like. */
  partial: boolean;
};

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** Navy through sky to gold: the brighter the cell, the heavier the day. */
const HEAT = [
  "bg-ink-800 text-sky-400",
  "bg-ink-600 text-sky-200",
  "bg-sky-400/40 text-sky-100",
  "bg-sky-400/75 text-ink-900",
  "bg-gold-500 text-ink-900",
];

export function CalendarGrid({
  monthKey,
  entries,
  todayKey,
  editableFrom,
  categories,
  events,
  monthTotal,
  prevMonthTotal,
  partial,
}: Props) {
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<ExpenseDraft | null>(null);
  const [adding, setAdding] = useState(false);

  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Monday-first, so shift Sunday (0) to the end of the week.
  const leading = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;

  const totals = new Map<string, number>();
  for (const e of entries) {
    totals.set(e.day, (totals.get(e.day) ?? 0) + e.amountMinor);
  }
  const heaviest = Math.max(0, ...totals.values());

  function level(total: number) {
    if (total === 0) return 0;
    return Math.ceil((total / heaviest) * 4);
  }

  const selectedEntries = entries.filter((e) => e.day === selected);
  const selectedTotal = selectedEntries.reduce((n, e) => n + e.amountMinor, 0);
  const delta = monthTotal - prevMonthTotal;
  const recent = (key: string) => key >= editableFrom && key <= todayKey;
  const editable = selected !== null && recent(selected);

  function save(amountMinor: number, categoryId: string, note: string, eventId: string | null) {
    const target = editing;
    const day = selected!;
    setEditing(null);
    setAdding(false);
    startTransition(() =>
      target
        ? updateExpense({ id: target.id, categoryId, amountMinor, note, eventId })
        : logExpense({ categoryId, amountMinor, note, eventId, spentOn: day }),
    );
  }

  return (
    <>
      <section className="flex items-center justify-between px-6">
        <MonthLink monthKey={shiftMonth(monthKey, -1)} label="Previous month" back />
        <div className="text-center">
          <p className="text-sm font-semibold text-paper">{monthLabel(monthKey)}</p>
          <p className="text-xs text-sky-300">{formatMinor(monthTotal)}</p>
        </div>
        <MonthLink monthKey={shiftMonth(monthKey, 1)} label="Next month" />
      </section>

      <section className="px-6">
        <div className="mb-2 grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-center text-[10px] text-sky-400">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: leading }, (_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const dayNumber = i + 1;
            const key = `${monthKey}-${String(dayNumber).padStart(2, "0")}`;
            const total = totals.get(key) ?? 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => (total > 0 || recent(key)) && setSelected(key)}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg text-xs ${
                  HEAT[level(total)]
                } ${
                  key === todayKey
                    ? /* Offset keeps the ring readable even on a gold cell. */
                      "ring-2 ring-gold-500 ring-offset-1 ring-offset-ink-900"
                    : ""
                }`}
              >
                <span className="font-semibold">{dayNumber}</span>
                {total > 0 && (
                  <span className="text-[9px] opacity-80">{formatCompact(total)}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-6">
        <SectionLabel>Versus last month</SectionLabel>
        <p className="mt-1 text-sm text-sky-200">
          {prevMonthTotal === 0
            ? "Nothing logged last month to compare against."
            : `${formatMinor(Math.abs(delta))} ${delta >= 0 ? "more" : "less"} than ${
                partial ? "the same stretch of " : ""
              }${monthLabel(shiftMonth(monthKey, -1))}.`}
        </p>
      </section>

      <Sheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? dayLabel(selected) : ""}
      >
        <div className="mb-3 text-center">
          <Amount minor={selectedTotal} size="lg" />
        </div>
        <ul className="divide-y divide-ink-700">
          {selectedEntries.map((entry) => (
            <li key={entry.id} className="flex items-center">
              {/* A recent row opens for correction; an old one is just read. */}
              <button
                type="button"
                disabled={!editable}
                onClick={() =>
                  setEditing({
                    id: entry.id,
                    amountMinor: entry.amountMinor,
                    categoryId: entry.categoryId,
                    note: entry.note ?? "",
                    eventId: entry.eventId,
                  })
                }
                className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left"
              >
                <span className="text-lg">{entry.categoryEmoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-sky-100">{entry.categoryName}</p>
                  <p className="truncate text-xs text-sky-300">
                    {entry.note ? `${entry.note} · ` : ""}
                    {entry.time}
                  </p>
                </div>
                <Amount minor={entry.amountMinor} size="sm" tone="paper" />
              </button>
              {editable && (
                <button
                  type="button"
                  onClick={() => startTransition(() => deleteExpense(entry.id))}
                  aria-label={`Delete ${entry.categoryName}`}
                  className="flex size-11 shrink-0 items-center justify-center text-sky-400"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
        {editable && (
          <>
            {selectedEntries.length > 0 && (
              <p className="mt-3 text-center text-xs text-sky-400">
                Tap an entry to correct it, or the cross to remove it.
              </p>
            )}
            <Button variant="secondary" onClick={() => setAdding(true)} className="mt-4 w-full">
              Add an entry for this day
            </Button>
          </>
        )}
      </Sheet>

      <LogSheet
        open={editing !== null || adding}
        onClose={() => {
          setEditing(null);
          setAdding(false);
        }}
        categories={categories}
        events={events}
        initialCategoryId={null}
        initial={editing}
        onSubmit={save}
      />
    </>
  );
}

function MonthLink({
  monthKey,
  label,
  back = false,
}: {
  monthKey: string;
  label: string;
  back?: boolean;
}) {
  return (
    <Link
      href={`/calendar?m=${monthKey}`}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full text-sky-300"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={back ? undefined : { transform: "rotate(180deg)" }}
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </Link>
  );
}
