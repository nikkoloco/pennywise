import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton, SkeletonGrid } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-4 pb-6">
      <PageHeader title="Future" subtitle="Anticipated expenditure" />

      <section className="px-6">
        <Skeleton className="h-12 rounded-full" />
      </section>

      <section className="flex flex-col gap-3 px-6">
        <SkeletonGrid count={3} className="h-32" />
      </section>
    </main>
  );
}
