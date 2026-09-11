import { TZDate } from "@date-fns/tz";
import { addDays, addMonths, differenceInCalendarDays, startOfDay } from "date-fns";
import { type PaySchedule, cutoffCount, cutoffsIn, payPeriodOf } from "./payPeriod";
import { TZ, monthOf, monthRangeOf, monthsUntil } from "./time";

/**
 * When a recurring payment is due, and how many times.
 *
 * The schedule is an interval against a start month — `every` steps of `unit`
 * — plus how many months it keeps landing for. The run is counted in months
 * rather than in payments, so "every 3 months for a year" is four payments and
 * reads the way it is said out loud.
 *
 * `cutoff` pins a monthly-or-slower payment to one of the month's pay
 * periods. A null cutoff means it lands in every one, which is how twice a
 * month is stored and the only thing weekly can be: a week is no longer than
 * a pay period, so a weekly payment is owed at least once inside each of
 * them. That is why due is a count everywhere here and never a flag.
 *
 * Nothing in this file writes anything. Due means "this is owed now", never
 * "this has been paid", because only an expense you actually logged says that.
 */
export type RecurringRow = {
  id: string;
  name: string;
  emoji: string;
  categoryId: string;
  amountMinor: number;
  every: number;
  unit: "week" | "month";
  runsForMonths: number | null;
  /** Null lands in every cutoff. */
  cutoff: number | null;
  startMonth: string;
  /** The day of the month it is taken, when that is fixed. */
  payOnDay: number | null;
};

type Range = { start: Date; end: Date };

/** The three fields that say when a payment lands, without the rest of a row. */
type Schedule = Pick<RecurringRow, "every" | "unit" | "cutoff">;

/**
 * The rhythms the interface offers, each a complete answer to "how often".
 * Weekly and twice a month land in every cutoff by their nature, so they never
 * ask which one; the rest are pinned to the cutoff you choose. Twice a month
 * is only that when pay is: `offeredCadences` leaves it out otherwise.
 */
export const CADENCES = [
  { key: "weekly", label: "Weekly", phrase: "every week", every: 1, unit: "week" },
  {
    key: "twiceAMonth",
    label: "Twice a month",
    phrase: "twice a month",
    every: 1,
    unit: "month",
  },
  { key: "monthly", label: "Monthly", phrase: "every month", every: 1, unit: "month" },
  {
    key: "quarterly",
    label: "Quarterly",
    phrase: "every 3 months",
    every: 3,
    unit: "month",
  },
  {
    key: "twiceAYear",
    label: "Twice a year",
    phrase: "every 6 months",
    every: 6,
    unit: "month",
  },
  { key: "yearly", label: "Yearly", phrase: "every year", every: 12, unit: "month" },
] as const;

export type Cadence = (typeof CADENCES)[number];
export type CadenceKey = Cadence["key"];

/** Whether a cadence lands in every cutoff on its own, so no cutoff is chosen. */
export function landsEveryCutoff(key: CadenceKey) {
  return key === "weekly" || key === "twiceAMonth";
}

/** The rhythms worth offering under this pay schedule. */
export function offeredCadences(schedule: PaySchedule) {
  return CADENCES.filter((c) => c.key !== "twiceAMonth" || cutoffCount(schedule) === 2);
}

/** The rhythm a key names, falling back to the one most payments have. */
export function cadenceByKey(key: CadenceKey): Cadence {
  return CADENCES.find((c) => c.key === key) ?? CADENCES[2];
}

/** Which of the offered rhythms an entry is, so a form can select it again. */
export function cadenceOf(entry: Schedule): Cadence {
  const match = CADENCES.find(
    (c) =>
      c.unit === entry.unit &&
      c.every === entry.every &&
      landsEveryCutoff(c.key) === (entry.cutoff === null),
  );
  return match ?? cadenceByKey("monthly");
}

