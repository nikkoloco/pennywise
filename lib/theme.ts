/**
 * The five looks the app can wear. Each one recolours the same palette
 * tokens, so nothing else in the app knows which is on.
 *
 * `chrome` is what the browser paints around the page and the manifest's
 * background. The icon colours are read by scripts/build-icons.ts, so the Home
 * Screen icon matches whichever look was on when the app was installed.
 */
export const THEMES = {
  default: {
    label: "Pennywise",
    chrome: "#060b1c",
    icon: { ground: ["#101b45", "#060b1c"], glyph: "#ffc81e" },
  },
  light: {
    label: "Light",
    chrome: "#eef2f9",
    icon: { ground: ["#ffffff", "#dfe6f2"], glyph: "#b46a00" },
  },
  dark: {
    label: "Dark",
    chrome: "#000000",
    icon: { ground: ["#1c1c20", "#000000"], glyph: "#ffc81e" },
  },
  pink: {
    label: "Pink",
    chrome: "#fff0f5",
    icon: { ground: ["#ffe1ec", "#ffb8d1"], glyph: "#c2185b" },
  },
  forest: {
    label: "Forest",
    chrome: "#07130d",
    icon: { ground: ["#17372a", "#07130d"], glyph: "#ffffff" },
  },
} as const;

export type ThemeId = keyof typeof THEMES;

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

/** A display preference belongs to the device, so it lives in a cookie. */
export const THEME_COOKIE = "pennywise_theme";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && value in THEMES;
}

/** Anything unknown, including no cookie at all, is the default look. */
export function toThemeId(value: string | undefined): ThemeId {
  return isThemeId(value) ? value : "default";
}

export function iconPath(theme: ThemeId, size: number | "svg") {
  return size === "svg" ? `/icons/${theme}.svg` : `/icons/${theme}-${size}.png`;
}
