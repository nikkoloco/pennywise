import { TZDate } from "@date-fns/tz";
import { addMonths, endOfDay, format, startOfDay } from "date-fns";
import { TZ, now } from "./time";

/**
 * Salary lands on the 10th and the 26th, so what matters is not the calendar
 * month but the stretch between paydays: 27 to 10, then 11 to 26. A period
 * opens the day after money arrives and closes on the day the next lot does.
 *
 * Every month has at least 28 days, so the 27th always exists and no period
 * ever needs a fallback start.
 */
export const PAYDAYS = [10, 26];

function dayIn(reference: Date, monthDelta: number, day: number) {
  const month = addMonths(reference, monthDelta);
  return new TZDate(month.getFullYear(), month.getMonth(), day, TZ);
}

/** The pay period containing `at`. */
export function payPeriodRange(at: Date = now()) {
  const day = new TZDate(at, TZ).getDate();

  if (day <= 10) return bounds(dayIn(at, -1, 27), dayIn(at, 0, 10));
  if (day <= 26) return bounds(dayIn(at, 0, 11), dayIn(at, 0, 26));
  return bounds(dayIn(at, 0, 27), dayIn(at, 1, 10));
}

function bounds(start: Date, end: Date) {
  return { start: startOfDay(start), end: endOfDay(end) };
}

/** "27 Aug - 10 Sep", the two dates that bound the current pay packet. */
export function payPeriodLabel(range: { start: Date; end: Date }) {
  return `${format(range.start, "d MMM")} – ${format(range.end, "d MMM")}`;
}
