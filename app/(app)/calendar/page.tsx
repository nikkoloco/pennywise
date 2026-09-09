import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { getExpensesIn, getTotalIn } from "@/db/queries";
import {
  dayKey,
  monthKey,
  monthRangeOf,
  previousMonthRange,
} from "@/lib/time";
import { currentUserId } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const { m } = await searchParams;
  const key = typeof m === "string" && /^\d{4}-\d{2}$/.test(m) ? m : monthKey();

  // A month in progress is only compared against the same stretch of the last one.
  const todayKey = dayKey(new Date());
  const partialThrough = key === monthKey() ? Number(todayKey.slice(8)) : undefined;

  const userId = await currentUserId();
  const [entries, prevMonthTotal] = await Promise.all([
    getExpensesIn(userId, monthRangeOf(key)),
    getTotalIn(userId, previousMonthRange(key, partialThrough)),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-5 pb-6">
      <PageHeader title="Calendar" />
      <CalendarGrid
        monthKey={key}
        todayKey={todayKey}
        monthTotal={entries.reduce((n, e) => n + e.amountMinor, 0)}
        prevMonthTotal={prevMonthTotal}
        partial={partialThrough !== undefined}
        entries={entries.map((e) => ({
          id: e.id,
          day: dayKey(e.spentAt),
          amountMinor: e.amountMinor,
          note: e.note,
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
