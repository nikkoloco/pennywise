import type { PaySchedule } from "./payPeriod";
import { monthCount, type RecurringRow } from "./recurring";

/**
 * What a month is already committed to before you spend anything in it.
 *
 * Two kinds of money qualify, and both are known amounts: recurring payments
 * the schedule puts in that month, counted as many times as they land there,
 * and anticipated expenditure dated to it. Rough coming-up guesses are
 * deliberately not added in — their cost is not known, so a total containing
 * them would not be a total.
 */
export type PlannedRow = { occursOn: string; budgetMinor: number };

export function monthObligations(
  recurring: RecurringRow[],
  planned: PlannedRow[],
  month: string,
  schedule: PaySchedule,
) {
  const recurringMinor = recurring.reduce(
    (total, entry) => total + entry.amountMinor * monthCount(entry, month, schedule),
    0,
  );

  const plannedMinor = planned
    .filter((row) => row.occursOn === month)
    .reduce((total, row) => total + row.budgetMinor, 0);

  return {
    recurringMinor,
    plannedMinor,
    totalMinor: recurringMinor + plannedMinor,
  };
}
