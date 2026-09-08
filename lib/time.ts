import { TZDate } from "@date-fns/tz";
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth } from "date-fns";

export const TZ = "Asia/Manila";

/** "Now" as seen from Manila, which is the only clock this app cares about. */
export function now() {
  return new TZDate(new Date(), TZ);
}

/**
 * Day and month boundaries are computed in the user's timezone, never UTC, so a
 * midnight snack lands on the day you think it does.
 */
export function dayRange(at = now()) {
  return { start: startOfDay(at), end: endOfDay(at) };
}

export function monthRange(at = now()) {
  return { start: startOfMonth(at), end: endOfMonth(at) };
}

export function formatTime(d: Date) {
  return new TZDate(d, TZ).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatLongDate(d: Date) {
  return new TZDate(d, TZ).toLocaleDateString("en-PH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Calendar keys. Days are "YYYY-MM-DD" and months "YYYY-MM", both as seen from
 * Manila, so grid maths never has to think about timezones again.
 */
export function dayKey(d: Date) {
  return format(new TZDate(d, TZ), "yyyy-MM-dd");
}

export function monthKey(d: Date = now()) {
  return format(new TZDate(d, TZ), "yyyy-MM");
}

/** The UTC instants bounding a Manila month, for querying. */
export function monthRangeOf(key: string) {
  const [y, m] = key.split("-").map(Number);
  const start = new TZDate(y, m - 1, 1, TZ);
  return { start, end: endOfMonth(start) };
}

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The same slice of the previous month. A month still in progress must compare
 * against the equivalent stretch, not against a full month it cannot match yet.
 */
export function previousMonthRange(key: string, throughDay?: number) {
  const prev = shiftMonth(key, -1);
  const full = monthRangeOf(prev);
  if (!throughDay) return full;

  const [y, m] = prev.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const day = Math.min(throughDay, lastDay);
  return { start: full.start, end: endOfDay(new TZDate(y, m - 1, day, TZ)) };
}

export function dayLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-PH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}
