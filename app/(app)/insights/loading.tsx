import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-5 pb-6">
      <PageHeader title="Insights" />

      <section className="px-6">
        <Skeleton className="h-11 rounded-full" />
      </section>

      <section className="px-6">
        <Skeleton className="h-56" />
      </section>

      <section className="px-6">
        <Skeleton className="h-40" />
      </section>
    </main>
  );
}
