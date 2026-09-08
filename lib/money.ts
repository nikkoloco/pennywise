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
