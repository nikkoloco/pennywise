"use client";

/**
 * The icon for an entry, chosen rather than typed.
 *
 * This was a text box showing an emoji as its placeholder, which made it look
 * filled in when its value was actually empty. Anything you did not overtype
 * refused to save, with nothing on screen explaining why. A picker cannot be
 * empty, so the failure is designed out rather than described.
 *
 * The set leans on what the categories already use, since the icon is standing
 * in for what kind of spending this is.
 */
const ICONS = [
  "🧾", "🍚", "🛒", "🍱", "🛵", "🚍", "🚗", "⛽",
  "✈️", "🏨", "🎬", "🎤", "🎧", "🎮", "📱", "💻",
  "🧴", "💊", "🏋️", "⚽", "👕", "👟", "🌸", "🎁",
  "🎂", "🔁", "📦", "✨", "🏠", "💡", "📚", "🐾",
];

type Props = {
  value: string;
  onChange: (emoji: string) => void;
  /** Umber for future money, matching whichever sheet this sits in. */
  tone?: "ink" | "umber";
};

export function EmojiPicker({ value, onChange, tone = "ink" }: Props) {
  const unselected = tone === "umber" ? "bg-umber-700" : "bg-ink-700";
  const selected = tone === "umber" ? "bg-gold-500" : "bg-sky-400";

  return (
    <div>
      <p
        className={`mb-2 text-xs tracking-[0.15em] uppercase ${
          tone === "umber" ? "text-umber-300" : "text-sky-300"
        }`}
      >
        Icon
      </p>
      <div
        role="radiogroup"
        aria-label="Icon"
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
      >
        {ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            role="radio"
            aria-checked={icon === value}
            aria-label={icon}
            onClick={() => onChange(icon)}
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl ${
              icon === value ? selected : unselected
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The icon an entry starts with, so the field is never empty. */
export const DEFAULT_EMOJI = ICONS[0];
