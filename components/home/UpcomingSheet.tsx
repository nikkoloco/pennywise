"use client";

import { useState } from "react";
import { Keypad } from "@/components/keypad/Keypad";
import { DraftAmount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { draftToMinor } from "@/lib/money";

type NewUpcoming = { name: string; emoji: string; approxMinor: number };

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: NewUpcoming) => void;
};

/**
 * Something coming up that you cannot cost properly yet. No date and no
 * budget, just a name and a guess, because the alternative is not writing it
 * down at all.
 */
export function UpcomingSheet({ open, onClose, onSubmit }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Coming up">
      <UpcomingForm onSubmit={onSubmit} onClose={onClose} />
    </Sheet>
  );
}

function UpcomingForm({ onSubmit, onClose }: Omit<Props, "open">) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [draft, setDraft] = useState("");

  const approxMinor = draftToMinor(draft);
  const ready = name.trim() && emoji.trim() && approxMinor > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="🎤"
          maxLength={8}
          aria-label="Emoji"
          className="min-h-11 w-16 rounded-2xl bg-umber-700 text-center text-xl focus:outline-none"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Concert tickets"
          maxLength={40}
          aria-label="Name"
          className="min-h-11 flex-1 rounded-2xl bg-umber-700 px-4 text-sm text-gold-300 placeholder:text-umber-300 focus:outline-none"
        />
      </div>

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
          onSubmit({ name: name.trim(), emoji: emoji.trim(), approxMinor });
          onClose();
        }}
        className={ready ? "" : "pointer-events-none opacity-40"}
      >
        Add it
      </Button>
    </div>
  );
}
