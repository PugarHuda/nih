"use client";

import { useEffect } from "react";

/**
 * Tiny cursor-sparkle effect. On every click anywhere in the (app)
 * route group, spawn 3-5 little accent-colored stars that float up
 * + fade. Matches the marketing landing's `wireCursor` vibe without
 * loading landing.js into the app bundle.
 *
 * Skipped if `prefers-reduced-motion` or if the click target opted
 * out via `data-no-sparkle` (e.g. inputs, tour overlay).
 */
export function ClickSparkle() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest("input, textarea, select, [data-no-sparkle]")) return;
      spawn(e.clientX, e.clientY);
    }
    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}

function spawn(x: number, y: number) {
  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "nih-spark";
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 14 + Math.random() * 24;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 12; // bias upward
    Object.assign(el.style, {
      position: "fixed",
      left: `${x}px`,
      top: `${y}px`,
      pointerEvents: "none",
      zIndex: "70",
      width: "8px",
      height: "8px",
      background: i % 2 === 0 ? "var(--accent, #FFD32D)" : "var(--accent-2, #E03131)",
      border: "1.5px solid var(--ink, #0A0A0A)",
      transform: `translate(-50%, -50%)`,
      transition: "transform .55s cubic-bezier(.2,.7,.2,1), opacity .55s ease-out",
    } as Partial<CSSStyleDeclaration>);
    document.body.appendChild(el);
    // Trigger transition on next frame.
    requestAnimationFrame(() => {
      el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.6) rotate(${
        (Math.random() - 0.5) * 90
      }deg)`;
      el.style.opacity = "0";
    });
    window.setTimeout(() => el.remove(), 700);
  }
}
