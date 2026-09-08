import { PageHeader } from "@/components/ui/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";

export default function CalendarPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 pb-6">
      <PageHeader title="Calendar" subtitle="September 2026" />
      <Placeholder
        phase="Phase 3"
        what="Month grid with a spend-intensity heat per day, today ringed in gold, and a day-detail sheet on tap."
      />
    </main>
  );
}
