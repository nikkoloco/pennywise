/**
 * Plans are scheduled by month, not by day: what matters is which month you
 * have to pay for something, not the square it lands on in a calendar.
 *
 * Month keys are "YYYY-MM". Fixed width means plain string comparison orders
 * them correctly, so none of this needs date arithmetic. The database column
 * stores the first of the month, and `monthOf` is the one place that bridges
 * the two forms.
 */

/** "2026-03-01" from the database becomes the "2026-03" used everywhere here. */
export function monthOf(stored: string) {
  return stored.slice(0, 7);
}

/** The first of the month, which is how a month key is stored. */
export function firstOfMonth(monthKey: string) {
  return `${monthKey}-01`;
}

function pad(month: number) {
  return String(month).padStart(2, "0");
}

/** Whole months between two keys, negative once the month has passed. */
export function monthsUntil(monthKey: string, todayKey: string) {
  const [ay, am] = monthKey.split("-").map(Number);
  const [by, bm] = todayKey.split("-").map(Number);
  return (ay - by) * 12 + (am - bm);
}

/**
 * Which month the plan next falls in. A one-off keeps its month forever, even
 * once past. An annual one rolls forward on its own, which is why nothing is
 * ever written back to the row: the next month is derived, not stored.
 */
export function nextOccurrence(
  eventMonth: string,
  isRecurringAnnual: boolean,
  todayKey: string,
) {
  if (!isRecurringAnnual) return eventMonth;

  const month = Number(eventMonth.slice(5, 7));
  const thisYear = Number(todayKey.slice(0, 4));
  const candidate = `${thisYear}-${pad(month)}`;

  return candidate >= todayKey ? candidate : `${thisYear + 1}-${pad(month)}`;
}

/**
 * The start of the current cycle. Spend on an annual plan counts only since its
 * last occurrence, so this year's Christmas is not judged against every
 * Christmas you have ever logged.
 */
export function cycleStart(
  eventMonth: string,
  isRecurringAnnual: boolean,
  todayKey: string,
) {
  if (!isRecurringAnnual) return null;

  const next = nextOccurrence(eventMonth, true, todayKey);
  return `${Number(next.slice(0, 4)) - 1}-${next.slice(5, 7)}`;
}

export function countdownLabel(months: number) {
  if (months === 0) return "this month";
  if (months === 1) return "next month";
  if (months > 1) return `in ${months} months`;
  if (months === -1) return "last month";
  return `${Math.abs(months)} months ago`;
}

/** Warm end of the ramp only: plans are planned money, never spent money. */
export const EVENT_COLORS = ["swatch-12", "swatch-9", "gold-400", "swatch-8"];

type EventRow = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  eventMonth: string;
  budgetMinor: number;
  isRecurringAnnual: boolean;
};

type SpendRow = { eventId: string | null; amountMinor: number; spentAt: Date };

/**
 * Turns rows into display cards, resolving each plan's next occurrence and the
 * spend inside its current cycle. Shared so the Planned screen and the Home
 * banner can never disagree about a countdown.
 */
export function buildEventCards(
  events: EventRow[],
  spend: SpendRow[],
  todayKey: string,
  monthKeyOf: (d: Date) => string,
) {
  return events
    .map((event) => {
      const month = monthOf(event.eventMonth);
      const occursOn = nextOccurrence(month, event.isRecurringAnnual, todayKey);
      const since = cycleStart(month, event.isRecurringAnnual, todayKey);

      const spentMinor = spend
        .filter(
          (s) => s.eventId === event.id && (!since || monthKeyOf(s.spentAt) >= since),
        )
        .reduce((n, s) => n + s.amountMinor, 0);

      return {
        id: event.id,
        name: event.name,
        emoji: event.emoji,
        color: event.color,
        occursOn,
        monthsAway: monthsUntil(occursOn, todayKey),
        budgetMinor: event.budgetMinor,
        spentMinor,
        isRecurringAnnual: event.isRecurringAnnual,
      };
    })
    .sort((a, b) => a.monthsAway - b.monthsAway);
}
