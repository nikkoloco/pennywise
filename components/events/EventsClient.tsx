"use client";

import { useState, useTransition } from "react";
import { createEvent, deleteEvent } from "@/app/actions";
import { NewEventSheet } from "@/components/events/NewEventSheet";
import { Amount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { countdownLabel } from "@/lib/events";
import { formatMinor } from "@/lib/money";

export type EventCard = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  occursOn: string;
  daysAway: number;
  budgetMinor: number;
  spentMinor: number;
  isRecurringAnnual: boolean;
};

export function EventsClient({ events }: { events: EventCard[] }) {
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  return (
    <>
      <section className="px-6">
        <Button onClick={() => setAdding(true)} className="w-full">
          Plan something
        </Button>
      </section>

      <section className="flex flex-col gap-3 px-6">
        {events.length === 0 ? (
          <Card variant="event">
            <p className="text-sm text-gold-300">
              Trips, birthdays and holidays go here. Give one a date and a budget,
              then attach spending to it as it happens.
            </p>
          </Card>
        ) : (
          events.map((event) => {
            const pct = Math.min(100, (event.spentMinor / event.budgetMinor) * 100);
            const over = event.spentMinor > event.budgetMinor;
            const left = event.budgetMinor - event.spentMinor;

            return (
              <Card key={event.id} variant="event">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{event.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gold-300">
                      {event.name}
                    </p>
                    <p className="text-xs text-umber-300">
                      {countdownLabel(event.daysAway)}
                      {event.isRecurringAnnual && " · every year"}
                    </p>
                  </div>
                  <Amount minor={event.budgetMinor} size="sm" tone="gold" />
                </div>

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

                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-umber-300">
                    {formatMinor(event.spentMinor)} spent ·{" "}
                    {over
                      ? `${formatMinor(-left)} over`
                      : `${formatMinor(left)} left`}
                  </p>
                  <button
                    type="button"
                    onClick={() => startTransition(() => deleteEvent(event.id))}
                    className="text-xs font-semibold text-umber-300"
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
        open={adding}
        onClose={() => setAdding(false)}
        onSubmit={(event) => startTransition(() => createEvent(event))}
      />
    </>
  );
}
