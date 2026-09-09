import { RecurringClient } from "@/components/recurring/RecurringClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCategories, getRecurring, getRecurringPaid } from "@/db/queries";
import {
  cutoffLabel,
  cutoffNumber,
  payPeriodLabel,
  payPeriodMonth,
  payPeriodRange,
} from "@/lib/payPeriod";
import { buildRecurringCards } from "@/lib/recurring";
import { currentUserId } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const userId = await currentUserId();
  const pay = payPeriodRange();

  const [entries, paid, categories] = await Promise.all([
    getRecurring(userId),
    getRecurringPaid(userId, pay),
    getCategories(userId),
  ]);

  const cutoff = cutoffNumber(pay);
  const cards = buildRecurringCards(entries, paid, payPeriodMonth(pay), cutoff);

  return (
    <main className="flex flex-1 flex-col gap-4 pb-6">
      <PageHeader
        title="Recurring"
        subtitle={`${cutoffLabel(cutoff)} · ${payPeriodLabel(pay)}`}
      />
      <RecurringClient
        cards={cards}
        cutoff={cutoff}
        startMonth={payPeriodMonth(pay)}
        categories={categories
          .filter((c) => c.parentId === null)
          .map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }))}
      />
    </main>
  );
}
