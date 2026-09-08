"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="safe-top flex flex-1 flex-col justify-center gap-4 px-6">
      <Card>
        <p className="text-sm font-semibold text-paper">Something broke.</p>
        <p className="mt-2 text-sm text-sky-200">
          Nothing you logged is lost. Try again, and if it keeps happening your
          connection is the likeliest cause.
        </p>
        <div className="mt-4">
          <Button onClick={reset}>Try again</Button>
        </div>
      </Card>
    </main>
  );
}
