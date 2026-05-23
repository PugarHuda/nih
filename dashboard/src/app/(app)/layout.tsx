"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Providers } from "../providers-wrapper";

/**
 * App-section layout — wraps wagmi / RainbowKit / Mezo Passport.
 *
 * The marketing landing at `/` ships a vanilla landing.js that appends
 * DOM (tweaks toggle, SFX overlays) directly to `document.body`. If a
 * user navigates `/` → `/dashboard` while those nodes were still being
 * appended, cleanup on the landing component sometimes loses the race.
 * We sweep defensively here on every app-route mount.
 *
 * Why a route group at all: the landing doesn't need wallet context,
 * and importing wagmi / RainbowKit / Passport on it triggers
 * (a) MetaMask vs Phantom window.ethereum collisions, and
 * (b) framer-motion / clay React-18 jsx-runtime crashes on React 19.
 */
function StyleSwapPurge() {
  useEffect(() => {
    const purge = () =>
      document.body
        .querySelectorAll(
          ".twk-mini-toggle, .twk-mini, .pow, .spark, .drift-layer, .panel-modal",
        )
        .forEach((el) => el.remove());
    purge();
    const t = window.setTimeout(purge, 200);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}

/**
 * Suppress the `fade-up` entrance animation right after a client-side
 * navigation so we don't see every page slide up 6px on arrival. The
 * first mount of the session still animates (no prior pathname); only
 * subsequent navigations short-circuit.
 */
function NavAnimSuppress() {
  const pathname = usePathname();
  useEffect(() => {
    document.body.classList.add("no-anim");
    const t = window.setTimeout(() => document.body.classList.remove("no-anim"), 400);
    return () => window.clearTimeout(t);
  }, [pathname]);
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <StyleSwapPurge />
      <NavAnimSuppress />
      {children}
    </Providers>
  );
}
