import type { Metadata, Viewport } from "next";
import { TabBar } from "@/components/ui/TabBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pennywise",
  description: "Tap-first spending log.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Pennywise",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#060b1c",
  /** Installed to the Home Screen this behaves like a native app, so no zoom. */
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* Clears the fixed tab bar plus the home indicator beneath it. */}
        <div className="flex flex-1 flex-col pb-[calc(env(safe-area-inset-bottom)+4.5rem)]">
          {children}
        </div>
        <TabBar />
      </body>
    </html>
  );
}
