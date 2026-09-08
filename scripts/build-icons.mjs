import { readFileSync } from "node:fs";
import sharp from "sharp";

/**
 * Rasterises public/icon.svg into the PNG sizes iOS and the PWA manifest need.
 * Run with `npm run icons` after editing the SVG.
 */
const svg = readFileSync("public/icon.svg");

const targets = [
  ["public/apple-touch-icon.png", 180],
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
];

for (const [path, size] of targets) {
  await sharp(svg, { density: 400 }).resize(size, size).png().toFile(path);
  console.log(`${path} ${size}x${size}`);
}
