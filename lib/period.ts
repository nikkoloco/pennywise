import { TZDate } from "@date-fns/tz";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  endOfDay,
  format,
  min,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { type PaySchedule, payPeriodLabel, payPeriodRange } from "./payPeriod";
import { TZ, now } from "./time";

/** "cutoff" is the stretch between paydays, which is how the money actually arrives. */
export type Period = "cutoff" | "week" | "month" | "year";

export const PERIODS: Period[] = ["cutoff", "week", "month", "year"];

/** Week starts Monday, per the user's setting. */
const WEEK = { weekStartsOn: 1 } as const;

/** `offset` counts back from the current period: 0 is now, -1 the one before. */
export function periodRange(period: Period, offset: number, schedule: PaySchedule) {
  const base = now();
  if (period === "cutoff") return payPeriodRange(schedule, base, offset);
  if (period === "week") {
    const d = addWeeks(base, offset);
    return { start: startOfWeek(d, WEEK), end: endOfWeek(d, WEEK) };
  }
  if (period === "month") {
    const d = addMonths(base, offset);
    return { start: startOfMonth(d), end: endOfMonth(d) };
  }
  const d = addYears(base, offset);
  return { start: startOfYear(d), end: endOfYear(d) };
}

export function periodLabel(period: Period, offset: number, schedule: PaySchedule) {
  const range = periodRange(period, offset, schedule);
  const { start, end } = range;
  if (period === "cutoff") return payPeriodLabel(range);
  if (period === "week") return `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
  if (period === "month") return format(start, "MMMM yyyy");
  return format(start, "yyyy");
}

/**
 * The x-axis of the bar chart: days across a week, weeks across a month, months
 * across a year.
 */
export function bucketsFor(period: Period, offset: number, schedule: PaySchedule) {
  const { start, end } = periodRange(period, offset, schedule);

  if (period === "week") {
    return eachDayOfInterval({ start, end }).map((d) => ({
      key: format(d, "yyyy-MM-dd"),
      label: format(d, "EEEEE"),
    }));
  }

  // A cutoff runs about a fortnight, so days still fit as bars, numbered
  // rather than named because it spans two different weekday cycles.
  if (period === "cutoff") {
    return eachDayOfInterval({ start, end }).map((d) => ({
      key: format(d, "yyyy-MM-dd"),
      label: format(d, "d"),
    }));
  }

  if (period === "month") {
    return eachWeekOfInterval({ start, end }, WEEK).map((d) => ({
      key: format(d, "yyyy-MM-dd"),
      label: format(d, "d MMM"),
    }));
  }

  return eachMonthOfInterval({ start, end }).map((d) => ({
    key: format(d, "yyyy-MM"),
    label: format(d, "MMM"),
  }));
}

/** Which bucket a given day falls into, matched to `bucketsFor` keys. */
export function bucketKeyOf(day: string, period: Period) {
  if (period === "week" || period === "cutoff") return day;
  if (period === "year") return day.slice(0, 7);

  const [y, m, d] = day.split("-").map(Number);
  const weekStart = startOfWeek(new TZDate(y, m - 1, d, TZ), WEEK);
  return format(weekStart, "yyyy-MM-dd");
}

/**
 * The comparable slice of the previous period. A period still in progress must
 * be measured against the same number of elapsed days, not a full one.
 */
export function previousRange(
  period: Period,
  offset: number,
  schedule: PaySchedule,
  elapsedDays?: number,
) {
  const full = periodRange(period, offset - 1, schedule);
  if (elapsedDays === undefined) return full;

  const capped = endOfDay(addDays(full.start, elapsedDays - 1));
  return { start: full.start, end: min([capped, full.end]) };
}
