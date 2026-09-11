"use client";

import { useState } from "react";
import { Keypad } from "@/components/keypad/Keypad";
import { DraftAmount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { CutoffToggle } from "@/components/ui/CutoffToggle";
import { DEFAULT_EMOJI, EmojiPicker } from "@/components/ui/EmojiPicker";
import { Sheet } from "@/components/ui/Sheet";
import { draftToMinor, minorToDraft } from "@/lib/money";

export type PlanInput = {
  name: string;
  emoji: string;
  /** "YYYY-MM". Anticipated spending is due in a month, never on a day. */
  eventMonth: string;
  budgetMinor: number;
  isRecurringAnnual: boolean;
  cutoff: number;
};

export type PlanDraft = PlanInput & { id: string };

type Props = {
  open: boolean;
  onClose: () => void;
  /** Present when correcting one that already exists. */
  initial?: PlanDraft | null;
  onSubmit: (event: PlanInput) => void;
};

export function NewEventSheet({ open, onClose, initial, onSubmit }: Props) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={initial ? "Edit" : "Anticipated expenditure"}
    >
      {/* Keyed so switching between entries starts from that entry's values. */}
      <PlanForm
        key={initial?.id ?? "new"}
        initial={initial}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </Sheet>
  );
}

function PlanForm({ initial, onSubmit, onClose }: Omit<Props, "open">) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? DEFAULT_EMOJI);
  const [eventMonth, setEventMonth] = useState(initial?.eventMonth ?? "");
  const [draft, setDraft] = useState(initial ? minorToDraft(initial.budgetMinor) : "");
  const [recurring, setRecurring] = useState(initial?.isRecurringAnnual ?? false);
  const [cutoff, setCutoff] = useState(initial?.cutoff ?? 1);

  const budget = draftToMinor(draft);
  const ready = name.trim() && eventMonth && budget > 0;

  return (
    <div className="flex flex-col gap-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Japan trip"
        maxLength={40}
        aria-label="Name"
        className="min-h-11 rounded-2xl bg-umber-700 px-4 text-sm text-gold-300 placeholder:text-umber-300 focus:outline-none"
      />

      <EmojiPicker value={emoji} onChange={setEmoji} tone="umber" />

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

      <CutoffToggle value={cutoff} onChange={setCutoff} label="Pay it from" tone="umber" />

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
          Anticipated budget
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
            emoji,
            eventMonth,
            budgetMinor: budget,
            isRecurringAnnual: recurring,
            cutoff,
          });
          onClose();
        }}
        className={ready ? "" : "pointer-events-none opacity-40"}
      >
        {initial ? "Save" : "Add it"}
      </Button>
    </div>
  );
}
