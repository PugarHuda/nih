import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers-wrapper";

export const metadata: Metadata = {
  title: "Nih — Tip MUSD anywhere on the web",
  description:
    "Bitcoin-backed tipping on Mezo. Send MUSD with a click on Twitter, YouTube, Substack, GitHub. Creators borrow against their tips without selling.",
  openGraph: {
    title: "Nih — Tip MUSD anywhere on the web",
    description: "Bitcoin-backed tipping on Mezo.",
    type: "website",
  },
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
