"use client";

import { useState, useTransition } from "react";
import { createEvent, deleteEvent, logExpense, updateEvent } from "@/app/actions";
import {
  NewEventSheet,
  type PlanDraft,
  type PlanInput,
} from "@/components/events/NewEventSheet";
import {
  LogSheet,
  type CategoryOption,
  type ExpensePrefill,
} from "@/components/keypad/LogSheet";
import { Amount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { countdownLabel } from "@/lib/events";
import { formatMinor } from "@/lib/money";
import { usePaySchedule } from "@/components/PayScheduleProvider";
import { cutoffCount, cutoffLabel } from "@/lib/payPeriod";
import { monthLabel } from "@/lib/time";

export type EventCard = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** The month it falls in, as "YYYY-MM". */
  occursOn: string;
  monthsAway: number;
  budgetMinor: number;
  spentMinor: number;
  isRecurringAnnual: boolean;
  cutoff: number;
};

type Props = {
  events: EventCard[];
  categories: CategoryOption[];
};

export function EventsClient({ events, categories }: Props) {
  const schedule = usePaySchedule();
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<PlanDraft | null>(null);
  const [logging, setLogging] = useState<ExpensePrefill | null>(null);

  /** One sheet serves both jobs; which it is depends on whether it was given a plan. */
  const sheetOpen = adding || editing !== null;

  function closeSheet() {
    setAdding(false);
    setEditing(null);
  }

  function submit(input: PlanInput) {
    startTransition(() =>
      editing ? updateEvent({ ...input, id: editing.id }) : createEvent(input),
    );
  }

  /**
   * Logging is the same action as anywhere else, carrying the plan's id so the
   * spend counts towards it. What is left of the budget is offered as the
   * amount, since that is usually the bill; a category still has to be picked.
   */
  function spend(card: EventCard) {
    setLogging({
      amountMinor: Math.max(0, card.budgetMinor - card.spentMinor),
      note: card.name,
      eventId: card.id,
    });
  }

  function edit(card: EventCard) {
    setEditing({
      id: card.id,
      name: card.name,
      emoji: card.emoji,
      eventMonth: card.occursOn,
      budgetMinor: card.budgetMinor,
      isRecurringAnnual: card.isRecurringAnnual,
      cutoff: card.cutoff,
    });
  }

  return (
    <>
      <section className="px-6">
        <Button onClick={() => setAdding(true)} className="w-full">
          Add anticipated expenditure
        </Button>
      </section>

      <section className="flex flex-col gap-3 px-6">
        {events.length === 0 ? (
          <Card variant="event">
            <p className="text-sm text-gold-300">
              Trips, birthdays and holidays go here. Give one a month, a cutoff
              and a budget, then attach spending to it as it happens.
            </p>
          </Card>
        ) : (
          events.map((event) => {
            const pct = Math.min(100, (event.spentMinor / event.budgetMinor) * 100);
            const over = event.spentMinor > event.budgetMinor;
            const left = event.budgetMinor - event.spentMinor;

            return (
              <Card key={event.id} variant="event">
                {/* The whole card is the edit affordance; Remove opts out of it. */}
                <button
                  type="button"
                  onClick={() => edit(event)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span className="text-2xl">{event.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gold-300">
                      {event.name}
                    </p>
                    <p className="text-xs text-umber-300">
                      {monthLabel(event.occursOn)}
                      {cutoffCount(schedule) > 1 && ` · ${cutoffLabel(event.cutoff, schedule)}`}
                    </p>
                    <p className="text-xs text-umber-300">
                      {countdownLabel(event.monthsAway)}
                      {event.isRecurringAnnual && " · every year"}
                    </p>
                  </div>
                  <Amount minor={event.budgetMinor} size="sm" tone="gold" />
                </button>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-umber-500">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: over
                        ? "var(--color-swatch-8)"
                        : `var(--color-${event.color})`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-umber-300">
                  {formatMinor(event.spentMinor)} spent ·{" "}
                  {over
                    ? `${formatMinor(-left)} over`
                    : `${formatMinor(left)} left`}
                </p>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => spend(event)}
                    className="min-h-11 rounded-full bg-gold-500 px-4 text-sm font-semibold text-ink-900"
                  >
                    Log spending
                  </button>
                  <button
                    type="button"
                    onClick={() => startTransition(() => deleteEvent(event.id))}
                    className="min-h-11 px-3 text-xs font-semibold text-umber-300"
                  >
                    Remove
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </section>

      <NewEventSheet
        open={sheetOpen}
        onClose={closeSheet}
        initial={editing}
        onSubmit={submit}
      />

      <LogSheet
        open={logging !== null}
        onClose={() => setLogging(null)}
        categories={categories}
        events={events.map((e) => ({ id: e.id, name: e.name, emoji: e.emoji }))}
        initialCategoryId={null}
        prefill={logging}
        onSubmit={(amountMinor, categoryId, note, eventId) =>
          startTransition(() =>
            logExpense({ categoryId, amountMinor, note: note || undefined, eventId }),
          )
        }
      />
    </>
  );
}
