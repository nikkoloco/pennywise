import type { Metadata, Viewport } from "next";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import { iconPath, THEMES } from "@/lib/theme";
import { currentTheme } from "@/lib/theme-cookie";
import "./globals.css";

/**
 * Icons follow the chosen look. iOS copies the apple-touch-icon at the moment
 * of Add to Home Screen, so the installed icon matches the look on that day.
 */
export async function generateMetadata(): Promise<Metadata> {
  const theme = await currentTheme();
  return {
    title: "Pennywise",
    description: "Tap-first spending log.",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: iconPath(theme, "svg"), type: "image/svg+xml" },
        { url: iconPath(theme, 192), sizes: "192x192", type: "image/png" },
      ],
      apple: iconPath(theme, 180),
    },
    appleWebApp: {
      capable: true,
      title: "Pennywise",
      statusBarStyle: "black-translucent",
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  return {
    themeColor: THEMES[await currentTheme()].chrome,
    /** Installed to the Home Screen this behaves like a native app, so no zoom. */
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" data-theme={await currentTheme()}>
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
