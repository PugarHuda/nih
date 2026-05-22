"use client";

import { Header } from "@/components/header";

/**
 * <ComicPage> — standard comic-style page chrome.
 * Page-level kicker + h1 + tagline, then your content below.
 * Use width="narrow" for forms, "wide" for dashboards.
 */
export function ComicPage({
  kicker,
  title,
  tagline,
  width = "narrow",
  children,
  badge,
}: {
  kicker?: string;
  title: string;
  tagline?: string;
  width?: "narrow" | "wide";
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const maxW = width === "wide" ? "max-w-6xl" : "max-w-2xl";
  return (
    <>
      <Header />
      <main className={`container mx-auto px-6 py-12 ${maxW}`}>
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            {kicker && <span className="kicker">{kicker}</span>}
            <h1 className="h1 mt-2" style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}>
              {title}
            </h1>
            {tagline && (
              <p className="mt-3 text-base" style={{ color: "var(--ink-3)" }}>
                {tagline}
              </p>
            )}
          </div>
          {badge && <div className="flex-none">{badge}</div>}
        </div>
        {children}
      </main>
    </>
  );
}

/** Inline kicker + h3 block used at the top of each comic-card section. */
export function ComicSectionHead({
  kicker,
  title,
  hint,
}: {
  kicker?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      {kicker && <span className="kicker">{kicker}</span>}
      <h3 className="h3 mt-1.5">{title}</h3>
      {hint && (
        <p className="text-sm mt-1" style={{ color: "var(--ink-3)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

/** Comic SFX badge — small starburst with custom label. */
export function Sfx({
  children,
  rotate = -3,
  color = "var(--accent-2)",
  inkColor = "var(--paper)",
}: {
  children: React.ReactNode;
  rotate?: number;
  color?: string;
  inkColor?: string;
}) {
  return (
    <span
      className="sfx"
      style={{
        background: color,
        color: inkColor,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {children}
    </span>
  );
}

/** Handwritten note — Caveat font, optionally tilted. */
export function Note({
  children,
  rotate = -3,
  color = "var(--accent-2)",
  className,
  style,
}: {
  children: React.ReactNode;
  rotate?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`note ${className ?? ""}`}
      style={{
        display: "inline-block",
        transform: `rotate(${rotate}deg)`,
        color,
        fontFamily: "Caveat, cursive",
        fontSize: 18,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
