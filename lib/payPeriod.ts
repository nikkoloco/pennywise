import { TZDate } from "@date-fns/tz";
import {
  addDays,
  addMonths,
  endOfDay,
  format,
  getDaysInMonth,
  getISODay,
  startOfDay,
} from "date-fns";
import { TZ, monthKey, now } from "./time";

/**
 * A cutoff is the stretch between paydays, which is how money actually
 * arrives: a period opens the day after pay lands and closes on the day the
 * next lot does. How long that stretch is depends on the account.
 *
 * Paydays are days of the month for a monthly or twice-a-month cadence, in
 * ascending order, and a single ISO weekday (1 = Monday) for a weekly one. A
 * payday the month is too short for, the 30th in February, lands on the
 * month's last day instead.
 */
export type PayCadence = "monthly" | "twice_a_month" | "weekly";

export type PaySchedule = { cadence: PayCadence; paydays: number[] };

export const CADENCE_LABELS: Record<PayCadence, string> = {
  monthly: "Monthly",
  twice_a_month: "Twice a month",
  weekly: "Weekly",
};

export const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** How many cutoffs a month is treated as having: the ones something can be pinned to. */
export function cutoffCount(schedule: PaySchedule) {
  if (schedule.cadence === "weekly") return 4;
  return schedule.paydays.length;
}

/** The payday, clamped into a month that may be shorter than the day asked for. */
function dayIn(reference: Date, monthDelta: number, day: number) {
  const month = addMonths(reference, monthDelta);
  const clamped = Math.min(day, getDaysInMonth(month));
  return new TZDate(month.getFullYear(), month.getMonth(), clamped, TZ);
}

function bounds(start: Date, end: Date) {
  return { start: startOfDay(start), end: endOfDay(end) };
}

/** The pay period containing `at`, ignoring any offset. */
function periodAround(at: Date, schedule: PaySchedule) {
  const local = new TZDate(at, TZ);

  if (schedule.cadence === "weekly") {
    const until = (schedule.paydays[0] - getISODay(local) + 7) % 7;
    const end = addDays(local, until);
    return bounds(addDays(end, -6), end);
  }

  const { paydays } = schedule;
  const last = paydays[paydays.length - 1];
  const index = paydays.findIndex((payday) => local.getDate() <= payday);

  if (index === -1) return bounds(addDays(dayIn(local, 0, last), 1), dayIn(local, 1, paydays[0]));
  const previous = index === 0 ? dayIn(local, -1, last) : dayIn(local, 0, paydays[index - 1]);
  return bounds(addDays(previous, 1), dayIn(local, 0, paydays[index]));
}

/**
 * The pay period containing `at`, stepped by `offset` periods. Stepping walks
 * one day past a boundary and re-resolves, rather than doing arithmetic on
 * periods of two different lengths.
 */
export function payPeriodRange(schedule: PaySchedule, at: Date = now(), offset = 0) {
  let range = periodAround(at, schedule);

  for (let i = 0; i < Math.abs(offset); i++) {
    range = periodAround(
      offset < 0 ? addDays(range.start, -1) : addDays(range.end, 1),
      schedule,
    );
  }

  return range;
}

/** "26 Aug - 10 Sep", the two dates that bound the current pay packet. */
export function payPeriodLabel(range: { start: Date; end: Date }) {
  return `${format(range.start, "d MMM")} – ${format(range.end, "d MMM")}`;
}

/**
 * Which of the month's pay periods a range is, counted by the payday it ends
 * on: with pay on the 10th and 25th, 1 ends on the 10th and 2 on the 25th. A
 * weekly period is the nth of its weekday in the month. Recurring payments
 * are pinned to one of these, so this is how a schedule and a window are
 * matched up.
 */
export function cutoffNumber(range: { end: Date }, schedule: PaySchedule) {
  const day = new TZDate(range.end, TZ).getDate();
  if (schedule.cadence === "weekly") return Math.ceil(day / 7);
  return schedule.paydays.findIndex((payday) => day <= payday) + 1;
}

/**
 * The month a pay period belongs to, as "YYYY-MM". A period is named for the
 * month it ends in, so 26 December to 10 January is January's first cutoff.
 */
export function payPeriodMonth(range: { end: Date }) {
  return monthKey(range.end);
}

/**
 * The payday a month's cutoff closes on, at noon. Noon is far from either
 * edge of the day, so no daylight or offset wobble can push it into the
 * neighbouring period.
 */
function paydayOf(month: string, cutoff: number, schedule: PaySchedule) {
  const [y, m] = month.split("-").map(Number);
  const first = new TZDate(y, m - 1, 1, 12, 0, TZ);

  if (schedule.cadence === "weekly") {
    const until = (schedule.paydays[0] - getISODay(first) + 7) % 7;
    return addDays(first, until + 7 * (cutoff - 1));
  }
  return dayIn(first, 0, schedule.paydays[cutoff - 1]);
}

/**
 * The pay period a month's cutoff spans, named the way the app names periods:
 * cutoff 1 of March closes on 10 March and so opens on 26 February. Resolved
 * from its own payday, so the answer comes from the same code that decides
 * which period today is in.
 */
export function payPeriodOf(month: string, cutoff: number, schedule: PaySchedule) {
  return payPeriodRange(schedule, paydayOf(month, cutoff, schedule));
}

/** How many pay periods close inside a month: a weekly one has four or five. */
export function cutoffsIn(month: string, schedule: PaySchedule) {
  if (schedule.cadence !== "weekly") return schedule.paydays.length;

  const [y, m] = month.split("-").map(Number);
  const first = new TZDate(y, m - 1, 1, TZ);
  const until = (schedule.paydays[0] - getISODay(first) + 7) % 7;
  return Math.floor((getDaysInMonth(first) - 1 - until) / 7) + 1;
}

/** "1st", "2nd", "23rd". */
export function ordinal(n: number) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const suffix = ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
}

/** When the pay lands, as the interface says it: "10th", "Fri". */
export function paydayLabel(schedule: PaySchedule, cutoff: number) {
  if (schedule.cadence === "weekly") return WEEKDAY_NAMES[schedule.paydays[0] - 1];
  return ordinal(schedule.paydays[cutoff - 1]);
}

/** How a cutoff is described in the interface: "1st cutoff (10th)". */
export function cutoffLabel(cutoff: number, schedule: PaySchedule) {
  const when = paydayLabel(schedule, cutoff);
  if (cutoffCount(schedule) === 1) return `Cutoff (${when})`;
  return `${ordinal(cutoff)} cutoff (${when})`;
}

/**
 * The pay period a calendar day belongs to. Noon is used deliberately: it is
 * far from either edge of the day, so no daylight or offset wobble can push a
 * date into the neighbouring period.
 */
export function payPeriodOfDay(day: string, schedule: PaySchedule) {
  const [y, m, d] = day.split("-").map(Number);
  const range = payPeriodRange(schedule, new TZDate(y, m - 1, d, 12, 0, TZ));
  const cutoff = cutoffNumber(range, schedule);

  return {
    key: `${payPeriodMonth(range)}-${cutoff}`,
    label: payPeriodLabel(range),
    cutoff,
  };
}
