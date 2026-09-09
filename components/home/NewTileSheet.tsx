"use client";

import { useState } from "react";
import { Keypad } from "@/components/keypad/Keypad";
import type { CategoryOption } from "@/components/keypad/LogSheet";
import { DraftAmount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { DEFAULT_EMOJI, EmojiPicker } from "@/components/ui/EmojiPicker";
import { Sheet } from "@/components/ui/Sheet";
import { draftToMinor, minorToDraft } from "@/lib/money";

export type TileInput = {
  label: string;
  emoji: string;
  categoryId: string | null;
  amountMinor: number | null;
};

export type TileDraft = {
  id: string;
  label: string;
  emoji: string;
  categoryId: string;
  amountMinor: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  /** Present when correcting a tile that already exists. */
  initial?: TileDraft | null;
  onSubmit: (tile: TileInput) => void;
};

/** Adds a tile, and a category to go with it when none of the existing ones fit. */
export function NewTileSheet({ open, onClose, initial, ...rest }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={initial ? "Edit tile" : "New tile"}>
      {/* Keyed so switching between tiles starts from that tile's values. */}
      <NewTileForm key={initial?.id ?? "new"} initial={initial} {...rest} onClose={onClose} />
    </Sheet>
  );
}

function NewTileForm({ categories, initial, onSubmit, onClose }: Omit<Props, "open">) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? DEFAULT_EMOJI);
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [draft, setDraft] = useState(
    initial?.amountMinor ? minorToDraft(initial.amountMinor) : "",
  );

  const amount = draftToMinor(draft);
  const ready = label.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label, e.g. Milk Tea"
        maxLength={24}
        aria-label="Label"
        className="min-h-11 rounded-2xl bg-ink-700 px-4 text-sm text-sky-100 placeholder:text-sky-400 focus:outline-none"
      />

      <EmojiPicker value={emoji} onChange={setEmoji} />

      <div>
        <p className="mb-2 text-xs tracking-[0.15em] text-sky-300 uppercase">Category</p>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {/* Editing a tile always has a category already, so this only offers
              to invent one while creating. */}
          {!initial && (
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
          )}
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
          <DraftAmount draft={draft} size="lg" tone={amount > 0 ? "gold" : "muted"} />
        </div>
        <Keypad draft={draft} onChange={setDraft} />
      </div>

      <Button
        onClick={() => {
          onSubmit({
            label: label.trim(),
            emoji,
            categoryId,
            amountMinor: amount > 0 ? amount : null,
          });
          onClose();
        }}
        className={ready ? "" : "pointer-events-none opacity-40"}
      >
        {initial ? "Save" : "Add tile"}
      </Button>
    </div>
  );
}
