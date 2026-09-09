"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import {
  createQuickTap,
  createUpcoming,
  deleteExpense,
  deleteUpcoming,
  logExpense,
  updateExpense,
  updateQuickTap,
  updateUpcoming,
} from "@/app/actions";
import {
  NewTileSheet,
  type TileDraft,
  type TileInput,
} from "@/components/home/NewTileSheet";
import {
  UpcomingSheet,
  type UpcomingInput,
  type UpcomingItem,
} from "@/components/home/UpcomingSheet";
import { TodayList } from "@/components/home/TodayList";
import {
  LogSheet,
  type CategoryOption,
  type EventOption,
  type ExpenseDraft,
} from "@/components/keypad/LogSheet";
import { Amount } from "@/components/ui/Amount";
import { Card, SectionLabel } from "@/components/ui/Card";
import { TapTile } from "@/components/ui/TapTile";
import { Outbox } from "@/components/pwa/Outbox";
import { countdownLabel } from "@/lib/events";
import { cutoffLabel } from "@/lib/payPeriod";
import { monthLabel } from "@/lib/time";
import { formatMinor } from "@/lib/money";
import { queueExpense } from "@/lib/outbox";

export type Entry = {
  id: string;
  amountMinor: number;
  note: string | null;
  spentAt: Date;
  /** Carried so an entry can be reopened for correction. */
  categoryId: string;
  eventId: string | null;
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

export type Plan = {
  id: string;
  emoji: string;
  name: string;
  monthsAway: number;
  cutoff: number;
  /** The month it falls in, as "YYYY-MM". */
  occursOn: string;
  budgetMinor: number;
  spentMinor: number;
};

type Props = {
  tiles: Tile[];
  categories: CategoryOption[];
  events: EventOption[];
  today: Entry[];
  monthTotal: number;
  /** Spend since the last payday, and the two dates that bound it. */
  payTotal: number;
  payLabel: string;
  /** What this month's plans still expect to cost, on top of what is spent. */
  planned: number;
  plans: Plan[];
  upcoming: UpcomingItem[];
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
  payTotal,
  payLabel,
  planned,
  plans,
  upcoming,
}: Props) {
  const [, startTransition] = useTransition();
  const [keypadFor, setKeypadFor] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<ExpenseDraft | null>(null);
  const [addingTile, setAddingTile] = useState(false);
  const [editingTile, setEditingTile] = useState<TileDraft | null>(null);
  /** A tile logs on tap, so correcting one needs a mode rather than a gesture. */
  const [arrangingTiles, setArrangingTiles] = useState(false);
  const [addingUpcoming, setAddingUpcoming] = useState(false);
  const [editingUpcoming, setEditingUpcoming] = useState<UpcomingItem | null>(null);

  const [entries, applyOptimistic] = useOptimistic(
    today,
    (state: Entry[], action: Optimistic) =>
      action.kind === "add"
        ? [action.entry, ...state]
        : state.filter((e) => e.id !== action.id),
  );

  const dayTotal = entries.reduce((n, e) => n + e.amountMinor, 0);
  // Today sits inside both windows, so an optimistic entry has to move both.
  const settledToday = today.reduce((n, e) => n + e.amountMinor, 0);
  const monthWithPending = monthTotal - settledToday + dayTotal;
  const payWithPending = payTotal - settledToday + dayTotal;

  /** Covers subgroups too, since a logged category may be one level down. */
  function categoryFor(id: string) {
    for (const group of categories) {
      if (group.id === id) return { name: group.name, emoji: group.emoji };
      const child = group.children.find((c) => c.id === id);
      if (child) return { name: child.name, emoji: group.emoji };
    }
    return { name: "", emoji: "" };
  }

  function log(
    amountMinor: number,
    categoryId: string,
    note: string,
    eventId: string | null = null,
  ) {
    const category = categoryFor(categoryId);
    startTransition(async () => {
      applyOptimistic({
        kind: "add",
        entry: {
          id: `pending-${Date.now()}`,
          amountMinor,
          note: note || null,
          spentAt: new Date(),
          categoryId,
          eventId,
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
    if (arrangingTiles) return setEditingTile({ ...tile });
    if (tile.amountMinor === null) return setKeypadFor(tile.categoryId);
    log(tile.amountMinor, tile.categoryId, "");
  }

  function submitEntry(
    amountMinor: number,
    categoryId: string,
    note: string,
    eventId: string | null,
  ) {
    if (!editingEntry) return log(amountMinor, categoryId, note, eventId);
    const id = editingEntry.id;
    setEditingEntry(null);
    startTransition(() => updateExpense({ id, categoryId, amountMinor, note, eventId }));
  }

  function submitTile(tile: TileInput) {
    const target = editingTile;
    startTransition(() =>
      target ? updateQuickTap({ ...tile, id: target.id }) : createQuickTap(tile),
    );
  }

  function submitUpcoming(item: UpcomingInput) {
    const target = editingUpcoming;
    startTransition(() =>
      target ? updateUpcoming({ ...item, id: target.id }) : createUpcoming(item),
    );
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
          <div>
            <SectionLabel>This cutoff</SectionLabel>
            <p className="mt-0.5 text-[11px] text-sky-400">{payLabel}</p>
          </div>
          <span className="text-sm font-bold text-sky-100">
            {formatMinor(payWithPending)}
          </span>
        </div>

        <div className="relative mt-3 flex items-baseline justify-between">
          <SectionLabel>This month</SectionLabel>
          <span className="text-sm font-bold text-sky-100">
            {formatMinor(monthWithPending + planned)}
          </span>
        </div>
        {planned > 0 && (
          /* Umber marks the planned half, so one figure never hides the fact
             that part of it has not actually left yet. */
          <p className="relative mt-1 text-right text-xs text-umber-300">
            {formatMinor(monthWithPending)} spent · {formatMinor(planned)} still planned
          </p>
        )}
      </section>

      <Outbox />

      {plans.length > 0 && (
        <section>
          {/* One card wide, snapping as you swipe, so a dozen plans take no more
              room than one and none of them is hidden behind a "nearest" rule. */}
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-1">
            {plans.map((plan) => (
              <Link
                key={plan.id}
                href="/events"
                className="w-[85%] shrink-0 snap-start"
              >
                <Card variant="event" className="flex items-center gap-3">
                  <span className="text-2xl">{plan.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gold-300">
                      {plan.name}
                    </p>
                    <p className="text-xs text-umber-300">
                      {monthLabel(plan.occursOn)} · {cutoffLabel(plan.cutoff)}
                    </p>
                    <p className="text-xs text-umber-300">
                      {countdownLabel(plan.monthsAway)} ·{" "}
                      {formatMinor(plan.spentMinor)} of{" "}
                      {formatMinor(plan.budgetMinor)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="px-6">
        {/* Umber throughout: these are future money, and a guess at that, so
            they must never read as something already spent. */}
        <SectionLabel>Coming up</SectionLabel>
        <div className="-mx-6 mt-2 flex gap-2 overflow-x-auto px-6 pb-1">
          {upcoming.map((item) => (
            <span
              key={item.id}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-umber-700 py-2 pr-2 pl-3 text-sm text-gold-300"
            >
              {/* The chip opens it for correction; the cross still removes it. */}
              <button
                type="button"
                onClick={() => setEditingUpcoming(item)}
                className="flex items-center gap-1.5"
              >
                <span>{item.emoji}</span>
                {item.name}
                <span className="text-xs text-umber-300">
                  ~{formatMinor(item.approxMinor)} · {item.cutoff === 1 ? "1st" : "2nd"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => startTransition(() => deleteUpcoming(item.id))}
                aria-label={`Remove ${item.name}`}
                className="flex size-5 items-center justify-center rounded-full text-umber-300"
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setAddingUpcoming(true)}
            className="shrink-0 rounded-full border border-dashed border-umber-500 px-3 py-2 text-sm text-umber-300"
          >
            + Add
          </button>
        </div>
      </section>

      <section className="px-6">
        <div className="grid grid-cols-4 gap-2">
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
        <button
          type="button"
          onClick={() => setArrangingTiles(!arrangingTiles)}
          className="mt-3 min-h-11 text-xs font-semibold text-sky-300"
        >
          {arrangingTiles ? "Done editing" : "Edit tiles"}
        </button>
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
          <TodayList
            entries={entries}
            onDelete={remove}
            onEdit={(entry) =>
              setEditingEntry({
                id: entry.id,
                amountMinor: entry.amountMinor,
                categoryId: entry.categoryId,
                note: entry.note ?? "",
                eventId: entry.eventId,
              })
            }
          />
        )}
      </section>

      <LogSheet
        open={keypadFor !== null || editingEntry !== null}
        onClose={() => {
          setKeypadFor(null);
          setEditingEntry(null);
        }}
        categories={categories}
        events={events}
        initialCategoryId={keypadFor}
        initial={editingEntry}
        onSubmit={submitEntry}
      />

      <UpcomingSheet
        open={addingUpcoming || editingUpcoming !== null}
        onClose={() => {
          setAddingUpcoming(false);
          setEditingUpcoming(null);
        }}
        initial={editingUpcoming}
        onSubmit={submitUpcoming}
      />

      <NewTileSheet
        open={addingTile || editingTile !== null}
        onClose={() => {
          setAddingTile(false);
          setEditingTile(null);
        }}
        categories={categories}
        initial={editingTile}
        onSubmit={submitTile}
      />
    </>
  );
}
