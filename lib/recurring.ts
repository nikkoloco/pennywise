import { monthOf, monthsUntil } from "./time";

/**
 * When a recurring payment is due.
 *
 * The schedule is two numbers against a start month: how often it lands, and
 * how many months it keeps landing for. Both are counted in months rather than
 * in payments, so "every 3 months for a year" is four payments and reads the
 * way it is said out loud.
 *
 * Nothing here writes anything. Due means "this is owed now", never "this has
 * been paid", because only an expense you actually logged can say that.
 */
export type RecurringRow = {
  id: string;
  name: string;
  emoji: string;
  categoryId: string;
  amountMinor: number;
  everyMonths: number;
  runsForMonths: number | null;
  cutoff: number;
  startMonth: string;
};

/** Whether the payment lands in this month at all, frequency and run considered. */
export function fallsIn(entry: RecurringRow, month: string) {
  const elapsed = monthsUntil(month, monthOf(entry.startMonth));
  if (elapsed < 0) return false;
  if (elapsed % entry.everyMonths !== 0) return false;
  return entry.runsForMonths === null || elapsed < entry.runsForMonths;
}

/** Whether it is owed in this specific pay period. */
export function isDue(entry: RecurringRow, month: string, cutoff: number) {
  return entry.cutoff === cutoff && fallsIn(entry, month);
}

/** "every month", "every 3 months", with the run length when there is one. */
export function scheduleLabel(entry: Pick<RecurringRow, "everyMonths" | "runsForMonths">) {
  const every =
    entry.everyMonths === 1 ? "every month" : `every ${entry.everyMonths} months`;
  return entry.runsForMonths === null
    ? every
    : `${every} for ${entry.runsForMonths} months`;
}

/**
 * The list as the screen shows it, in three tiers: what is owed this cutoff,
 * then what this cutoff has already settled, then everything not due yet.
 * Something paid today still concerns this cutoff, so it outranks a payment
 * that has nothing to do with it. Paid comes from expenses actually logged
 * against the entry inside the current window.
 */
export function buildRecurringCards(
  entries: RecurringRow[],
  paidIds: Set<string>,
  month: string,
  cutoff: number,
) {
  return entries
    .map((entry) => ({
      ...entry,
      due: isDue(entry, month, cutoff),
      paid: paidIds.has(entry.id),
    }))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

function rank(card: { due: boolean; paid: boolean }) {
  if (card.due && !card.paid) return 0;
  if (card.due) return 1;
  return 2;
}
