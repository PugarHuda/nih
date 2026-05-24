"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Mounted in root layout so every cross-page navigation — including
 * (app) → / and / → (app) — flips `body.no-anim` for ~400ms.
 *
 * (app)/layout also has a NavAnimSuppress; that one only fires for nav
 * *within* the app group. This global one covers transitions in and out
 * of the marketing landing, which was the flicker the user noticed.
 */
export function GlobalNavSuppress() {
  const pathname = usePathname();
  useEffect(() => {
    document.body.classList.add("no-anim");
    // Landing arrivals need a longer suppression window because landing.js
    // boots after-interactive (~200-300ms) and appends DOM that runs its
    // own animations on mount. Other routes clear in 400ms.
    const window_ms = pathname === "/" ? 700 : 400;
    const t = window.setTimeout(() => document.body.classList.remove("no-anim"), window_ms);
    return () => window.clearTimeout(t);
  }, [pathname]);
  return null;
}
