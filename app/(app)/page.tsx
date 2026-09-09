import { HomeClient } from "@/components/home/HomeClient";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getCategories,
  getEvents,
  getEventSpend,
  getExpensesIn,
  getQuickTaps,
  getTotalIn,
} from "@/db/queries";
import { buildEventCards, plannedRemaining } from "@/lib/events";
import { dayRange, formatLongDate, monthKey, monthRange, now } from "@/lib/time";
import { currentUserId } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await currentUserId();
  const day = dayRange();
  const month = monthRange();

  const [tiles, categories, today, monthTotal, events, eventSpend] =
    await Promise.all([
      getQuickTaps(userId),
      getCategories(userId),
      getExpensesIn(userId, day),
      getTotalIn(userId, month),
      getEvents(userId),
      getEventSpend(userId),
    ]);

  // Only a plan close enough to change today's decisions earns space on Home:
  // one due this month or next, never one still a season away.
  const cards = buildEventCards(events, eventSpend, monthKey(), monthKey);
  const banner = cards.find((c) => c.monthsAway >= 0 && c.monthsAway <= 1) ?? null;

  // Money due this month is money this month costs, whether or not it has left yet.
  const planned = plannedRemaining(cards);

  return (
    <main className="flex flex-1 flex-col gap-6 pb-6">
      <PageHeader title="Today" subtitle={formatLongDate(now())} />
      <HomeClient
        tiles={tiles}
        categories={categories.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }))}
        events={cards.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }))}
        today={today}
        monthTotal={monthTotal}
        planned={planned}
        banner={banner}
      />
    </main>
  );
}