/** "every month", "twice a month", with the run length when there is one. */
export function scheduleLabel(entry: Schedule & Pick<RecurringRow, "runsForMonths">) {
  const { phrase } = cadenceOf(entry);
  return entry.runsForMonths === null
    ? phrase
    : `${phrase} for ${entry.runsForMonths} months`;
}

/** The first of the start month, which is what every interval counts from. */
function anchor(entry: Pick<RecurringRow, "startMonth">) {
  const [y, m] = entry.startMonth.split("-").map(Number);
  return startOfDay(new TZDate(y, m - 1, 1, TZ));
}

/** The last day the run covers, or null when it carries on indefinitely. */
function runEnd(entry: Pick<RecurringRow, "startMonth" | "runsForMonths">) {
  if (entry.runsForMonths === null) return null;
  return addDays(addMonths(anchor(entry), entry.runsForMonths), -1);
}

/**
 * How many weekly payments land inside a range. Every occurrence is the first
 * of the start month plus whole steps of weeks, so the count is arithmetic on
 * day numbers rather than a walk through the calendar, and averages out to the
 * 52 payments a year that a weekly bill actually costs.
 */
function weeklyCount(entry: RecurringRow, range: Range) {
  const from = anchor(entry);
  const stop = runEnd(entry);
  const last = stop !== null && stop < range.end ? stop : range.end;
  const step = 7 * entry.every;

  const first = Math.max(0, Math.ceil(differenceInCalendarDays(range.start, from) / step));
  const final = Math.floor(differenceInCalendarDays(last, from) / step);
  return Math.max(0, final - first + 1);
}

/** Whether a monthly-or-slower payment's interval and run reach this month. */
function landsInMonth(entry: RecurringRow, month: string) {
  const elapsed = monthsUntil(month, monthOf(entry.startMonth));
  if (elapsed < 0) return false;
  if (elapsed % entry.every !== 0) return false;
  return entry.runsForMonths === null || elapsed < entry.runsForMonths;
}

/**
 * How many payments this pay period owes. One for a monthly-or-slower payment
 * whose cutoff this is, as many as the weeks it spans for a weekly one, none
 * when the schedule has nothing to do with the period.
 */
export function dueCount(
  entry: RecurringRow,
  month: string,
  cutoff: number,
  schedule: PaySchedule,
) {
  if (entry.unit === "week") {
    return weeklyCount(entry, payPeriodOf(month, cutoff, schedule));
  }
  if (entry.cutoff !== null && entry.cutoff !== cutoff) return 0;
  return landsInMonth(entry, month) ? 1 : 0;
}

/**
 * How many payments the calendar month owes. A payment landing in every
 * cutoff counts once for each cutoff the month has.
 */
export function monthCount(entry: RecurringRow, month: string, schedule: PaySchedule) {
  if (entry.unit === "week") return weeklyCount(entry, monthRangeOf(month));
  if (!landsInMonth(entry, month)) return 0;
  return entry.cutoff === null ? cutoffsIn(month, schedule) : 1;
}

/**
 * The list as the screen shows it, in three tiers: what is owed this cutoff,
 * then what this cutoff has already settled, then everything not due yet.
 * Something paid today still concerns this cutoff, so it outranks a payment
 * that has nothing to do with it. Paid counts come from expenses actually
 * logged against the entry inside the current window, so a weekly payment
 * stays owed until every one of its occurrences has been tapped.
 */
export function buildRecurringCards(
  entries: RecurringRow[],
  paidCounts: Map<string, number>,
  month: string,
  cutoff: number,
  schedule: PaySchedule,
) {
  return entries
    .map((entry) => ({
      ...entry,
      dueCount: dueCount(entry, month, cutoff, schedule),
      paidCount: paidCounts.get(entry.id) ?? 0,
    }))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

function rank(card: { dueCount: number; paidCount: number }) {
  if (card.paidCount < card.dueCount) return 0;
  if (card.dueCount > 0) return 1;
  return 2;
}
