"use client";

import { useState, useTransition } from "react";
import {
  createRecurring,
  deleteRecurring,
  logExpense,
  updateRecurring,
} from "@/app/actions";
import {
  NewRecurringSheet,
  type CategoryChoice,
  type RecurringDraft,
  type RecurringInput,
} from "@/components/recurring/NewRecurringSheet";
import { Amount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { usePaySchedule } from "@/components/PayScheduleProvider";
import { cutoffCount, cutoffLabel } from "@/lib/payPeriod";
import { scheduleLabel } from "@/lib/recurring";

export type RecurringCard = {
  id: string;
  name: string;
  emoji: string;
  categoryId: string;
  amountMinor: number;
  every: number;
  unit: "week" | "month";
  runsForMonths: number | null;
  /** Null lands in every cutoff. */
  cutoff: number | null;
  startMonth: string;
  payOnDay: number | null;
  /** How many payments the cutoff being shown owes. Weekly owes several. */
  dueCount: number;
  /** How many of them a logged expense has already settled. */
  paidCount: number;
};

type Props = {
  cards: RecurringCard[];
  cutoff: number;
  startMonth: string;
  categories: CategoryChoice[];
};

export function RecurringClient({ cards, cutoff, startMonth, categories }: Props) {
  const schedule = usePaySchedule();
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<RecurringDraft | null>(null);

  function submit(input: RecurringInput) {
    const target = editing;
    startTransition(() =>
      target ? updateRecurring({ ...input, id: target.id }) : createRecurring(input),
    );
  }

  function edit(card: RecurringCard) {
    setEditing({
      id: card.id,
      name: card.name,
      emoji: card.emoji,
      categoryId: card.categoryId,
      amountMinor: card.amountMinor,
      every: card.every,
      unit: card.unit,
      runsForMonths: card.runsForMonths,
      cutoff: card.cutoff,
      startMonth: card.startMonth.slice(0, 7),
      payOnDay: card.payOnDay,
    });
  }

  /**
   * Logging is the same action as anywhere else, carrying the entry's id so
   * the payment can be seen as settled. Nothing is ever written on a schedule.
   */
  function pay(card: RecurringCard) {
    startTransition(() =>
      logExpense({
        categoryId: card.categoryId,
        amountMinor: card.amountMinor,
        note: card.name,
        recurringId: card.id,
      }),
    );
  }

  return (
    <>
      <section className="px-6">
        <Button onClick={() => setAdding(true)} className="w-full">
          Add a recurring payment
        </Button>
      </section>

      <section className="flex flex-col gap-3 px-6">
        {cards.length === 0 ? (
          <Card>
            <p className="text-sm text-sky-200">
              Subscriptions, instalments and bills go here. Say how often each
              one lands — weekly and twice a month included — and it will show
              up as due when the cutoff it comes out of comes around.
            </p>
          </Card>
        ) : (
          cards.map((card) => {
            const owed = card.paidCount < card.dueCount;
            const note = status(card);

            return (
              <Card key={card.id} className={owed ? "border-gold-500/40" : undefined}>
                {/* The card opens it for correction; the buttons below opt out. */}
                <button
                  type="button"
                  onClick={() => edit(card)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span className="text-2xl">{card.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-sky-100">
                      {card.name}
                    </p>
                    <p className="text-xs text-sky-300">
                      {scheduleLabel(card)}
                      {/* A schedule landing in every cutoff has none to name. */}
                      {card.cutoff !== null &&
                        cutoffCount(schedule) > 1 &&
                        ` · ${cutoffLabel(card.cutoff, schedule)}`}
                    </p>
                    {card.payOnDay !== null && (
                      <p className="text-xs text-sky-300">
                        taken on the {card.payOnDay}
                        {ordinal(card.payOnDay)}
                      </p>
                    )}
                  </div>
                  <Amount minor={card.amountMinor} size="sm" />
                </button>

                <div className="mt-4 flex items-center justify-between gap-3">
                  {owed && (
                    <button
                      type="button"
                      onClick={() => pay(card)}
                      className="min-h-11 rounded-full bg-gold-500 px-4 text-sm font-semibold text-ink-900"
                    >
                      Log this payment
                    </button>
                  )}

                  {note && <p className="text-xs text-sky-300">{note}</p>}

                  <button
                    type="button"
                    onClick={() => startTransition(() => deleteRecurring(card.id))}
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

      <NewRecurringSheet
        open={adding || editing !== null}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        categories={categories}
        cutoff={cutoff}
        startMonth={startMonth}
        initial={editing}
        onSubmit={submit}
      />
    </>
  );
}

/**
 * Where the cutoff stands with this payment. Nothing to say when a single
 * payment is owed: the button beside it already says it. A schedule that lands
 * more than once counts them out, because one tap is not the whole of it.
 */
function status(card: RecurringCard) {
  if (card.dueCount === 0) return "not due this cutoff";
  if (card.dueCount > 1) return `${card.paidCount} of ${card.dueCount} logged this cutoff`;
  return card.paidCount > 0 ? "logged this cutoff" : null;
}

/** "1st", "2nd", "3rd", "4th" and the rest, for a day of the month. */
function ordinal(day: number) {
  if (day > 3 && day < 21) return "th";
  const last = day % 10;
  return last === 1 ? "st" : last === 2 ? "nd" : last === 3 ? "rd" : "th";
}
