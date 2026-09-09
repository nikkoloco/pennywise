import { Skeleton, SkeletonGrid } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-6 pb-6">
      <header className="safe-top px-6 pt-6 pb-2">
        <Skeleton className="h-6 w-32" />
      </header>

      <section className="flex flex-col gap-4 px-6">
        <SkeletonGrid count={4} className="h-28" />
      </section>
    </main>
  );
}
