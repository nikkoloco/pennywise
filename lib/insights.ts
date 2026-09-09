import { bucketKeyOf, bucketsFor, type Period } from "./period";

export type InsightEntry = {
  id: string;
  day: string;
  weekday: number;
  amountMinor: number;
  note: string | null;
  time: string;
  categoryName: string;
  categoryEmoji: string;
  categoryColor: string;
  /** The top-level group this rolls up to, which is what charts divide by. */
  groupName: string;
  groupEmoji: string;
  groupColor: string;
};

const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function byCategory(entries: InsightEntry[]) {
  const map = new Map<
    string,
    { name: string; emoji: string; color: string; total: number; count: number }
  >();

  // Grouped, not itemised: a donut split by subgroup would show several
  // slices in one colour, since a subgroup inherits its parent's swatch.
  for (const e of entries) {
    const row = map.get(e.groupName) ?? {
      name: e.groupName,
      emoji: e.groupEmoji,
      color: e.groupColor,
      total: 0,
      count: 0,
    };
    row.total += e.amountMinor;
    row.count += 1;
    map.set(e.groupName, row);
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function bucketTotals(entries: InsightEntry[], period: Period, offset: number) {
  const totals = new Map<string, number>();
  for (const e of entries) {
    const key = bucketKeyOf(e.day, period);
    totals.set(key, (totals.get(key) ?? 0) + e.amountMinor);
  }
  return bucketsFor(period, offset).map((b) => ({
    label: b.label,
    total: totals.get(b.key) ?? 0,
  }));
}

/**
 * The habits strip. `days` is every day of the period up to today, so averages
 * and streaks are not diluted by a future that has not happened yet.
 */
export function habits(entries: InsightEntry[], days: string[]) {
  const total = entries.reduce((n, e) => n + e.amountMinor, 0);
  const categories = byCategory(entries);
  const spentOn = new Set(entries.map((e) => e.day));

  // Days before the first entry are days you were not using the app, not days
  // you chose not to spend. Counting them would inflate streaks and flatter
  // averages, so the window starts at the first day with activity.
  const firstActive = [...spentOn].sort()[0];
  const counted = firstActive ? days.filter((d) => d >= firstActive) : [];

  let longestQuiet = 0;
  let run = 0;
  for (const day of counted) {
    run = spentOn.has(day) ? 0 : run + 1;
    longestQuiet = Math.max(longestQuiet, run);
  }

  const weekdayTotals = new Array(7).fill(0);
  for (const e of entries) weekdayTotals[e.weekday] += e.amountMinor;
  const busiest = weekdayTotals.indexOf(Math.max(...weekdayTotals));

  const mostFrequent = [...categories].sort((a, b) => b.count - a.count)[0];

  return {
    total,
    biggest: categories[0] ?? null,
    mostFrequent: mostFrequent ?? null,
    busiestWeekday: total > 0 ? WEEKDAY_NAMES[busiest] : null,
    averagePerDay: counted.length > 0 ? Math.round(total / counted.length) : 0,
    longestQuiet,
    daysCounted: counted.length,
  };
}
