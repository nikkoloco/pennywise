/**
 * The categories a fresh Pennywise starts with, and the subgroups inside them.
 *
 * Top-level categories double as the initial quick-tap tiles, all amount-less
 * so the first tap opens the keypad. Subgroups never get a tile: they are how
 * you say what a Food spend actually was, not a thing you reach for first.
 *
 * Every top-level default takes a distinct swatch, since two categories sharing
 * a colour are indistinguishable in the donut, which is where colour has to do
 * real work. Subgroups inherit their parent's colour so a rolled-up chart shows
 * one colour per group.
 */
export const DEFAULT_CATEGORIES = [
  {
    name: "Transportation",
    emoji: "🚍",
    color: "swatch-1",
    children: ["Ride-hailing", "Commute", "Gas"],
  },
  {
    name: "Food",
    emoji: "🍚",
    color: "swatch-6",
    children: ["Groceries", "Canteen", "Food delivery"],
  },
  { name: "Self-care", emoji: "🧴", color: "swatch-5", children: [] },
  { name: "Fitness", emoji: "🏋️", color: "swatch-4", children: [] },
  { name: "Lifestyle", emoji: "✨", color: "swatch-7", children: [] },
  { name: "Bills", emoji: "🧾", color: "swatch-9", children: [] },
  {
    name: "Sports & Leisure",
    emoji: "⚽",
    color: "swatch-2",
    children: ["Equipment", "Match fee", "Supplements"],
  },
  /** No tile: recurring payments have their own tab, which is where these live. */
  { name: "Subscriptions", emoji: "🔁", color: "swatch-10", children: [], tile: false },
  { name: "Travel", emoji: "✈️", color: "swatch-11", children: [] },
  { name: "Perfume", emoji: "🫧", color: "swatch-13", children: [] },
  { name: "Clothing", emoji: "👕", color: "swatch-14", children: ["Clothes", "Shoes"] },
  {
    name: "Supplies",
    emoji: "🧻",
    color: "swatch-3",
    children: ["Household supplies", "Appliances", "Furniture"],
  },
  { name: "Miscellaneous", emoji: "📦", color: "swatch-8", children: [] },
];

/** Total swatches in the ramp, used to rotate colours for new categories. */
export const SWATCH_COUNT = 14;
