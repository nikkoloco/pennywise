import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pennywise",
    short_name: "Pennywise",
    description: "Tap-first spending log.",
    start_url: "/",
    display: "standalone",
    background_color: "#060b1c",
    theme_color: "#060b1c",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
