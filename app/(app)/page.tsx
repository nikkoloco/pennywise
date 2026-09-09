import { HomeClient } from "@/components/home/HomeClient";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getCategories,
  getEvents,
  getEventSpend,
  getExpensesIn,
  getQuickTaps,
  getTotalIn,
  getUpcoming,
} from "@/db/queries";
import { buildEventCards, plannedRemaining } from "@/lib/events";
import { payPeriodLabel, payPeriodRange } from "@/lib/payPeriod";
import { dayRange, formatLongDate, monthKey, monthRange, now } from "@/lib/time";
import { currentUserId } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await currentUserId();
  const day = dayRange();
  const month = monthRange();
  const pay = payPeriodRange();

  const [tiles, categories, today, monthTotal, payTotal, events, eventSpend, upcoming] =
    await Promise.all([
      getQuickTaps(userId),
      getCategories(userId),
      getExpensesIn(userId, day),
      getTotalIn(userId, month),
      getTotalIn(userId, pay),
      getEvents(userId),
      getEventSpend(userId),
      getUpcoming(userId),
    ]);

  // Tiles and the keypad offer top-level categories; subgroups hang off them
  // and are chosen only once a category has been picked.
  const groups = categories
    .filter((c) => c.parentId === null)
    .map((parent) => ({
      id: parent.id,
      name: parent.name,
      emoji: parent.emoji,
      children: categories
        .filter((c) => c.parentId === parent.id)
        .map((child) => ({ id: child.id, name: child.name })),
    }));

  // Everything still to come earns a place on Home, soonest first. They sit in
  // a row you swipe rather than a list, so a dozen plans cost one card of space.
  const cards = buildEventCards(events, eventSpend, monthKey(), monthKey);
  const plans = cards.filter((c) => c.monthsAway >= 0);

  // Money due this month is money this month costs, whether or not it has left yet.
  const planned = plannedRemaining(cards);

  return (
    <main className="flex flex-1 flex-col gap-6 pb-6">
      <PageHeader title="Today" subtitle={formatLongDate(now())} />
      <HomeClient
        tiles={tiles}
        categories={groups}
        events={cards.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }))}
        today={today}
        monthTotal={monthTotal}
        payTotal={payTotal}
        payLabel={payPeriodLabel(pay)}
        planned={planned}
        plans={plans.map((c) => ({
          id: c.id,
          emoji: c.emoji,
          name: c.name,
          monthsAway: c.monthsAway,
          cutoff: c.cutoff,
          occursOn: c.occursOn,
          budgetMinor: c.budgetMinor,
          spentMinor: c.spentMinor,
        }))}
        upcoming={upcoming.map((u) => ({ ...u, cutoff: u.cutoff === 2 ? 2 : 1 }) as const)}
      />
    </main>
  );
}
