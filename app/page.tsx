import { QuickTapGrid } from "@/components/home/QuickTapGrid";
import { Amount } from "@/components/ui/Amount";
import { Card, SectionLabel } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMinor } from "@/lib/money";
import { SAMPLE_EVENTS, SAMPLE_TODAY, SAMPLE_TODAY_TOTAL } from "@/lib/sample";

const MONTH_SPENT = 1847500;
const MONTH_LAST_PERIOD = 2210000;

export default function Home() {
  const soonest = SAMPLE_EVENTS.reduce((a, b) => (a.daysAway < b.daysAway ? a : b));
  const monthPct = Math.min(100, (MONTH_SPENT / MONTH_LAST_PERIOD) * 100);

  return (
    <main className="flex flex-1 flex-col gap-6 pb-6">
      <PageHeader title="Today" subtitle="Monday, 8 September" />

      <section className="relative px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -left-4 h-40 w-64 opacity-25 blur-3xl"
          style={{
            background: "radial-gradient(closest-side, var(--color-sky-400), transparent)",
          }}
        />
        <div className="relative">
          <Amount minor={SAMPLE_TODAY_TOTAL} size="hero" />
          <p className="mt-1 text-sm text-sky-200">
            {SAMPLE_TODAY.length} entries today
          </p>
        </div>

        <div className="relative mt-5">
          <div className="flex items-baseline justify-between">
            <SectionLabel>This month</SectionLabel>
            <span className="text-sm font-bold text-sky-100">
              {formatMinor(MONTH_SPENT)}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
            <div
              className="h-full rounded-full bg-gold-500"
              style={{ width: `${monthPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-sky-300">
            {Math.round(100 - monthPct)}% under last month at this point
          </p>
        </div>
      </section>

      <section className="px-6">
        <QuickTapGrid />
      </section>

      <section className="px-6">
        <Card variant="event" className="flex items-center gap-4">
          <span className="text-2xl">{soonest.emoji}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gold-300">{soonest.name}</p>
            <p className="text-xs text-umber-300">
              in {soonest.daysAway} days &middot; {formatMinor(soonest.budgetMinor)} planned
            </p>
          </div>
        </Card>
      </section>

      <section className="px-6">
        <SectionLabel>Today</SectionLabel>
        <ul className="mt-3 divide-y divide-ink-700">
          {SAMPLE_TODAY.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 py-3">
              <span className="text-lg">{entry.emoji}</span>
              <div className="flex-1">
                <p className="text-sm text-sky-100">{entry.label}</p>
                <p className="text-xs text-sky-300">
                  {entry.note ? `${entry.note} · ` : ""}
                  {entry.time}
                </p>
              </div>
              <Amount minor={entry.minor} size="sm" tone="paper" />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
