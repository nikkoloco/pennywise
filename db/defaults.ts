/**
 * The categories a fresh Pennywise starts with. They double as the initial
 * quick-tap tiles, all amount-less so the first tap opens the keypad. Both are
 * editable data from that point on.
 *
 * Every default takes a distinct swatch: two categories sharing a colour are
 * indistinguishable in the donut, which is where colour has to do real work.
 */
export const DEFAULT_CATEGORIES = [
  { name: "Transportation", emoji: "🚍", color: "swatch-1" },
  { name: "Food", emoji: "🍚", color: "swatch-6" },
  { name: "Online Shopping", emoji: "📦", color: "swatch-8" },
  { name: "Self-care", emoji: "🧴", color: "swatch-5" },
  { name: "Fitness", emoji: "🏋️", color: "swatch-4" },
  { name: "Groceries", emoji: "🛒", color: "swatch-3" },
  { name: "Lifestyle", emoji: "✨", color: "swatch-7" },
  { name: "Bills", emoji: "🧾", color: "swatch-9" },
  { name: "Sports & Leisure", emoji: "⚽", color: "swatch-2" },
  { name: "Subscriptions", emoji: "🔁", color: "swatch-10" },
  { name: "Canteen", emoji: "🍱", color: "swatch-12" },
  { name: "Travel", emoji: "✈️", color: "swatch-11" },
  { name: "Perfume", emoji: "🌸", color: "swatch-13" },
  { name: "Clothes", emoji: "👕", color: "swatch-14" },
];

/** Total swatches in the ramp, used to rotate colours for new categories. */
export const SWATCH_COUNT = 14;
