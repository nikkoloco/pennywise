import { Amount } from "@/components/ui/Amount";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEvents } from "@/db/queries";
import { formatMinor } from "@/lib/money";
import { currentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const user = await currentUser();
  const events = await getEvents(user.id);

  return (
    <main className="flex flex-1 flex-col gap-4 pb-6">
      <PageHeader title="Planned" subtitle="Things to budget for" />

      <section className="flex flex-col gap-3 px-6">
        {events.length === 0 ? (
          <Card variant="event">
            <p className="text-xs tracking-[0.15em] text-gold-500 uppercase">
              Phase 6
            </p>
            <p className="mt-2 text-sm text-gold-300">
              Trips, birthdays and holidays land here, each with a planned budget
              and a countdown. Creating them arrives with this phase.
            </p>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} variant="event">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{event.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gold-300">{event.name}</p>
                  <p className="text-xs text-umber-300">{event.eventDate}</p>
                </div>
                <Amount minor={event.budgetMinor} size="sm" tone="gold" />
              </div>
              <p className="mt-3 text-xs text-umber-300">
                {formatMinor(event.budgetMinor)} planned
              </p>
            </Card>
          ))
        )}
      </section>
    </main>
  );
}
