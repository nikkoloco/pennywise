type Props = {
  children: React.ReactNode;
  /** "event" switches to the umber palette reserved for planned, future money. */
  variant?: "default" | "event";
  className?: string;
};

const VARIANTS = {
  default: "border-ink-500 bg-ink-700",
  event: "border-umber-500 bg-umber-700",
};

export function Card({ children, variant = "default", className = "" }: Props) {
  return (
    <div className={`rounded-card border p-5 ${VARIANTS[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs tracking-[0.15em] text-sky-300 uppercase">{children}</p>
  );
}
