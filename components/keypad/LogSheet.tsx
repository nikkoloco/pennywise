"use client";

import { useState } from "react";
import { Keypad } from "@/components/keypad/Keypad";
import { Amount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";

export type CategoryOption = { id: string; name: string; emoji: string };

type Props = {
  open: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  initialCategoryId: string | null;
  onSubmit: (amountMinor: number, categoryId: string, note: string) => void;
};

/**
 * The form lives in a child so it mounts fresh on every open, which starts each
 * entry blank without resetting state after the fact.
 */
export function LogSheet({ open, onClose, ...rest }: Props) {
  return (
    <Sheet open={open} onClose={onClose}>
      <LogForm {...rest} onClose={onClose} />
    </Sheet>
  );
}

function LogForm({
  categories,
  initialCategoryId,
  onSubmit,
  onClose,
}: Omit<Props, "open"> & { onClose: () => void }) {
  const [amount, setAmount] = useState(0);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [note, setNote] = useState("");

  const ready = amount > 0 && categoryId !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <Amount minor={amount} size="hero" tone={amount > 0 ? "gold" : "muted"} />
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryId(c.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm ${
              c.id === categoryId
                ? "bg-sky-400 font-semibold text-ink-900"
                : "bg-ink-700 text-sky-200"
            }`}
          >
            <span>{c.emoji}</span>
            {c.name}
          </button>
        ))}
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        maxLength={140}
        className="min-h-11 rounded-2xl bg-ink-700 px-4 text-sm text-sky-100 placeholder:text-sky-400 focus:outline-none"
      />

      <Keypad value={amount} onChange={setAmount} />

      <Button
        onClick={() => {
          onSubmit(amount, categoryId!, note.trim());
          onClose();
        }}
        className={ready ? "" : "pointer-events-none opacity-40"}
      >
        Log it
      </Button>
    </div>
  );
}
