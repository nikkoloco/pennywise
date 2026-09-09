import { splitDraft, splitMinor } from "@/lib/money";

const SIZES = {
  hero: { peso: "text-4xl", whole: "text-6xl", cents: "text-3xl" },
  lg: { peso: "text-xl", whole: "text-3xl", cents: "text-lg" },
  md: { peso: "text-sm", whole: "text-xl", cents: "text-sm" },
  sm: { peso: "text-xs", whole: "text-base", cents: "text-xs" },
} as const;

type Size = keyof typeof SIZES;
/** Gold is the default because amounts are what the eye should find first. */
type Tone = "gold" | "paper" | "muted";

const TONES = {
  gold: "text-gold-500",
  paper: "text-paper",
  muted: "text-sky-300",
};

type FigureProps = {
  negative: boolean;
  whole: string;
  /** Already carries its own decimal point, or is empty. */
  suffix: string;
  size: Size;
  tone: Tone;
};

function Figure({ negative, whole, suffix, size, tone }: FigureProps) {
  const s = SIZES[size];

  return (
    <span className={`inline-flex items-baseline font-extrabold ${TONES[tone]}`}>
      <span className={`${s.peso} opacity-80`}>{negative ? "-₱" : "₱"}</span>
      <span className={s.whole}>{whole}</span>
      {suffix && <span className={`${s.cents} opacity-70`}>{suffix}</span>}
    </span>
  );
}

/** A settled amount, always shown to the centavo. */
export function Amount({
  minor,
  size = "md",
  tone = "gold",
}: {
  minor: number;
  size?: Size;
  tone?: Tone;
}) {
  const { negative, whole, cents } = splitMinor(minor);
  return (
    <Figure negative={negative} whole={whole} suffix={`.${cents}`} size={size} tone={tone} />
  );
}

/**
 * An amount still being typed, shown exactly as far as it has been entered.
 * Trailing ".00" would be noise on a figure the user is halfway through, and
 * hiding it is the whole point of typing in pesos.
 */
export function DraftAmount({
  draft,
  size = "md",
  tone = "gold",
}: {
  draft: string;
  size?: Size;
  tone?: Tone;
}) {
  const { negative, whole, suffix } = splitDraft(draft);
  return (
    <Figure negative={negative} whole={whole} suffix={suffix} size={size} tone={tone} />
  );
}
