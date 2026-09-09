export const PESO = "₱";

/**
 * Splits integer centavos into display parts so the peso amount can be
 * typeset with the centavos smaller than the whole number.
 */
export function splitMinor(minor: number) {
  const abs = Math.abs(minor);
  return {
    negative: minor < 0,
    whole: Math.floor(abs / 100).toLocaleString("en-PH"),
    cents: (abs % 100).toString().padStart(2, "0"),
  };
}

/** Flat single-string form, for lists and chart labels. */
export function formatMinor(minor: number) {
  const { negative, whole, cents } = splitMinor(minor);
  return `${negative ? "-" : ""}${PESO}${whole}.${cents}`;
}

/** Compact form for calendar cells, where a full amount would not fit. */
export function formatCompact(minor: number) {
  const pesos = minor / 100;
  if (pesos >= 1000) return `${(pesos / 1000).toFixed(1)}k`;
  return String(Math.round(pesos));
}

/**
 * Keypad entry, as a draft string like "250" or "250.5".
 *
 * Amounts are typed in whole pesos, because that is what almost every amount
 * is. Centavos are reachable behind the decimal key rather than mandatory, so
 * logging 250 pesos costs three presses instead of five.
 *
 * The draft is the real state of the input: "250" and "250." are the same
 * number but not the same thing to type next, and only a string can tell them
 * apart.
 */

/** Six whole digits is more than anyone logs in one go. */
const MAX_WHOLE_DIGITS = 6;

export function pressAmountKey(draft: string, key: string) {
  if (key === "del") return draft.slice(0, -1);

  if (key === ".") {
    if (draft.includes(".")) return draft;
    return draft === "" ? "0." : `${draft}.`;
  }

  const [whole, cents] = draft.split(".");
  if (cents !== undefined) return cents.length >= 2 ? draft : draft + key;

  // A leading zero is never meaningful, so the first real digit replaces it.
  if (draft === "0") return key;
  return whole.length >= MAX_WHOLE_DIGITS ? draft : draft + key;
}

export function draftToMinor(draft: string) {
  const [whole, cents = ""] = draft.split(".");
  return Number(whole || 0) * 100 + Number(cents.padEnd(2, "0"));
}

/**
 * The draft split for display. The suffix carries the decimal point only once
 * it has been typed, so pressing it is visible even before a digit follows.
 */
export function splitDraft(draft: string) {
  const [whole, cents] = draft.split(".");
  return {
    negative: false,
    whole: Number(whole || 0).toLocaleString("en-PH"),
    suffix: cents === undefined ? "" : `.${cents}`,
  };
}
