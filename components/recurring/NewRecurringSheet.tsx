"use client";

import { useState } from "react";
import { Keypad } from "@/components/keypad/Keypad";
import { DraftAmount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { draftToMinor } from "@/lib/money";
import { cutoffLabel } from "@/lib/payPeriod";

export type CategoryChoice = { id: string; name: string; emoji: string };

export type NewRecurring = {
  name: string;
  emoji: string;
  categoryId: string;
  amountMinor: number;
  everyMonths: number;
  runsForMonths: number | null;
  cutoff: 1 | 2;
  startMonth: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  categories: CategoryChoice[];
  /** The cutoff we are in now, which is the sensible default to pay on. */
  cutoff: number;
  startMonth: string;
  onSubmit: (entry: NewRecurring) => void;
};

/** Common rhythms, so the usual case is a tap rather than typing a number. */
const FREQUENCIES = [
  { months: 1, label: "Monthly" },
  { months: 3, label: "Quarterly" },
  { months: 6, label: "Twice a year" },
  { months: 12, label: "Yearly" },
];

export function NewRecurringSheet({ open, onClose, ...rest }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="New recurring">
      <RecurringForm {...rest} onClose={onClose} />
    </Sheet>
  );
}

function RecurringForm({
  categories,
  cutoff,
  startMonth,
  onSubmit,
  onClose,
}: Omit<Props, "open">) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [everyMonths, setEveryMonths] = useState(1);
  const [runsFor, setRunsFor] = useState("");
  const [payOn, setPayOn] = useState<1 | 2>(cutoff === 1 ? 1 : 2);

  const amountMinor = draftToMinor(draft);
  const ready = name.trim() && emoji.trim() && categoryId && amountMinor > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="🎬"
          maxLength={8}
          aria-label="Emoji"
          className="min-h-11 w-16 rounded-2xl bg-ink-700 text-center text-xl focus:outline-none"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Netflix"
          maxLength={40}
          aria-label="Name"
          className="min-h-11 flex-1 rounded-2xl bg-ink-700 px-4 text-sm text-sky-100 placeholder:text-sky-400 focus:outline-none"
        />
      </div>

      <div>
        <p className="mb-2 text-xs tracking-[0.15em] text-sky-300 uppercase">Category</p>
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
      </div>

      <div>
        <p className="mb-2 text-xs tracking-[0.15em] text-sky-300 uppercase">How often</p>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {FREQUENCIES.map((f) => (
            <button
              key={f.months}
              type="button"
              onClick={() => setEveryMonths(f.months)}
              className={`shrink-0 rounded-full px-3 py-2 text-sm ${
                f.months === everyMonths
                  ? "bg-sky-400 font-semibold text-ink-900"
                  : "bg-ink-700 text-sky-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs tracking-[0.15em] text-sky-300 uppercase">Stop after</p>
        <p className="mb-2 text-xs text-sky-400">
          Months from now. Leave it blank and it carries on indefinitely.
        </p>
        <input
          inputMode="numeric"
          value={runsFor}
          onChange={(e) => setRunsFor(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
          placeholder="e.g. 12"
          aria-label="Stop after how many months"
          className="min-h-11 w-full rounded-2xl bg-ink-700 px-4 text-sm text-sky-100 placeholder:text-sky-400 focus:outline-none"
        />
      </div>

      <div>
        <p className="mb-2 text-xs tracking-[0.15em] text-sky-300 uppercase">Paid on</p>
        <div className="flex gap-2">
          {([1, 2] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setPayOn(c)}
              className={`min-h-11 flex-1 rounded-2xl px-3 text-sm ${
                c === payOn
                  ? "bg-sky-400 font-semibold text-ink-900"
                  : "bg-ink-700 text-sky-200"
              }`}
            >
              {cutoffLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs tracking-[0.15em] text-sky-300 uppercase">Amount</p>
        <div className="mb-3 text-center">
          <DraftAmount draft={draft} size="lg" tone={amountMinor > 0 ? "gold" : "muted"} />
        </div>
        <Keypad draft={draft} onChange={setDraft} />
      </div>

      <Button
        onClick={() => {
          if (!categoryId) return;
          onSubmit({
            name: name.trim(),
            emoji: emoji.trim(),
            categoryId,
            amountMinor,
            everyMonths,
            runsForMonths: runsFor ? Number(runsFor) : null,
            cutoff: payOn,
            startMonth,
          });
          onClose();
        }}
        className={ready ? "" : "pointer-events-none opacity-40"}
      >
        Add it
      </Button>
    </div>
  );
}
