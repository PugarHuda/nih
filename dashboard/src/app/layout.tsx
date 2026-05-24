import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { GlobalNavSuppress } from "@/components/global-nav-suppress";
import { ViewTransitionNav } from "@/components/view-transition-nav";
import { ClickSparkle } from "@/components/click-sparkle";

export const metadata: Metadata = {
  title: "Nih — Tip MUSD anywhere on the web",
  description:
    "Bitcoin-backed tipping on Mezo. Send MUSD with a click on Twitter, YouTube, Substack, GitHub. Creators borrow against their tips without selling.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Nih",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/assets/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192" },
    ],
    apple: "/icon-180.png",
  },
  openGraph: {
    title: "Nih — Tip MUSD anywhere on the web",
    description: "Bitcoin-backed tipping on Mezo.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBF6E8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-style="komik"
      data-mode="light"
      data-density="regular"
      data-tone="friendly"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bangers&family=Space+Grotesk:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Caveat:wght@500;700&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        {/* Prefetch the landing assets so clicking the logo from an
            app route doesn't trigger a network roundtrip + FOUC. */}
        <link rel="prefetch" href="/landing.css" as="style" />
        <link rel="prefetch" href="/landing.js" as="script" />
      </head>
      <body
        className="min-h-screen antialiased"
        data-style="komik"
        data-mode="light"
      >
        <Suspense fallback={null}>
          <GlobalNavSuppress />
        </Suspense>
        <ViewTransitionNav />
        <ClickSparkle />
        {children}
      </body>
    </html>
  );
}
