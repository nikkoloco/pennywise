import { TZDate } from "@date-fns/tz";
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns";

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
