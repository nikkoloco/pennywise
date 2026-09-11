"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setPaySchedule } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  CADENCE_LABELS,
  type PayCadence,
  type PaySchedule,
  WEEKDAY_NAMES,
} from "@/lib/payPeriod";

const FIELD =
  "min-h-11 w-full rounded-2xl bg-ink-600 px-4 text-sm text-sky-100 placeholder:text-sky-400 focus:outline-none";

const CADENCES: PayCadence[] = ["monthly", "twice_a_month", "weekly"];

/** What each cadence starts from when picked, before the real days are typed in. */
const STARTING_DAYS: Record<PayCadence, number[]> = {
  monthly: [30],
  twice_a_month: [15, 30],
  weekly: [5],
};

/**
 * When pay lands. A cutoff is the stretch between two paydays, so this is
 * what every "this cutoff" total and every "pay it from" choice is built on.
 */
export function PayScheduleCard({ initial }: { initial: PaySchedule }) {
  const router = useRouter();
  const [cadence, setCadence] = useState(initial.cadence);
  const [days, setDays] = useState(initial.paydays.map(String));
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function pick(next: PayCadence) {
    setCadence(next);
    setDays((next === initial.cadence ? initial.paydays : STARTING_DAYS[next]).map(String));
    setNote(null);
  }

  function setDay(index: number, value: string) {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 2);
    setDays(days.map((d, i) => (i === index ? digits : d)));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setNote(null);

    const result = await setPaySchedule({ cadence, paydays: days.map(Number) });
    if (result.ok) {
      setNote("Saved. Every cutoff now follows this.");
      router.refresh();
    } else {
      setNote(result.message);
    }

    setBusy(false);
  }

  return (
    <Card>
      <form onSubmit={save} className="flex flex-col gap-4">
        <div className="flex rounded-full bg-ink-600 p-1">
          {CADENCES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => pick(value)}
              aria-pressed={value === cadence}
              className={`flex-1 rounded-full py-2 text-center text-sm ${
                value === cadence ? "bg-sky-400 font-semibold text-ink-900" : "text-sky-200"
              }`}
            >
              {CADENCE_LABELS[value]}
            </button>
          ))}
        </div>

        {cadence === "weekly" ? (
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_NAMES.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => setDays([String(i + 1)])}
                aria-pressed={days[0] === String(i + 1)}
                className={`min-h-11 rounded-2xl text-sm ${
                  days[0] === String(i + 1)
                    ? "bg-sky-400 font-semibold text-ink-900"
                    : "bg-ink-600 text-sky-200"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-3">
            {days.map((day, i) => (
              <label key={i} className="flex-1">
                <span className="mb-1 block text-xs text-sky-300">
                  {cadence === "monthly" ? "Day of the month" : i === 0 ? "1st cutoff" : "2nd cutoff"}
                </span>
                <input
                  inputMode="numeric"
                  value={day}
                  onChange={(e) => setDay(i, e.target.value)}
                  placeholder={String(STARTING_DAYS[cadence][i])}
                  required
                  className={FIELD}
                />
              </label>
            ))}
          </div>
        )}

        <p className="text-xs text-sky-400">
          {cadence === "weekly"
            ? "The day of the week pay lands. A cutoff runs the seven days ending on it."
            : "The days pay lands. A day a month is too short for, like the 30th in February, lands on its last day."}
        </p>

        <Button type="submit" className="w-full">
          {busy ? "One moment" : "Save cutoff"}
        </Button>
        <p role="status" aria-live="polite" className="h-4 text-center text-xs text-gold-300">
          {note ?? ""}
        </p>
      </form>
    </Card>
  );
}
