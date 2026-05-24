"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X, ArrowRight } from "lucide-react";

/**
 * In-app product tour.
 *
 * Walks a first-time user through real sections of the live app rather
 * than a separate static "onboarding" page. Each step:
 *   - knows which pathname it lives on (so we can router.push when the
 *     next step is on a different page);
 *   - targets a `[data-tour="key"]` element on that page;
 *   - renders a tooltip card positioned near the target, with a dim
 *     overlay everywhere else.
 *
 * Activated by appending `?tour=1` to any (app) route (typically from
 * /onboarding's "Start the tour" button). Step is tracked via `&step=N`.
 *
 * Built without a tour library on purpose — adds zero deps to a bundle
 * that already pulls wagmi/rainbowkit. Trade-off: no fancy animations,
 * just a card + a cutout overlay. Good enough for the demo.
 */

interface TourStep {
  path: string; // pathname this step lives on
  target: string; // data-tour value
  title: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right";
}

const STEPS: TourStep[] = [
  {
    path: "/dashboard",
    target: "tip-banner",
    title: "Live tips on matsnet",
    body:
      "This banner rotates real Tipped events from the Goldsky subgraph every 6.5s. " +
      "Send a tip and you'll see your own appear here within ~15s of indexing.",
    placement: "bottom",
  },
  {
    path: "/dashboard",
    target: "profile-handles",
    title: "Your handles + where tips land",
    body:
      "Each row is a social handle this wallet owns. Lifetime MUSD + tip count are " +
      "pulled live from the subgraph; \"in vault\" shows tips waiting to be claimed. " +
      "Copy a share link with the button on the right.",
    placement: "bottom",
  },
  {
    path: "/dashboard",
    target: "stats-row",
    title: "Your numbers",
    body:
      "Wallet balance + lifetime received come straight from NihRouter on-chain. " +
      "Linked handles is what NihRegistry has for your address.",
    placement: "bottom",
  },
  {
    path: "/dashboard",
    target: "things-to-do",
    title: "Everything tied together",
    body:
      "Each card is a real flow: claim a handle, open a credit line, deposit to Mezo's " +
      "real Stability Pool, mint MUSD via Mezo trove, or stream MUSD. We'll visit a few now.",
    placement: "top",
  },
  {
    path: "/tip",
    target: "tip-form",
    title: "Sending a tip",
    body:
      "Pick platform + username, set the MUSD amount, optionally pay the 0.5% fee in MEZO " +
      "(0.25% instead — half off). The router resolves the handle to a wallet on-chain.",
    placement: "bottom",
  },
  {
    path: "/stream",
    target: "sub-presets",
    title: "Subscribe monthly",
    body:
      "Streams are MUSD-per-second escrows. The 1-month presets here are the Patreon " +
      "use case — pay 5/10/25 MUSD per month and the recipient accrues continuously.",
    placement: "bottom",
  },
  {
    path: "/borrow",
    target: "borrow-howto",
    title: "Borrow against tips",
    body:
      "After you've claimed tips, NihCredit lets you mint up to 60% of that balance as " +
      "fresh MUSD at 1% APR. Same model Mezo uses for BTC collateral, applied to creator " +
      "income.",
    placement: "bottom",
  },
  {
    path: "/trove",
    target: "trove-howto",
    title: "Mint MUSD from BTC",
    body:
      "Need real MUSD without earning tips? Open a Mezo trove via NihTrove — deposit BTC " +
      "as collateral, mint MUSD instantly. Same primitive that powers the tip economy.",
    placement: "bottom",
  },
];

