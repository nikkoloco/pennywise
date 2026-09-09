import { TZDate } from "@date-fns/tz";
import { addDays, addMonths, endOfDay, format, startOfDay } from "date-fns";
import { TZ, monthKey, now } from "./time";

/**
 * Salary lands on the 10th and the 25th, so what matters is not the calendar
 * month but the stretch between paydays: 26 to 10, then 11 to 25. A period
 * opens the day after money arrives and closes on the day the next lot does.
 *
 * Every month has at least 28 days, so the 26th always exists and no period
 * ever needs a fallback start.
 */
export const PAYDAYS = [10, 25];

function dayIn(reference: Date, monthDelta: number, day: number) {
  const month = addMonths(reference, monthDelta);
  return new TZDate(month.getFullYear(), month.getMonth(), day, TZ);
}

function bounds(start: Date, end: Date) {
  return { start: startOfDay(start), end: endOfDay(end) };
}

/** The pay period containing `at`, ignoring any offset. */
function periodAround(at: Date) {
  const day = new TZDate(at, TZ).getDate();

  if (day <= 10) return bounds(dayIn(at, -1, 26), dayIn(at, 0, 10));
  if (day <= 25) return bounds(dayIn(at, 0, 11), dayIn(at, 0, 25));
  return bounds(dayIn(at, 0, 26), dayIn(at, 1, 10));
}

/**
 * The pay period containing `at`, stepped by `offset` periods. Stepping walks
 * one day past a boundary and re-resolves, rather than doing arithmetic on
 * periods of two different lengths.
 */
export function payPeriodRange(at: Date = now(), offset = 0) {
  let range = periodAround(at);

  for (let i = 0; i < Math.abs(offset); i++) {
    range = periodAround(
      offset < 0 ? addDays(range.start, -1) : addDays(range.end, 1),
    );
  }

  return range;
}

/** "26 Aug - 10 Sep", the two dates that bound the current pay packet. */
export function payPeriodLabel(range: { start: Date; end: Date }) {
  return `${format(range.start, "d MMM")} – ${format(range.end, "d MMM")}`;
}

/**
 * Which of the month's two pay periods a range is: 1 is the one ending on the
 * 10th, 2 the one ending on the 25th. Recurring payments are pinned to one or
 * the other, so this is how a schedule and a window are matched up.
 */
export function cutoffNumber(range: { end: Date }) {
  return new TZDate(range.end, TZ).getDate() === PAYDAYS[0] ? 1 : 2;
}

/**
 * The month a pay period belongs to, as "YYYY-MM". A period is named for the
 * month it ends in, so 26 December to 10 January is January's first cutoff.
 */
export function payPeriodMonth(range: { end: Date }) {
  return monthKey(range.end);
}

/** How a cutoff is described in the interface. */
export function cutoffLabel(cutoff: number) {
  return cutoff === 1 ? "1st cutoff (10th)" : "2nd cutoff (25th)";
}
