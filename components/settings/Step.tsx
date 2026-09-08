/** One numbered instruction. The number sits in a gold chip so a half-finished
 *  setup is easy to pick back up on a phone screen. */
export function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-ink-900">
        {n}
      </span>
      <div className="flex-1 pt-0.5 text-sm text-sky-200">{children}</div>
    </li>
  );
}

/** A label the user must tap, styled so it stands out from prose. */
export function Tap({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-paper">{children}</strong>;
}
