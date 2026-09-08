import { eachDayOfInterval, format, getISODay, min } from "date-fns";
import Link from "next/link";
import { HabitsStrip } from "@/components/insights/HabitsStrip";
import { InsightsClient } from "@/components/insights/InsightsClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { getExpensesIn, getTotalIn } from "@/db/queries";
import { habits } from "@/lib/insights";
import {
  PERIODS,
  type Period,
  periodLabel,
  periodRange,
  previousRange,
} from "@/lib/period";
import { dayKey, now } from "@/lib/time";
import { currentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function InsightsPage({ searchParams }: PageProps<"/insights">) {
  const { p, o } = await searchParams;
  const period: Period = PERIODS.includes(p as Period) ? (p as Period) : "month";
  const offset = Number.isInteger(Number(o)) ? Number(o) : 0;

  const range = periodRange(period, offset);
  const user = await currentUser();

  // Averages, streaks and comparisons only count days that have actually happened.
  const days = eachDayOfInterval({
    start: range.start,
    end: min([range.end, now()]),
  }).map((d) => format(d, "yyyy-MM-dd"));

  const [entries, previousTotal] = await Promise.all([
    getExpensesIn(user.id, range),
    getTotalIn(
      user.id,
      previousRange(period, offset, offset === 0 ? days.length : undefined),
    ),
  ]);

  const insightEntries = entries.map((e) => ({
    id: e.id,
    day: dayKey(e.spentAt),
    weekday: getISODay(e.spentAt) - 1,
    amountMinor: e.amountMinor,
    note: e.note,
    time: e.spentAt.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Manila",
    }),
    categoryName: e.categoryName,
    categoryEmoji: e.categoryEmoji,
    categoryColor: e.categoryColor,
  }));

  return (
    <main className="flex flex-1 flex-col gap-5 pb-6">
      <PageHeader title="Insights" />

      <section className="px-6">
        <div className="flex rounded-full bg-ink-700 p-1">
          {PERIODS.map((value) => (
            <Link
              key={value}
              href={`/insights?p=${value}`}
              aria-current={value === period ? "page" : undefined}
              className={`flex-1 rounded-full py-2 text-center text-sm capitalize ${
                value === period
                  ? "bg-sky-400 font-semibold text-ink-900"
                  : "text-sky-200"
              }`}
            >
              {value}
            </Link>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-between px-6">
        <PeriodLink period={period} offset={offset - 1} label="Earlier" back />
        <p className="text-sm font-semibold text-paper">
          {periodLabel(period, offset)}
        </p>
        <PeriodLink period={period} offset={offset + 1} label="Later" disabled={offset >= 0} />
      </section>

      <InsightsClient
        entries={insightEntries}
        period={period}
        offset={offset}
        habits={
          entries.length > 0 && (
            <HabitsStrip
              stats={habits(insightEntries, days)}
              previousTotal={previousTotal}
              periodNoun={period}
            />
          )
        }
      />
    </main>
  );
}

function PeriodLink({
  period,
  offset,
  label,
  back = false,
  disabled = false,
}: {
  period: Period;
  offset: number;
  label: string;
  back?: boolean;
  disabled?: boolean;
}) {
  if (disabled) return <span className="size-11" />;

  return (
    <Link
      href={`/insights?p=${period}&o=${offset}`}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full text-sky-300"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={back ? undefined : { transform: "rotate(180deg)" }}
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </Link>
  );
}
