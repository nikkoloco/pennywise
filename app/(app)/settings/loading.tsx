import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton, SkeletonGrid } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-5 pb-6">
      <PageHeader title="Settings" />

      <section className="flex flex-col gap-4 px-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-20" />
        <SkeletonGrid count={2} className="h-28" />
      </section>
    </main>
  );
}
