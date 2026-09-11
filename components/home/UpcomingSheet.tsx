"use client";

import { useState } from "react";
import { Keypad } from "@/components/keypad/Keypad";
import { DraftAmount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { CutoffToggle } from "@/components/ui/CutoffToggle";
import { DEFAULT_EMOJI, EmojiPicker } from "@/components/ui/EmojiPicker";
import { Sheet } from "@/components/ui/Sheet";
import { draftToMinor, minorToDraft } from "@/lib/money";

export type UpcomingInput = {
  name: string;
  emoji: string;
  approxMinor: number;
  cutoff: number;
};

export type UpcomingItem = UpcomingInput & { id: string };

type Props = {
  open: boolean;
  onClose: () => void;
  /** Present when correcting one that already exists. */
  initial?: UpcomingItem | null;
  onSubmit: (item: UpcomingInput) => void;
};

/**
 * Something coming up that you cannot cost properly yet. No date, just which
 * half of the month's pay should absorb it, because the alternative is not
 * writing it down at all.
 */
export function UpcomingSheet({ open, onClose, initial, onSubmit }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={initial ? "Edit" : "Coming up"}>
      {/* Keyed so switching between entries starts from that entry's values. */}
      <UpcomingForm
        key={initial?.id ?? "new"}
        initial={initial}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </Sheet>
  );
}

function UpcomingForm({ initial, onSubmit, onClose }: Omit<Props, "open">) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? DEFAULT_EMOJI);
  const [draft, setDraft] = useState(initial ? minorToDraft(initial.approxMinor) : "");
  const [cutoff, setCutoff] = useState(initial?.cutoff ?? 1);

  const approxMinor = draftToMinor(draft);
  const ready = name.trim() && approxMinor > 0;

  return (
    <div className="flex flex-col gap-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Concert tickets"
        maxLength={40}
        aria-label="Name"
        className="min-h-11 rounded-2xl bg-umber-700 px-4 text-sm text-gold-300 placeholder:text-umber-300 focus:outline-none"
      />

      <EmojiPicker value={emoji} onChange={setEmoji} tone="umber" />

      <CutoffToggle value={cutoff} onChange={setCutoff} label="Pay it from" tone="umber" />

      <div>
        <p className="mb-1 text-xs tracking-[0.15em] text-umber-300 uppercase">
          Rough cost
        </p>
        <p className="mb-3 text-xs text-umber-300">
          A guess is fine. This never counts towards any total.
        </p>
        <div className="mb-3 text-center">
          <DraftAmount draft={draft} size="lg" tone={approxMinor > 0 ? "gold" : "muted"} />
        </div>
        <Keypad draft={draft} onChange={setDraft} />
      </div>

      <Button
        onClick={() => {
          onSubmit({ name: name.trim(), emoji, approxMinor, cutoff });
          onClose();
        }}
        className={ready ? "" : "pointer-events-none opacity-40"}
      >
        {initial ? "Save" : "Add it"}
      </Button>
    </div>
  );
}
