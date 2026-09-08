import { PageHeader } from "@/components/ui/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";

export default function InsightsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 pb-6">
      <PageHeader title="Insights" subtitle="Week / Month / Year" />
      <Placeholder
        phase="Phase 4"
        what="Donut by category, stacked bars by period, and a habits strip: biggest category, busiest weekday, longest no-spend streak."
      />
    </main>
  );
}
