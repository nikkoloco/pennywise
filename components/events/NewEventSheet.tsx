"use client";

import { useState } from "react";
import { Keypad } from "@/components/keypad/Keypad";
import { DraftAmount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { draftToMinor } from "@/lib/money";

type NewEvent = {
  name: string;
  emoji: string;
  /** "YYYY-MM". A plan is due in a month, never on a particular day. */
  eventMonth: string;
  budgetMinor: number;
  isRecurringAnnual: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: NewEvent) => void;
};

export function NewEventSheet({ open, onClose, onSubmit }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="New plan">
      <NewEventForm onSubmit={onSubmit} onClose={onClose} />
    </Sheet>
  );
}

function NewEventForm({ onSubmit, onClose }: Omit<Props, "open">) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [eventMonth, setEventMonth] = useState("");
  const [draft, setDraft] = useState("");
  const [recurring, setRecurring] = useState(false);

  const budget = draftToMinor(draft);
  const ready = name.trim() && emoji.trim() && eventMonth && budget > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="🎂"
          maxLength={8}
          aria-label="Emoji"
          className="min-h-11 w-16 rounded-2xl bg-umber-700 text-center text-xl focus:outline-none"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Japan trip"
          maxLength={40}
          aria-label="Name"
          className="min-h-11 flex-1 rounded-2xl bg-umber-700 px-4 text-sm text-gold-300 placeholder:text-umber-300 focus:outline-none"
        />
      </div>

      <div>
        <p className="mb-2 text-xs tracking-[0.15em] text-umber-300 uppercase">
          Month to pay
        </p>
        <input
          type="month"
          value={eventMonth}
          onChange={(e) => setEventMonth(e.target.value)}
          aria-label="Month to pay"
          className="min-h-11 w-full rounded-2xl bg-umber-700 px-4 text-sm text-gold-300 focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={() => setRecurring(!recurring)}
        className="flex items-center justify-between rounded-2xl bg-umber-700 px-4 py-3 text-left"
      >
        <span className="text-sm text-gold-300">
          Every year
          <span className="mt-0.5 block text-xs text-umber-300">
            Comes back in the same month, year after year
          </span>
        </span>
        <span
          className={`ml-3 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 ${
            recurring ? "bg-gold-500" : "bg-umber-500"
          }`}
        >
          <span
            className={`size-5 rounded-full bg-paper transition-transform ${
              recurring ? "translate-x-5" : ""
            }`}
          />
        </span>
      </button>

      <div>
        <p className="mb-2 text-xs tracking-[0.15em] text-umber-300 uppercase">
          Planned budget
        </p>
        <div className="mb-3 text-center">
          <DraftAmount draft={draft} size="lg" tone={budget > 0 ? "gold" : "muted"} />
        </div>
        <Keypad draft={draft} onChange={setDraft} />
      </div>

      <Button
        onClick={() => {
          onSubmit({
            name: name.trim(),
            emoji: emoji.trim(),
            eventMonth,
            budgetMinor: budget,
            isRecurringAnnual: recurring,
          });
          onClose();
        }}
        className={ready ? "" : "pointer-events-none opacity-40"}
      >
        Add plan
      </Button>
    </div>
  );
}
