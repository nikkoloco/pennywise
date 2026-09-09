import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton, SkeletonGrid } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-5 pb-6">
      <PageHeader title="Calendar" />

      <section className="px-6">
        <Skeleton className="h-8 w-40" />
      </section>

      <section className="px-6">
        <div className="grid grid-cols-7 gap-1.5">
          <SkeletonGrid count={35} className="aspect-square rounded-lg" />
        </div>
      </section>
    </main>
  );
}
