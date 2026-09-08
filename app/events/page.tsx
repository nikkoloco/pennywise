import { Amount } from "@/components/ui/Amount";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMinor } from "@/lib/money";
import { SAMPLE_EVENTS } from "@/lib/sample";

export default function EventsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 pb-6">
      <PageHeader title="Planned" subtitle="Things to budget for" />

      <section className="flex flex-col gap-3 px-6">
        {SAMPLE_EVENTS.map((event) => {
          const pct = Math.min(100, (event.spentMinor / event.budgetMinor) * 100);
          return (
            <Card key={event.id} variant="event">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{event.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gold-300">{event.name}</p>
                  <p className="text-xs text-umber-300">in {event.daysAway} days</p>
                </div>
                <Amount minor={event.budgetMinor} size="sm" tone="gold" />
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-umber-500">
                <div
                  className="h-full rounded-full bg-gold-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-umber-300">
                {formatMinor(event.spentMinor)} spent &middot;{" "}
                {formatMinor(event.budgetMinor - event.spentMinor)} left
              </p>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