export function Tour() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("tour") === "1";
  const rawStep = Number(params.get("step") ?? "0");
  const stepIndex = Number.isFinite(rawStep)
    ? Math.max(0, Math.min(STEPS.length - 1, Math.floor(rawStep)))
    : 0;
  const step = STEPS[stepIndex];

  const [rect, setRect] = useState<DOMRect | null>(null);

  // Resolve target element + watch for scroll/resize so the card tracks it.
  useLayoutEffect(() => {
    if (!active) return;
    if (pathname !== step.path) return;
    const find = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      // Scroll into view with a top margin so the card has room.
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Wait a frame for the scroll to settle.
      requestAnimationFrame(() => setRect(el.getBoundingClientRect()));
    };
    find();
    const handler = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    // Try again after a beat in case the section hadn't mounted yet.
    const retry = window.setTimeout(find, 350);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
      window.clearTimeout(retry);
    };
  }, [active, pathname, step]);

  // If active but we landed on the wrong path (e.g. step lives on /stream
  // and user is on /dashboard), route to the correct path.
  useEffect(() => {
    if (!active) return;
    if (pathname !== step.path) {
      router.push(`${step.path}?tour=1&step=${stepIndex}`);
    }
  }, [active, pathname, step, stepIndex, router]);

  if (!active) return null;

  function go(next: number) {
    const clamped = Math.max(0, Math.min(STEPS.length - 1, next));
    const nextStep = STEPS[clamped];
    router.push(`${nextStep.path}?tour=1&step=${clamped}`);
  }
  function end() {
    // After finishing the tour, drop the user on the dashboard regardless
    // of which page the last step lived on. Exit on the current page if
    // they're already there.
    router.push(pathname === "/dashboard" ? "/dashboard" : "/dashboard");
  }

  // Layout the card. Default top-right of the target; clamp to viewport.
  const PAD = 16;
  const CARD_W = 340;
  let left = 24;
  let top = 24;
  if (rect) {
    switch (step.placement ?? "bottom") {
      case "top":
        left = Math.min(window.innerWidth - CARD_W - PAD, Math.max(PAD, rect.left));
        top = Math.max(PAD, rect.top - 180);
        break;
      case "bottom":
        left = Math.min(window.innerWidth - CARD_W - PAD, Math.max(PAD, rect.left));
        top = Math.min(window.innerHeight - 200, rect.bottom + 12);
        break;
      case "left":
        left = Math.max(PAD, rect.left - CARD_W - 12);
        top = Math.max(PAD, rect.top);
        break;
      case "right":
        left = Math.min(window.innerWidth - CARD_W - PAD, rect.right + 12);
        top = Math.max(PAD, rect.top);
        break;
    }
  }

  // Pointer arrow geometry — origin at the tooltip card edge nearest the
  // target, tip at the closest edge of the target's bounding rect.
  const PAD_ARROW = 16;
  let arrow: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (rect) {
    const cardCenterX = left + CARD_W / 2;
    const cardCenterY = top + 80;
    const targetCenterX = rect.left + rect.width / 2;
    const targetCenterY = rect.top + rect.height / 2;
    // Tip of the arrow sits just outside the target rect, on the side
    // closest to the card.
    arrow = {
      x1: cardCenterX,
      y1: cardCenterY,
      x2:
        targetCenterX > cardCenterX
          ? rect.left - PAD_ARROW
          : targetCenterX < cardCenterX
            ? rect.right + PAD_ARROW
            : targetCenterX,
      y2:
        targetCenterY > cardCenterY
          ? rect.top - PAD_ARROW
          : targetCenterY < cardCenterY
            ? rect.bottom + PAD_ARROW
            : targetCenterY,
    };
  }

  return (
    <>
      {/* Dim overlay with a cutout so the spotlighted section stays bright. */}
      <div
        onClick={end}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          pointerEvents: "auto",
          background: rect
            ? `radial-gradient(circle at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px, transparent ${Math.max(rect.width, rect.height) * 0.65}px, rgba(0,0,0,.65) ${Math.max(rect.width, rect.height) * 0.95}px)`
            : "rgba(0,0,0,.65)",
          transition: "background .25s ease-out",
        }}
      />

      {/* Bright outline + corner brackets on the target so the user can't
          miss which section the popup is referring to. */}
      {rect && (
        <div
          style={{
            position: "fixed",
            left: rect.left - 8,
            top: rect.top - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            zIndex: 60,
            border: "3.5px solid var(--accent)",
            boxShadow: "0 0 0 3px var(--ink), 0 0 24px rgba(255,211,45,.65)",
            pointerEvents: "none",
            transition: "all .25s ease-out",
          }}
        />
      )}

      {/* Arrow from the card to the target — drawn in a full-viewport
          SVG so it works at any position without per-step config. */}
      {arrow && (
        <svg
          width="100%"
          height="100%"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            pointerEvents: "none",
          }}
        >
          <defs>
            <marker
              id="tour-arrowhead"
              markerWidth="12"
              markerHeight="12"
              refX="6"
              refY="6"
              orient="auto"
            >
              <path d="M0,0 L12,6 L0,12 L3,6 Z" fill="var(--accent)" stroke="var(--ink)" strokeWidth="1" />
            </marker>
          </defs>
          <line
            x1={arrow.x1}
            y1={arrow.y1}
            x2={arrow.x2}
            y2={arrow.y2}
            stroke="var(--accent)"
            strokeWidth="3"
            strokeDasharray="6 4"
            markerEnd="url(#tour-arrowhead)"
          />
        </svg>
      )}

      {/* Tooltip card */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          left,
          top,
          width: CARD_W,
          zIndex: 61,
          background: "var(--paper)",
          color: "var(--ink)",
          border: "3.5px solid var(--ink)",
          boxShadow: "5px 5px 0 0 var(--ink)",
          padding: "14px 16px 12px",
          fontFamily: "var(--font-body)",
        }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="mono"
            style={{ fontSize: 10, letterSpacing: ".12em", color: "var(--ink-3)", textTransform: "uppercase" }}
          >
            tour · {stepIndex + 1} of {STEPS.length}
          </span>
          <button
            onClick={end}
            aria-label="Exit tour"
            style={{ background: "transparent", border: 0, color: "var(--ink-3)", cursor: "pointer" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1.1, marginBottom: 6 }}>
          {step.title}
        </h3>
        <p style={{ fontSize: 13, lineHeight: 1.45, color: "var(--ink-2)", margin: 0 }}>{step.body}</p>
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "2px dashed var(--line-2)" }}>
          <button
            onClick={() => go(stepIndex - 1)}
            disabled={stepIndex === 0}
            style={{
              background: "transparent",
              border: 0,
              color: "var(--ink-3)",
              cursor: stepIndex === 0 ? "not-allowed" : "pointer",
              fontSize: 12,
              opacity: stepIndex === 0 ? 0.4 : 1,
            }}
          >
            Back
          </button>
          {stepIndex < STEPS.length - 1 ? (
            <button
              onClick={() => go(stepIndex + 1)}
              className="comic-btn primary"
              style={{ fontSize: 13, padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              Next <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <button onClick={end} className="comic-btn primary" style={{ fontSize: 13, padding: "6px 14px" }}>
              Finish
            </button>
          )}
        </div>
      </div>
    </>
  );
}
