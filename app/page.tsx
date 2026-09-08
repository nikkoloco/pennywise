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
import { buildEventCards } from "@/lib/events";
import { dayKey, dayRange, formatLongDate, monthRange, now } from "@/lib/time";
import { currentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await currentUser();
  const day = dayRange();
  const month = monthRange();

  const [tiles, categories, today, monthTotal, events, eventSpend] =
    await Promise.all([
      getQuickTaps(user.id),
      getCategories(user.id),
      getExpensesIn(user.id, day),
      getTotalIn(user.id, month),
      getEvents(user.id),
      getEventSpend(user.id),
    ]);

  // Only a plan close enough to change today's decisions earns space on Home.
  const cards = buildEventCards(events, eventSpend, dayKey(new Date()), dayKey);
  const banner = cards.find((c) => c.daysAway >= 0 && c.daysAway <= 14) ?? null;

  return (
    <main className="flex flex-1 flex-col gap-6 pb-6">
      <PageHeader title="Today" subtitle={formatLongDate(now())} />
      <HomeClient
        tiles={tiles}
        categories={categories.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }))}
        events={cards.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }))}
        today={today}
        monthTotal={monthTotal}
        banner={banner}
      />
    </main>
  );
}
