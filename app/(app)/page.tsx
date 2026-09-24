import { HomeClient } from "@/components/home/HomeClient";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getCategories,
  getEvents,
  getEventSpend,
  getExpensesIn,
  getOwed,
  getPaidOutIn,
  getPaySchedule,
  getQuickTaps,
  getUpcoming,
} from "@/db/queries";
import { categoryGroups } from "@/lib/categories";
import { buildEventCards, plannedRemaining } from "@/lib/events";
import {
  cutoffsIn,
  payPeriodLabel,
  payPeriodMonth,
  payPeriodOf,
  payPeriodRange,
} from "@/lib/payPeriod";
import { dayKey, dayRange, formatLongDate, monthKey, monthRange, now } from "@/lib/time";
import { currentUserId } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await currentUserId();
  const day = dayRange();
  const month = monthRange();
  const schedule = await getPaySchedule(userId);
  const pay = payPeriodRange(schedule);

  // Every cutoff of the month the current pay packet belongs to, so the one
  // being spent from is always among them, even when it runs past month end.
  const payMonth = payPeriodMonth(pay);
  const cutoffs = Array.from({ length: cutoffsIn(payMonth, schedule) }, (_, i) => {
    const cutoff = i + 1;
    const range = payPeriodOf(payMonth, cutoff, schedule);
    return { cutoff, range, current: range.start.getTime() === pay.start.getTime() };
  });

  // Totals count money that has left, so a purchase still owed on a card or
  // to a friend lands in the cutoff it is paid back in, not the one it was bought in.
  const [tiles, categories, today, monthTotal, cutoffTotals, events, eventSpend, upcoming, owed] =
    await Promise.all([
      getQuickTaps(userId),
      getCategories(userId),
      getExpensesIn(userId, day),
      getPaidOutIn(userId, month),
      Promise.all(cutoffs.map((c) => getPaidOutIn(userId, c.range))),
      getEvents(userId),
      getEventSpend(userId),
      getUpcoming(userId),
      getOwed(userId),
    ]);

  // Only what is due this month, in cutoff order. Home is the screen you open
  // to decide about today, and a plan three months out cannot inform that; it
  // has a tab of its own. They still sit in a row you swipe, so several of them
  // cost one card of space.
  const cards = buildEventCards(events, eventSpend, monthKey(), monthKey);
  const plans = cards.filter((c) => c.monthsAway === 0);

  // Money due this month is money this month costs, whether or not it has left yet.
  const planned = plannedRemaining(cards);

  return (
    <main className="flex flex-1 flex-col gap-6 pb-6">
      <PageHeader title="Today" subtitle={formatLongDate(now())} />
      <HomeClient
        tiles={tiles}
        categories={categoryGroups(categories)}
        events={cards.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }))}
        today={today.map((e) => ({
          ...e,
          owed: e.owedTo && !e.settledAt ? { owedTo: e.owedTo, dueOn: e.dueOn } : null,
        }))}
        owed={owed}
        todayKey={dayKey(now())}
        monthTotal={monthTotal}
        cutoffs={cutoffs.map((c, i) => ({
          cutoff: c.cutoff,
          label: payPeriodLabel(c.range),
          total: cutoffTotals[i],
          current: c.current,
        }))}
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
        upcoming={upcoming}
      />
    </main>
  );
}
