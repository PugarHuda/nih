"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Wraps every in-app navigation in `document.startViewTransition` so the
 * cross-route transition cross-fades instead of flickering. Chrome 111+,
 * Edge 111+, Safari 18+. Browsers without support fall through to a
 * normal navigation — no regression.
 *
 * Listens for clicks anywhere on `<a href="/...">` (in-app links) and
 * routes them through `router.push` inside a transition. External links,
 * download links, target=_blank, and anything with `data-no-transition`
 * are skipped.
 */
export function ViewTransitionNav() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip if the browser doesn't support startViewTransition.
    if (
      typeof (document as unknown as { startViewTransition?: unknown })
        .startViewTransition !== "function"
    ) return;

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a) return;
      if (a.target && a.target !== "" && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      if (a.dataset.noTransition === "true") return;
      const href = a.getAttribute("href");
      if (!href) return;
      // Internal link only — starts with "/" and not protocol-relative.
      if (!href.startsWith("/") || href.startsWith("//")) return;
      // Same path = noop.
      if (href === pathname) return;

      e.preventDefault();
      const start = (
        document as unknown as {
          startViewTransition: (cb: () => void) => unknown;
        }
      ).startViewTransition;
      start(() => router.push(href));
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname, router]);

  return null;
}
