"use client";

import type { Entry } from "@/components/home/HomeClient";
import { Amount } from "@/components/ui/Amount";
import { SectionLabel } from "@/components/ui/Card";
import { formatTime } from "@/lib/time";

type Props = {
  entries: Entry[];
  onDelete: (id: string) => void;
  onEdit: (entry: Entry) => void;
};

export function TodayList({ entries, onDelete, onEdit }: Props) {
  return (
    <>
      <SectionLabel>Today</SectionLabel>
      <ul className="mt-3 divide-y divide-ink-700">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center gap-3 py-3">
            {/* The row opens the entry for correction; the cross still deletes.
                An entry not yet written has no id to edit, so it waits. */}
            <button
              type="button"
              onClick={() => onEdit(entry)}
              disabled={entry.id.startsWith("pending-")}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="text-lg">{entry.categoryEmoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-sky-100">{entry.categoryName}</p>
                <p className="truncate text-xs text-sky-300">
                  {entry.note ? `${entry.note} · ` : ""}
                  {formatTime(entry.spentAt)}
                </p>
              </div>
              <Amount minor={entry.amountMinor} size="sm" tone="paper" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              aria-label={`Delete ${entry.categoryName}`}
              className="flex size-11 shrink-0 items-center justify-center text-sky-400"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
