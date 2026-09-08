/**
 * Static stand-in data for the Phase 1 shell so the layout can be judged at
 * realistic density. Phase 2 replaces every use of this file with real queries;
 * deleting it should be the last step of that phase.
 */

export const SAMPLE_TILES = [
  { id: "1", emoji: "🍚", label: "Lunch", amountMinor: null },
  { id: "2", emoji: "🚍", label: "Jeepney", amountMinor: 1500 },
  { id: "3", emoji: "☕", label: "Coffee", amountMinor: 12000 },
  { id: "4", emoji: "🛒", label: "Groceries", amountMinor: null },
  { id: "5", emoji: "🧋", label: "Milk Tea", amountMinor: 14500 },
  { id: "6", emoji: "⛽", label: "Gas", amountMinor: null },
  { id: "7", emoji: "💊", label: "Meds", amountMinor: null },
  { id: "8", emoji: "🎬", label: "Fun", amountMinor: null },
  { id: "9", emoji: "🏠", label: "Bills", amountMinor: null },
];

export const SAMPLE_TODAY = [
  { id: "a", emoji: "☕", label: "Coffee", note: "Kape sa may kanto", minor: 12000, time: "8:12 AM" },
  { id: "b", emoji: "🚍", label: "Jeepney", note: null, minor: 1500, time: "8:40 AM" },
  { id: "c", emoji: "🍚", label: "Lunch", note: "Silog", minor: 18500, time: "12:05 PM" },
];

export const SAMPLE_TODAY_TOTAL = SAMPLE_TODAY.reduce((n, e) => n + e.minor, 0);

export const SAMPLE_EVENTS = [
  { id: "e1", emoji: "🇯🇵", name: "Japan trip", daysAway: 96, budgetMinor: 8000000, spentMinor: 2450000 },
  { id: "e2", emoji: "🎂", name: "Mom's birthday", daysAway: 12, budgetMinor: 500000, spentMinor: 120000 },
  { id: "e3", emoji: "🎄", name: "Christmas gifts", daysAway: 107, budgetMinor: 1500000, spentMinor: 0 },
];
