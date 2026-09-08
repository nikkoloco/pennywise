import { Card } from "@/components/ui/Card";
import { formatTime } from "@/lib/time";

type Attempt = { id: string; at: Date; status: number; message: string };

/**
 * A Shortcut that fails on a locked phone reports nothing useful, so the reason
 * has to be readable here instead.
 */
export function AttemptLog({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length === 0) {
    return (
      <Card>
        <p className="text-sm text-sky-200">
          Nothing has reached the endpoint yet. Once your Shortcut runs, every
          attempt shows up here with the reason it worked or failed.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <ul className="divide-y divide-ink-600">
        {attempts.map((attempt) => {
          const ok = attempt.status === 200;
          return (
            <li key={attempt.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span
                aria-hidden
                className={`mt-1.5 size-2 shrink-0 rounded-full ${
                  ok ? "bg-swatch-4" : "bg-swatch-8"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${ok ? "text-sky-100" : "text-gold-300"}`}>
                  {attempt.message}
                </p>
                <p className="mt-0.5 text-xs text-sky-400">
                  {formatTime(attempt.at)} · {attempt.status}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
