import type { MetadataRoute } from "next";
import { iconPath, THEMES } from "@/lib/theme";
import { currentTheme } from "@/lib/theme-cookie";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const theme = await currentTheme();
  const chrome = THEMES[theme].chrome;

  return {
    name: "Pennywise",
    short_name: "Pennywise",
    description: "Tap-first spending log.",
    start_url: "/",
    display: "standalone",
    background_color: chrome,
    theme_color: chrome,
    orientation: "portrait",
    icons: [
      { src: iconPath(theme, 192), sizes: "192x192", type: "image/png" },
      { src: iconPath(theme, 512), sizes: "512x512", type: "image/png" },
      { src: iconPath(theme, "svg"), sizes: "any", type: "image/svg+xml" },
    ],
  };
}
