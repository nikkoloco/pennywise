const SWATCHES = [
  "bg-swatch-1",
  "bg-swatch-2",
  "bg-swatch-3",
  "bg-swatch-4",
  "bg-swatch-5",
  "bg-swatch-6",
  "bg-swatch-7",
  "bg-swatch-8",
  "bg-swatch-9",
  "bg-swatch-10",
];

/**
 * Phase 0 placeholder. Exists to prove the deploy pipeline and the palette
 * render correctly on device before any feature work lands.
 */
export default function Home() {
  return (
    <main className="safe-top safe-bottom flex flex-1 flex-col justify-center gap-10 px-6 py-12">
      <div className="relative">
        {/* Radial glow that will sit behind the today-total on the real Home screen. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -top-16 h-48 opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, var(--color-sky-400), transparent)",
          }}
        />
        <p className="relative text-sm tracking-[0.2em] text-sky-300 uppercase">
          Pennywise
        </p>
        <p className="relative mt-3 text-6xl font-extrabold text-gold-500">
          &#8369;0<span className="text-3xl text-gold-300">.00</span>
        </p>
        <p className="relative mt-2 text-sm text-sky-200">
          spent today &middot; Asia/Manila
        </p>
      </div>

      <div className="rounded-card border border-ink-500 bg-ink-700 p-5">
        <p className="text-sm text-sky-200">
          Foundation is live. Logging, calendar, insights and events land in the
          phases ahead.
        </p>
        <div className="mt-4 flex gap-1.5">
          {SWATCHES.map((swatch) => (
            <div key={swatch} className={`h-8 flex-1 rounded-md ${swatch}`} />
          ))}
        </div>
      </div>

      <div className="rounded-card border border-umber-500 bg-umber-700 p-5">
        <p className="text-xs tracking-[0.15em] text-umber-300 uppercase">
          Planned
        </p>
        <p className="mt-1 text-sm text-gold-300">
          Trips and birthdays live here, in brown, so future money never looks
          like money you already spent.
        </p>
      </div>
    </main>
  );
}
