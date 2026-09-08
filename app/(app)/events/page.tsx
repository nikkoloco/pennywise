import { EventsClient } from "@/components/events/EventsClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEvents, getEventSpend } from "@/db/queries";
import { buildEventCards } from "@/lib/events";
import { dayKey } from "@/lib/time";
import { currentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const user = await currentUser();
  const [events, spend] = await Promise.all([
    getEvents(user.id),
    getEventSpend(user.id),
  ]);

  const cards = buildEventCards(events, spend, dayKey(new Date()), dayKey);

  return (
    <main className="flex flex-1 flex-col gap-4 pb-6">
      <PageHeader title="Planned" subtitle="Things to budget for" />
      <EventsClient events={cards} />
    </main>
  );
}
