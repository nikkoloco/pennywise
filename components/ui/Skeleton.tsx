/**
 * A placeholder block shown while a screen's data is still in flight. It takes
 * the shape of what is coming, so the layout settles once rather than jumping
 * when the real content lands.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`animate-pulse rounded-card bg-ink-700 ${className}`} />
  );
}

/** The grid of tiles and cards repeats often enough to be worth naming. */
export function SkeletonGrid({ count, className }: { count: number; className: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </>
  );
}
