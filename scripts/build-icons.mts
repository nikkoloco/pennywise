import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { iconPath, THEME_IDS, THEMES, type ThemeId } from "../lib/theme";

/**
 * Draws the peso-P icon once per look, then rasterises each into the PNG sizes
 * iOS and the PWA manifest need. Run with `npm run icons` after changing the
 * glyph or a theme's icon colours.
 */
function iconSvg(theme: ThemeId) {
  const { ground, glyph } = THEMES[theme].icon;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${ground[0]}"/>
      <stop offset="1" stop-color="${ground[1]}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#ground)"/>
  <!-- Glyph is drawn at full size, then scaled about the canvas centre for icon padding. -->
  <g transform="translate(256 256) scale(0.9) translate(-256 -256)"
     fill="none" stroke="${glyph}" stroke-linecap="butt">
    <!-- P: stem, then the bowl arcing off the stem top -->
    <path d="M193 120 V 392" stroke-width="46"/>
    <path d="M193 120 H 275 A 84 84 0 0 1 275 288 H 193" stroke-width="46"/>
    <!-- The two horizontal strokes that make it a peso -->
    <path d="M131 178 H 373" stroke-width="26"/>
    <path d="M131 236 H 373" stroke-width="26"/>
  </g>
</svg>
`;
}

mkdirSync("public/icons", { recursive: true });

for (const theme of THEME_IDS) {
  const svg = Buffer.from(iconSvg(theme));
  writeFileSync(`public${iconPath(theme, "svg")}`, svg);

  for (const size of [180, 192, 512] as const) {
    const path = `public${iconPath(theme, size)}`;
    await sharp(svg, { density: 400 }).resize(size, size).png().toFile(path);
    console.log(`${path} ${size}x${size}`);
  }
}
