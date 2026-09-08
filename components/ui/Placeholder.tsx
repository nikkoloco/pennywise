import { Card } from "@/components/ui/Card";

/** Honest stand-in for screens whose phase has not been built yet. */
export function Placeholder({ phase, what }: { phase: string; what: string }) {
  return (
    <Card className="mx-6">
      <p className="text-xs tracking-[0.15em] text-gold-500 uppercase">{phase}</p>
      <p className="mt-2 text-sm text-sky-200">{what}</p>
    </Card>
  );
}
