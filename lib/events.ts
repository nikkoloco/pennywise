const DAY_MS = 86_400_000;

function toUTC(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Normalised so a 29 February anchor lands on a real date in common years. */
function makeKey(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

/**
 * When the event next falls. A one-off keeps its date forever, even once past.
 * An annual one rolls forward on its own, which is why nothing is ever written
 * back to the row: the next date is derived, not stored.
 */
export function nextOccurrence(
  eventDate: string,
  isRecurringAnnual: boolean,
  todayKey: string,
) {
  if (!isRecurringAnnual) return eventDate;

  const [, month, day] = eventDate.split("-").map(Number);
  const thisYear = Number(todayKey.slice(0, 4));
  const candidate = makeKey(thisYear, month, day);

  return toUTC(candidate) >= toUTC(todayKey)
    ? candidate
    : makeKey(thisYear + 1, month, day);
}

/**
 * The start of the current cycle. Spend on an annual event counts only since
 * its last occurrence, so this year's birthday is not judged against every
 * birthday you have ever logged.
 */
export function cycleStart(
  eventDate: string,
  isRecurringAnnual: boolean,
  todayKey: string,
) {
  if (!isRecurringAnnual) return null;

  const next = nextOccurrence(eventDate, true, todayKey);
  const [y, m, d] = next.split("-").map(Number);
  return makeKey(y - 1, m, d);
}

export function daysUntil(dateKey: string, todayKey: string) {
  return Math.round((toUTC(dateKey) - toUTC(todayKey)) / DAY_MS);
}

export function countdownLabel(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days > 0) return `in ${days} days`;
  if (days === -1) return "yesterday";
  return `${Math.abs(days)} days ago`;
}

/** Warm end of the ramp only: events are planned money, never spent money. */
export const EVENT_COLORS = ["swatch-12", "swatch-9", "gold-400", "swatch-8"];

type EventRow = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  eventDate: string;
  budgetMinor: number;
  isRecurringAnnual: boolean;
};

type SpendRow = { eventId: string | null; amountMinor: number; spentAt: Date };

/**
 * Turns rows into display cards, resolving each event's next occurrence and the
 * spend inside its current cycle. Shared so the Events screen and the Home
 * banner can never disagree about a countdown.
 */
export function buildEventCards(
  events: EventRow[],
  spend: SpendRow[],
  todayKey: string,
  dayKeyOf: (d: Date) => string,
) {
  return events
    .map((event) => {
      const occursOn = nextOccurrence(
        event.eventDate,
        event.isRecurringAnnual,
        todayKey,
      );
      const since = cycleStart(event.eventDate, event.isRecurringAnnual, todayKey);

      const spentMinor = spend
        .filter(
          (s) => s.eventId === event.id && (!since || dayKeyOf(s.spentAt) >= since),
        )
        .reduce((n, s) => n + s.amountMinor, 0);

      return {
        id: event.id,
        name: event.name,
        emoji: event.emoji,
        color: event.color,
        occursOn,
        daysAway: daysUntil(occursOn, todayKey),
        budgetMinor: event.budgetMinor,
        spentMinor,
        isRecurringAnnual: event.isRecurringAnnual,
      };
    })
    .sort((a, b) => a.daysAway - b.daysAway);
}
