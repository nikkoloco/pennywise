import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton, SkeletonGrid } from "@/components/ui/Skeleton";
import { formatLongDate, now } from "@/lib/time";

/**
 * Home's placeholder. Its real job is not the shimmer: a route this dynamic is
 * never prefetched without a loading boundary, so this file is what makes
 * tapping the tab respond immediately instead of sitting on the old screen.
 */
export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-6 pb-6">
      <PageHeader title="Today" subtitle={formatLongDate(now())} />

      <section className="px-6">
        <Skeleton className="h-11 w-44" />
        <Skeleton className="mt-2 h-4 w-28" />
      </section>

      <section className="px-6">
        <div className="grid grid-cols-4 gap-2">
          <SkeletonGrid count={12} className="aspect-square" />
        </div>
      </section>
    </main>
  );
}
