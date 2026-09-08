import { Card, SectionLabel } from "@/components/ui/Card";
import type { habits } from "@/lib/insights";
import { formatMinor } from "@/lib/money";

type Props = {
  stats: ReturnType<typeof habits>;
  previousTotal: number;
  periodNoun: string;
};

export function HabitsStrip({ stats, previousTotal, periodNoun }: Props) {
  const delta = stats.total - previousTotal;

  const rows: [string, string][] = [
    ["Biggest", stats.biggest ? `${stats.biggest.emoji} ${stats.biggest.name}` : "—"],
    [
      "Most often",
      stats.mostFrequent
        ? `${stats.mostFrequent.emoji} ${stats.mostFrequent.name} · ${stats.mostFrequent.count}×`
        : "—",
    ],
    ["Heaviest day", stats.busiestWeekday ?? "—"],
    ["Average day", `${formatMinor(stats.averagePerDay)} over ${stats.daysCounted}d`],
    [
      "Longest quiet run",
      stats.longestQuiet === 0
        ? "none yet"
        : `${stats.longestQuiet} ${stats.longestQuiet === 1 ? "day" : "days"}`,
    ],
    [
      `Versus last ${periodNoun}`,
      previousTotal === 0
        ? "nothing to compare"
        : `${formatMinor(Math.abs(delta))} ${delta >= 0 ? "more" : "less"}`,
    ],
  ];

  return (
    <section className="px-6">
      <SectionLabel>Habits</SectionLabel>
      <Card className="mt-3">
        <ul className="divide-y divide-ink-600">
          {rows.map(([label, value]) => (
            <li
              key={label}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <span className="text-sm text-sky-300">{label}</span>
              <span className="truncate text-sm font-semibold text-sky-100">
                {value}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
