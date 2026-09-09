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
import { cutoffLabel } from "@/lib/payPeriod";
import { scheduleLabel } from "@/lib/recurring";

export type RecurringCard = {
  id: string;
  name: string;
  emoji: string;
  categoryId: string;
  amountMinor: number;
  everyMonths: number;
  runsForMonths: number | null;
  cutoff: number;
  startMonth: string;
  payOnDay: number | null;
  /** Owed in the cutoff being shown. */
  due: boolean;
  /** Already settled by a logged expense inside that cutoff. */
  paid: boolean;
};

type Props = {
  cards: RecurringCard[];
  cutoff: number;
  startMonth: string;
  categories: CategoryChoice[];
};

export function RecurringClient({ cards, cutoff, startMonth, categories }: Props) {
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
      everyMonths: card.everyMonths,
      runsForMonths: card.runsForMonths,
      cutoff: card.cutoff === 2 ? 2 : 1,
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
              one lands and which cutoff it comes out of, and it will show up as
              due when that cutoff comes around.
            </p>
          </Card>
        ) : (
          cards.map((card) => {
            const owed = card.due && !card.paid;

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
                      {scheduleLabel(card)} · {cutoffLabel(card.cutoff)}
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

                <div className="mt-4 flex items-center justify-between">
                  {owed ? (
                    <button
                      type="button"
                      onClick={() => pay(card)}
                      className="min-h-11 rounded-full bg-gold-500 px-4 text-sm font-semibold text-ink-900"
                    >
                      Log this payment
                    </button>
                  ) : (
                    <p className="text-xs text-sky-300">
                      {card.paid ? "logged this cutoff" : "not due this cutoff"}
                    </p>
                  )}

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

/** "1st", "2nd", "3rd", "4th" and the rest, for a day of the month. */
function ordinal(day: number) {
  if (day > 3 && day < 21) return "th";
  const last = day % 10;
  return last === 1 ? "st" : last === 2 ? "nd" : last === 3 ? "rd" : "th";
}
