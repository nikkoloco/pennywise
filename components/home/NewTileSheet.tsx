"use client";

import { useState } from "react";
import { Keypad } from "@/components/keypad/Keypad";
import type { CategoryOption } from "@/components/keypad/LogSheet";
import { Amount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";

type NewTile = {
  label: string;
  emoji: string;
  categoryId: string | null;
  amountMinor: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  onSubmit: (tile: NewTile) => void;
};

/** Adds a tile, and a category to go with it when none of the existing ones fit. */
export function NewTileSheet({ open, onClose, ...rest }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="New tile">
      <NewTileForm {...rest} onClose={onClose} />
    </Sheet>
  );
}

function NewTileForm({
  categories,
  onSubmit,
  onClose,
}: Omit<Props, "open"> & { onClose: () => void }) {
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);

  const ready = label.trim().length > 0 && emoji.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="🙂"
          maxLength={8}
          aria-label="Emoji"
          className="min-h-11 w-16 rounded-2xl bg-ink-700 text-center text-xl focus:outline-none"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label, e.g. Milk Tea"
          maxLength={24}
          aria-label="Label"
          className="min-h-11 flex-1 rounded-2xl bg-ink-700 px-4 text-sm text-sky-100 placeholder:text-sky-400 focus:outline-none"
        />
      </div>

      <div>
        <p className="mb-2 text-xs tracking-[0.15em] text-sky-300 uppercase">Category</p>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          <button
            type="button"
            onClick={() => setCategoryId(null)}
            className={`shrink-0 rounded-full px-3 py-2 text-sm ${
              categoryId === null
                ? "bg-gold-500 font-semibold text-ink-900"
                : "bg-ink-700 text-sky-200"
            }`}
          >
            New category
          </button>
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
      </div>

      <div>
        <p className="mb-1 text-xs tracking-[0.15em] text-sky-300 uppercase">
          Preset amount
        </p>
        <p className="mb-3 text-xs text-sky-400">
          Leave at zero and the tile opens the keypad. Set one and a single tap logs it.
        </p>
        <div className="mb-3 text-center">
          <Amount minor={amount} size="lg" tone={amount > 0 ? "gold" : "muted"} />
        </div>
        <Keypad value={amount} onChange={setAmount} />
      </div>

      <Button
        onClick={() => {
          onSubmit({
            label: label.trim(),
            emoji: emoji.trim(),
            categoryId,
            amountMinor: amount > 0 ? amount : null,
          });
          onClose();
        }}
        className={ready ? "" : "pointer-events-none opacity-40"}
      >
        Add tile
      </Button>
    </div>
  );
}
