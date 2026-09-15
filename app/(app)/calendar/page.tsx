import { subDays } from "date-fns";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { MonthObligations } from "@/components/calendar/MonthObligations";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getCategories,
  getEvents,
  getEventSpend,
  getExpensesIn,
  getPaySchedule,
  getRecurring,
  getTotalIn,
  getUpcoming,
} from "@/db/queries";
import { categoryGroups } from "@/lib/categories";
import { buildEventCards } from "@/lib/events";
import { monthObligations } from "@/lib/obligations";
import {
  dayKey,
  monthKey,
  monthRangeOf,
  now,
  previousMonthRange,
} from "@/lib/time";
import { currentUserId } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const { m } = await searchParams;
  const key = typeof m === "string" && /^\d{4}-\d{2}$/.test(m) ? m : monthKey();

  // A month in progress is only compared against the same stretch of the last one.
  const todayKey = dayKey(new Date());
  // Recent enough to still remember, so a slip can be corrected in place.
  const editableFrom = dayKey(subDays(now(), 30));
  const partialThrough = key === monthKey() ? Number(todayKey.slice(8)) : undefined;

  const userId = await currentUserId();
  const [
    entries,
    prevMonthTotal,
    recurring,
    categories,
    events,
    eventSpend,
    upcoming,
    schedule,
  ] = await Promise.all([
    getExpensesIn(userId, monthRangeOf(key)),
    getTotalIn(userId, previousMonthRange(key, partialThrough)),
    getRecurring(userId),
    getCategories(userId),
    getEvents(userId),
    getEventSpend(userId),
    getUpcoming(userId),
    getPaySchedule(userId),
  ]);

  // What the month is committed to regardless of what has been spent in it.
  // Only worth showing from this month on: for a month already gone, the
  // spending below is the answer and a forecast would just argue with it.
  const planned = buildEventCards(events, eventSpend, monthKey(), monthKey);
  const owed = monthObligations(recurring, planned, key, schedule);
  const guesses = upcoming.reduce((total, item) => total + item.approxMinor, 0);

  return (
    <main className="flex flex-1 flex-col gap-5 pb-6">
      <PageHeader title="Calendar" />

      {key >= monthKey() && (
        <MonthObligations
          monthKey={key}
          recurringMinor={owed.recurringMinor}
          plannedMinor={owed.plannedMinor}
          totalMinor={owed.totalMinor}
          guessesMinor={guesses}
        />
      )}
      <CalendarGrid
        monthKey={key}
        todayKey={todayKey}
        editableFrom={editableFrom}
        categories={categoryGroups(categories)}
        events={planned.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }))}
        monthTotal={entries.reduce((n, e) => n + e.amountMinor, 0)}
        prevMonthTotal={prevMonthTotal}
        partial={partialThrough !== undefined}
        entries={entries.map((e) => ({
          id: e.id,
          day: dayKey(e.spentAt),
          amountMinor: e.amountMinor,
          note: e.note,
          categoryId: e.categoryId,
          eventId: e.eventId,
          time: e.spentAt.toLocaleTimeString("en-PH", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: "Asia/Manila",
          }),
          categoryName: e.categoryName,
          categoryEmoji: e.categoryEmoji,
        }))}
      />
    </main>
  );
}
