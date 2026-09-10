"use client";

import { useState } from "react";
import { Keypad } from "@/components/keypad/Keypad";
import { DraftAmount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { CutoffToggle } from "@/components/ui/CutoffToggle";
import { DEFAULT_EMOJI, EmojiPicker } from "@/components/ui/EmojiPicker";
import { Sheet } from "@/components/ui/Sheet";
import { draftToMinor, minorToDraft } from "@/lib/money";
import {
  CADENCES,
  cadenceByKey,
  cadenceOf,
  spansBothCutoffs,
  type CadenceKey,
} from "@/lib/recurring";

export type CategoryChoice = { id: string; name: string; emoji: string };

export type RecurringInput = {
  name: string;
  emoji: string;
  categoryId: string;
  amountMinor: number;
  every: number;
  unit: "week" | "month";
  runsForMonths: number | null;
  /** Null lands in both cutoffs, which is what twice a month and weekly do. */
  cutoff: 1 | 2 | null;
  startMonth: string;
  payOnDay: number | null;
};

export type RecurringDraft = RecurringInput & { id: string };

type Props = {
  open: boolean;
  onClose: () => void;
  categories: CategoryChoice[];
  /** The cutoff we are in now, the sensible default to pay from. */
  cutoff: number;
  /** This month, where a new schedule counts from unless told otherwise. */
  startMonth: string;
  /** Present when correcting one that already exists. */
  initial?: RecurringDraft | null;
  onSubmit: (entry: RecurringInput) => void;
};

export function NewRecurringSheet({ open, onClose, initial, ...rest }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={initial ? "Edit" : "New recurring"}>
      {/* Keyed so switching between entries starts from that entry's values. */}
      <RecurringForm
        key={initial?.id ?? "new"}
        initial={initial}
        {...rest}
        onClose={onClose}
      />
    </Sheet>
  );
}

function RecurringForm({
  categories,
  cutoff,
  startMonth,
  initial,
  onSubmit,
  onClose,
}: Omit<Props, "open">) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? DEFAULT_EMOJI);
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [draft, setDraft] = useState(initial ? minorToDraft(initial.amountMinor) : "");
  const [cadence, setCadence] = useState<CadenceKey>(
    initial ? cadenceOf(initial).key : "monthly",
  );
  const [runsFor, setRunsFor] = useState(numberField(initial?.runsForMonths));
  const [payOn, setPayOn] = useState<1 | 2>(initial?.cutoff ?? (cutoff === 1 ? 1 : 2));
  const [from, setFrom] = useState(initial?.startMonth ?? startMonth);
  const [fixedDay, setFixedDay] = useState(numberField(initial?.payOnDay));

  const amountMinor = draftToMinor(draft);
  const ready = name.trim() && categoryId && amountMinor > 0 && from;
  // Weekly and twice a month land in both halves of the month's pay by their
  // nature, so there is no cutoff to pick and no single day it is taken on.
  const bothCutoffs = spansBothCutoffs(cadence);
  const schedule = cadenceByKey(cadence);

  return (
    <div className="flex flex-col gap-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Netflix"
        maxLength={40}
        aria-label="Name"
        className="min-h-11 rounded-2xl bg-ink-700 px-4 text-sm text-sky-100 placeholder:text-sky-400 focus:outline-none"
      />

      <EmojiPicker value={emoji} onChange={setEmoji} />

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
          {CADENCES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCadence(c.key)}
              className={`shrink-0 rounded-full px-3 py-2 text-sm ${
                c.key === cadence
                  ? "bg-sky-400 font-semibold text-ink-900"
                  : "bg-ink-700 text-sky-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs tracking-[0.15em] text-sky-300 uppercase">
          Counting from
        </p>
        <p className="mb-2 text-xs text-sky-400">
          The month the schedule starts. Set it back for something already
          part-paid, so a run length still ends when it really does.
          {cadence === "weekly" && " Weeks are counted from the 1st of it."}
        </p>
        <input
          type="month"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="Counting from"
          className="min-h-11 w-full rounded-2xl bg-ink-700 px-4 text-sm text-sky-100 focus:outline-none"
        />
      </div>

      <div>
        <p className="mb-1 text-xs tracking-[0.15em] text-sky-300 uppercase">Stop after</p>
        <p className="mb-2 text-xs text-sky-400">
          Months from the start. Leave it blank and it carries on indefinitely.
        </p>
        <input
          inputMode="numeric"
          value={runsFor}
          onChange={(e) => setRunsFor(digitsOnly(e.target.value, 3))}
          placeholder="e.g. 12"
          aria-label="Stop after how many months"
          className="min-h-11 w-full rounded-2xl bg-ink-700 px-4 text-sm text-sky-100 placeholder:text-sky-400 focus:outline-none"
        />
      </div>

      {bothCutoffs ? (
        <p className="text-xs text-sky-400">
          Comes out of both cutoffs, so there is no half of the month to pick.
        </p>
      ) : (
        <CutoffToggle value={payOn} onChange={setPayOn} />
      )}

      {!bothCutoffs && (
        <div>
          <p className="mb-1 text-xs tracking-[0.15em] text-sky-300 uppercase">
            On a fixed day
          </p>
          <p className="mb-2 text-xs text-sky-400">
            The day of the month it is taken, when it is always the same. Leave
            it blank if the date moves around.
          </p>
          <input
            inputMode="numeric"
            value={fixedDay}
            onChange={(e) => setFixedDay(digitsOnly(e.target.value, 2))}
            placeholder="e.g. 5"
            aria-label="Day of the month it is paid"
            className="min-h-11 w-full rounded-2xl bg-ink-700 px-4 text-sm text-sky-100 placeholder:text-sky-400 focus:outline-none"
          />
        </div>
      )}

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
            emoji,
            categoryId,
            amountMinor,
            every: schedule.every,
            unit: schedule.unit,
            runsForMonths: runsFor ? Number(runsFor) : null,
            cutoff: bothCutoffs ? null : payOn,
            startMonth: from,
            payOnDay: bothCutoffs || !fixedDay ? null : clampDay(Number(fixedDay)),
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

/** An optional number arrives as null; the field it fills is a string. */
function numberField(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function digitsOnly(value: string, max: number) {
  return value.replace(/[^0-9]/g, "").slice(0, max);
}

/** Guards against a typed 0 or 99 reaching a column that means a day. */
function clampDay(day: number) {
  return Math.min(31, Math.max(1, day));
}
