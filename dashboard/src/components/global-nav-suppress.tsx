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
    const t = window.setTimeout(() => document.body.classList.remove("no-anim"), 400);
    return () => window.clearTimeout(t);
  }, [pathname]);
  return null;
}
