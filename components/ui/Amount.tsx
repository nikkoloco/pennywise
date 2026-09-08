import { splitMinor } from "@/lib/money";

const SIZES = {
  hero: { peso: "text-4xl", whole: "text-6xl", cents: "text-3xl" },
  lg: { peso: "text-xl", whole: "text-3xl", cents: "text-lg" },
  md: { peso: "text-sm", whole: "text-xl", cents: "text-sm" },
  sm: { peso: "text-xs", whole: "text-base", cents: "text-xs" },
} as const;

type Props = {
  minor: number;
  size?: keyof typeof SIZES;
  /** Gold is the default because amounts are what the eye should find first. */
  tone?: "gold" | "paper" | "muted";
};

const TONES = {
  gold: "text-gold-500",
  paper: "text-paper",
  muted: "text-sky-300",
};

export function Amount({ minor, size = "md", tone = "gold" }: Props) {
  const { negative, whole, cents } = splitMinor(minor);
  const s = SIZES[size];

  return (
    <span className={`inline-flex items-baseline font-extrabold ${TONES[tone]}`}>
      <span className={`${s.peso} opacity-80`}>{negative ? "-₱" : "₱"}</span>
      <span className={s.whole}>{whole}</span>
      <span className={`${s.cents} opacity-70`}>.{cents}</span>
    </span>
  );
}
