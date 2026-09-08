"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { createQuickTap, deleteExpense, logExpense } from "@/app/actions";
import { NewTileSheet } from "@/components/home/NewTileSheet";
import { TodayList } from "@/components/home/TodayList";
import {
  LogSheet,
  type CategoryOption,
  type EventOption,
} from "@/components/keypad/LogSheet";
import { Amount } from "@/components/ui/Amount";
import { Card, SectionLabel } from "@/components/ui/Card";
import { TapTile } from "@/components/ui/TapTile";
import { Outbox } from "@/components/pwa/Outbox";
import { countdownLabel } from "@/lib/events";
import { formatMinor } from "@/lib/money";
import { queueExpense } from "@/lib/outbox";

export type Entry = {
  id: string;
  amountMinor: number;
  note: string | null;
  spentAt: Date;
  categoryName: string;
  categoryEmoji: string;
};

type Tile = {
  id: string;
  label: string;
  emoji: string;
  amountMinor: number | null;
  categoryId: string;
};

export type Banner = {
  emoji: string;
  name: string;
  daysAway: number;
  budgetMinor: number;
  spentMinor: number;
};

type Props = {
  tiles: Tile[];
  categories: CategoryOption[];
  events: EventOption[];
  today: Entry[];
  monthTotal: number;
  banner: Banner | null;
};

type Optimistic =
  | { kind: "add"; entry: Entry }
  | { kind: "remove"; id: string };

export function HomeClient({
  tiles,
  categories,
  events,
  today,
  monthTotal,
  banner,
}: Props) {
  const [, startTransition] = useTransition();
  const [keypadFor, setKeypadFor] = useState<string | null>(null);
  const [addingTile, setAddingTile] = useState(false);

  const [entries, applyOptimistic] = useOptimistic(
    today,
    (state: Entry[], action: Optimistic) =>
      action.kind === "add"
        ? [action.entry, ...state]
        : state.filter((e) => e.id !== action.id),
  );

  const dayTotal = entries.reduce((n, e) => n + e.amountMinor, 0);
  const monthWithPending = monthTotal - today.reduce((n, e) => n + e.amountMinor, 0) + dayTotal;

  function log(
    amountMinor: number,
    categoryId: string,
    note: string,
    eventId: string | null = null,
  ) {
    const category = categories.find((c) => c.id === categoryId)!;
    startTransition(async () => {
      applyOptimistic({
        kind: "add",
        entry: {
          id: `pending-${Date.now()}`,
          amountMinor,
          note: note || null,
          spentAt: new Date(),
          categoryName: category.name,
          categoryEmoji: category.emoji,
        },
      });
      try {
        await logExpense({ categoryId, amountMinor, note: note || undefined, eventId });
      } catch {
        // No signal, or the write failed. Hold it rather than lose the tap.
        queueExpense({
          categoryId,
          amountMinor,
          note: note || undefined,
          eventId,
          categoryName: category.name,
          categoryEmoji: category.emoji,
          queuedAt: Date.now(),
        });
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      applyOptimistic({ kind: "remove", id });
      await deleteExpense(id);
    });
  }

  function tapped(tile: Tile) {
    if (tile.amountMinor === null) return setKeypadFor(tile.categoryId);
    log(tile.amountMinor, tile.categoryId, "");
  }

  return (
    <>
      <section className="relative px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -left-4 h-40 w-64 opacity-25 blur-3xl"
          style={{
            background: "radial-gradient(closest-side, var(--color-sky-400), transparent)",
          }}
        />
        <div className="relative">
          <Amount minor={dayTotal} size="hero" tone={dayTotal > 0 ? "gold" : "muted"} />
          <p className="mt-1 text-sm text-sky-200">
            {entries.length === 0
              ? "nothing logged yet"
              : `${entries.length} ${entries.length === 1 ? "entry" : "entries"} today`}
          </p>
        </div>

        <div className="relative mt-5 flex items-baseline justify-between">
          <SectionLabel>This month</SectionLabel>
          <span className="text-sm font-bold text-sky-100">
            {formatMinor(monthWithPending)}
          </span>
        </div>
      </section>

      <Outbox />

      {banner && (
        <section className="px-6">
          <Link href="/events" className="block">
            <Card variant="event" className="flex items-center gap-3">
              <span className="text-2xl">{banner.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gold-300">
                  {banner.name}
                </p>
                <p className="text-xs text-umber-300">
                  {countdownLabel(banner.daysAway)} ·{" "}
                  {formatMinor(banner.spentMinor)} of{" "}
                  {formatMinor(banner.budgetMinor)}
                </p>
              </div>
            </Card>
          </Link>
        </section>
      )}

      <section className="px-6">
        <div className="grid grid-cols-3 gap-3">
          {tiles.map((tile) => (
            <TapTile
              key={tile.id}
              emoji={tile.emoji}
              label={tile.label}
              amountMinor={tile.amountMinor}
              onPress={() => tapped(tile)}
            />
          ))}
          <TapTile emoji="+" label="New" onPress={() => setAddingTile(true)} addTile />
        </div>
      </section>

      <section className="px-6">
        {entries.length === 0 ? (
          <Card>
            <p className="text-sm text-sky-200">
              Tap a tile to log your first spend. Tiles without an amount open the
              keypad; tiles with one log instantly.
            </p>
          </Card>
        ) : (
          <TodayList entries={entries} onDelete={remove} />
        )}
      </section>

      <LogSheet
        open={keypadFor !== null}
        onClose={() => setKeypadFor(null)}
        categories={categories}
        events={events}
        initialCategoryId={keypadFor}
        onSubmit={log}
      />

      <NewTileSheet
        open={addingTile}
        onClose={() => setAddingTile(false)}
        categories={categories}
        onSubmit={(tile) => startTransition(() => createQuickTap(tile))}
      />
    </>
  );
}
