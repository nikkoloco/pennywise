import { EventsClient } from "@/components/events/EventsClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEvents, getEventSpend } from "@/db/queries";
import { buildEventCards } from "@/lib/events";
import { monthKey } from "@/lib/time";
import { currentUserId } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const userId = await currentUserId();
  const [events, spend] = await Promise.all([
    getEvents(userId),
    getEventSpend(userId),
  ]);

  const cards = buildEventCards(events, spend, monthKey(), monthKey);

  return (
    <main className="flex flex-1 flex-col gap-4 pb-6">
      <PageHeader title="Future" subtitle="Anticipated expenditure" />
      <EventsClient events={cards} />
    </main>
  );
}
