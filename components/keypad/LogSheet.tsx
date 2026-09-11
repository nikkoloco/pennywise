"use client";

import { useState, useTransition } from "react";
import { createSubcategory } from "@/app/actions";
import { Keypad } from "@/components/keypad/Keypad";
import { DraftAmount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { draftToMinor, minorToDraft } from "@/lib/money";

export type SubcategoryOption = { id: string; name: string };
export type CategoryOption = {
  id: string;
  name: string;
  emoji: string;
  /** Subgroups, e.g. Groceries and Canteen under Food. Often empty. */
  children: SubcategoryOption[];
};
export type EventOption = { id: string; name: string; emoji: string };

/** A new expense that opens with its answers already in, e.g. from a plan. */
export type ExpensePrefill = {
  amountMinor: number;
  note: string;
  eventId: string;
};

/** An expense being corrected rather than created. */
export type ExpenseDraft = {
  id: string;
  amountMinor: number;
  categoryId: string;
  note: string;
  eventId: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  events: EventOption[];
  initialCategoryId: string | null;
  /** Present when correcting an entry that is already logged. */
  initial?: ExpenseDraft | null;
  /** Present when the entry is new but its amount, note and plan are known. */
  prefill?: ExpensePrefill | null;
  onSubmit: (
    amountMinor: number,
    categoryId: string,
    note: string,
    eventId: string | null,
  ) => void;
};

/**
 * The form lives in a child so it mounts fresh on every open, which starts each
 * entry blank without resetting state after the fact.
 */
export function LogSheet({ open, onClose, ...rest }: Props) {
  return (
    <Sheet open={open} onClose={onClose}>
      {/* Keyed so opening a different entry starts from that entry's values. */}
      <LogForm
        key={rest.initial?.id ?? rest.prefill?.eventId ?? rest.initialCategoryId ?? "new"}
        {...rest}
        onClose={onClose}
      />
    </Sheet>
  );
}

function LogForm({
  categories,
  events,
  initialCategoryId,
  initial,
  prefill,
  onSubmit,
  onClose,
}: Omit<Props, "open"> & { onClose: () => void }) {
  const [, startTransition] = useTransition();
  const given = initial ?? prefill;
  const [draft, setDraft] = useState(given ? minorToDraft(given.amountMinor) : "");
  // An entry filed under a subgroup opens with that subgroup already chosen.
  const parentOf = (id: string) =>
    categories.find((c) => c.id === id || c.children.some((k) => k.id === id)) ?? null;
  const opened = initial ? parentOf(initial.categoryId) : null;
  const [groupId, setGroupId] = useState(opened?.id ?? initialCategoryId);
  const [childId, setChildId] = useState<string | null>(
    initial && opened && opened.id !== initial.categoryId ? initial.categoryId : null,
  );
  const [addingChild, setAddingChild] = useState(false);
  const [childName, setChildName] = useState("");
  const [note, setNote] = useState(given?.note ?? "");
  const [eventId, setEventId] = useState<string | null>(given?.eventId ?? null);

  const group = categories.find((c) => c.id === groupId) ?? null;
  // The subgroup is the more precise answer, so it wins when one is chosen.
  const categoryId = childId ?? groupId;
  const amount = draftToMinor(draft);
  const ready = amount > 0 && categoryId !== null;

  function pickGroup(id: string) {
    setGroupId(id);
    setChildId(null);
    setAddingChild(false);
  }

  function addChild() {
    const name = childName.trim();
    if (!name || !groupId) return;
    startTransition(async () => {
      setChildId(await createSubcategory({ parentId: groupId, name }));
    });
    setChildName("");
    setAddingChild(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <DraftAmount draft={draft} size="hero" tone={amount > 0 ? "gold" : "muted"} />
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => pickGroup(c.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm ${
              c.id === groupId
                ? "bg-sky-400 font-semibold text-ink-900"
                : "bg-ink-700 text-sky-200"
            }`}
          >
            <span>{c.emoji}</span>
            {c.name}
          </button>
        ))}
      </div>

      {group && (
        <div>
          <p className="mb-2 text-xs tracking-[0.15em] text-sky-300 uppercase">
            {group.name} is
          </p>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {group.children.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setChildId(child.id === childId ? null : child.id)}
                className={`shrink-0 rounded-full px-3 py-2 text-sm ${
                  child.id === childId
                    ? "bg-sky-400 font-semibold text-ink-900"
                    : "bg-ink-700 text-sky-200"
                }`}
              >
                {child.name}
              </button>
            ))}

            {addingChild ? (
              <input
                autoFocus
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                onBlur={addChild}
                onKeyDown={(e) => e.key === "Enter" && addChild()}
                placeholder="New subgroup"
                maxLength={30}
                aria-label={`New subgroup of ${group.name}`}
                className="min-h-11 w-36 shrink-0 rounded-full bg-ink-700 px-3 text-sm text-sky-100 placeholder:text-sky-400 focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setAddingChild(true)}
                className="shrink-0 rounded-full border border-dashed border-ink-500 px-3 py-2 text-sm text-sky-300"
              >
                + New
              </button>
            )}
          </div>
        </div>
      )}

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        maxLength={140}
        className="min-h-11 rounded-2xl bg-ink-700 px-4 text-sm text-sky-100 placeholder:text-sky-400 focus:outline-none"
      />

      {events.length > 0 && (
        <div>
          {/* Umber throughout: attributing spend to a plan is the one place the
              two kinds of money meet. */}
          <p className="mb-2 text-xs tracking-[0.15em] text-umber-300 uppercase">
            Count towards
          </p>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            <button
              type="button"
              onClick={() => setEventId(null)}
              className={`shrink-0 rounded-full px-3 py-2 text-sm ${
                eventId === null
                  ? "bg-umber-500 font-semibold text-gold-300"
                  : "bg-ink-700 text-sky-200"
              }`}
            >
              Nothing
            </button>
            {events.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEventId(e.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm ${
                  e.id === eventId
                    ? "bg-gold-500 font-semibold text-ink-900"
                    : "bg-umber-700 text-gold-300"
                }`}
              >
                <span>{e.emoji}</span>
                {e.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <Keypad draft={draft} onChange={setDraft} />

      <Button
        onClick={() => {
          onSubmit(amount, categoryId!, note.trim(), eventId);
          onClose();
        }}
        className={ready ? "" : "pointer-events-none opacity-40"}
      >
        {initial ? "Save" : "Log it"}
      </Button>
    </div>
  );
}
