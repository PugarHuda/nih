import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers-wrapper";

export const metadata: Metadata = {
  title: "Nih — Tip MUSD anywhere on the web",
  description:
    "Bitcoin-backed tipping on Mezo. Send MUSD with a click on Twitter, YouTube, Substack, GitHub. Creators borrow against their tips without selling.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Nih",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
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
  themeColor: "hsl(22 90% 56%)",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="noise min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
