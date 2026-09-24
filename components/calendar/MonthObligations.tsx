import { Card, SectionLabel } from "@/components/ui/Card";
import { formatMinor } from "@/lib/money";
import { monthLabel } from "@/lib/time";

/** "28 Sep" from "2026-09-28". The card is already about one month. */
function shortDay(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

type Props = {
  monthKey: string;
  recurringMinor: number;
  plannedMinor: number;
  /** Pay-later purchases due back this month, paid or not. */
  payBack: { id: string; owedTo: string; dueOn: string; amountMinor: number; settled: boolean }[];
  totalMinor: number;
  /** Rough coming-up costs, shown apart because they are not known amounts. */
  guessesMinor: number;
};

/**
 * What a month owes before anything is spent in it, so a future month is not
 * simply an empty grid.
 *
 * The guesses sit under a rule rather than inside the total. They were entered
 * as approximations on purpose, and adding them would turn a figure you can
 * act on into one you would have to second-guess.
 */
export function MonthObligations({
  monthKey,
  recurringMinor,
  plannedMinor,
  payBack,
  totalMinor,
  guessesMinor,
}: Props) {
  const payBackMinor = payBack.reduce((n, p) => n + p.amountMinor, 0);
  if (totalMinor === 0 && guessesMinor === 0) return null;

  return (
    <section className="px-6">
      <Card variant="event">
        <div className="flex items-baseline justify-between">
          <SectionLabel>Due in {monthLabel(monthKey)}</SectionLabel>
          <span className="text-sm font-bold text-gold-300">
            {formatMinor(totalMinor)}
          </span>
        </div>

        <ul className="mt-3 flex flex-col gap-1 text-xs text-umber-300">
          {recurringMinor > 0 && (
            <li className="flex justify-between">
              <span>Recurring payments</span>
              <span>{formatMinor(recurringMinor)}</span>
            </li>
          )}
          {plannedMinor > 0 && (
            <li className="flex justify-between">
              <span>Anticipated expenditure</span>
              <span>{formatMinor(plannedMinor)}</span>
            </li>
          )}
          {payBackMinor > 0 && (
            <li>
              <div className="flex justify-between">
                <span>To pay back</span>
                <span>{formatMinor(payBackMinor)}</span>
              </div>
              {/* Each by date, since the day is what matters for a card bill. */}
              <ul className="mt-1 flex flex-col gap-0.5 pl-3">
                {payBack.map((p) => (
                  <li
                    key={p.id}
                    className={`flex justify-between ${p.settled ? "opacity-60" : ""}`}
                  >
                    <span className="truncate">
                      {p.owedTo} · {shortDay(p.dueOn)}
                      {p.settled && " · paid"}
                    </span>
                    <span>{formatMinor(p.amountMinor)}</span>
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ul>

        {guessesMinor > 0 && (
          <p className="mt-3 border-t border-umber-500 pt-3 text-xs text-umber-300">
            Plus {formatMinor(guessesMinor)} of coming-up guesses, not counted
            here and not tied to a month.
          </p>
        )}
      </Card>
    </section>
  );
}
