import { Card, SectionLabel } from "@/components/ui/Card";
import { formatMinor } from "@/lib/money";
import { monthLabel } from "@/lib/time";

type Props = {
  monthKey: string;
  recurringMinor: number;
  plannedMinor: number;
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
  totalMinor,
  guessesMinor,
}: Props) {
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
