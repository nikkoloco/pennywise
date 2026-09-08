export type PendingExpense = {
  categoryId: string;
  amountMinor: number;
  note?: string;
  eventId: string | null;
  categoryName: string;
  categoryEmoji: string;
  queuedAt: number;
};

const KEY = "pennywise.outbox";

/**
 * A tap made with no signal is still a tap. Pending expenses live in
 * localStorage rather than IndexedDB: the queue holds a handful of small rows
 * for minutes at a time, and a synchronous read keeps the tap path instant.
 */
export function readOutbox(): PendingExpense[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function writeOutbox(items: PendingExpense[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("pennywise:outbox"));
}

export function queueExpense(item: PendingExpense) {
  writeOutbox([...readOutbox(), item]);
}
