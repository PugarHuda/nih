"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";

/**
 * /slides — 5-slide hackathon pitch deck.
 *
 * Keyboard: ←/→ or Space to advance, Esc to exit to home.
 * Mobile: tap left/right halves.
 * URL: `?n=2` jumps to a slide; persists when navigating between slides
 * so deep-linking to a specific slide works for screenshots.
 */
export default function SlidesPage() {
  const [idx, setIdx] = useState(0);

  // Read initial slide from URL once.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const n = Number(new URLSearchParams(window.location.search).get("n"));
    if (Number.isFinite(n) && n >= 1 && n <= 5) setIdx(n - 1);
  }, []);

  // Mirror current slide into URL (no router push — replaceState).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("n", String(idx + 1));
    window.history.replaceState(null, "", url.toString());
  }, [idx]);

  const next = useCallback(() => setIdx((i) => Math.min(SLIDES.length - 1, i + 1)), []);
  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);

  // Keyboard nav.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") {
        setIdx(0);
      } else if (e.key === "End") {
        setIdx(SLIDES.length - 1);
      } else if (e.key === "Escape") {
        window.location.href = "/";
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const slide = SLIDES[idx];

  return (
    <main
      data-no-sparkle
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-6 py-3"
        style={{ borderBottom: "3.5px solid var(--ink)", background: "var(--paper)" }}
      >
        <Link href="/" className="flex items-center gap-3">
          <img src="/assets/logo.svg" alt="Nih" style={{ height: 28, width: "auto" }} />
        </Link>
        <div className="flex items-center gap-3">
          <span
            className="mono text-[11px] uppercase tracking-[.12em]"
            style={{ color: "var(--ink-3)" }}
          >
            pitch deck · {idx + 1} / {SLIDES.length}
          </span>
          <Link
            href="/dashboard"
            className="comic-btn primary"
            style={{ fontSize: 12, padding: "5px 12px" }}
          >
            Open the app →
          </Link>
        </div>
      </header>

      {/* Slide content area */}
      <section
        className="flex-1 flex items-center justify-center px-4 sm:px-10 py-6 relative"
        onClick={(e) => {
          // Tap left half = prev, right half = next (mobile).
          if ((e.target as HTMLElement).closest("a,button,input")) return;
          const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
          if (x < e.currentTarget.clientWidth / 2) prev();
          else next();
        }}
      >
        <article
          key={idx} // remount → re-fire fade-in animation per slide
          className="comic-card w-full max-w-5xl p-6 sm:p-10 fade-up"
          style={{ minHeight: 480 }}
        >
          <span className="kicker">{slide.kicker}</span>
          <h1
            className="h1 mt-2"
            style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1 }}
          >
            {slide.title}
          </h1>
          <div className="mt-6 sm:mt-8">{slide.body}</div>
        </article>
      </section>

      {/* Footer controls + indicator */}
      <footer
        className="flex items-center justify-between gap-4 px-6 py-4"
        style={{ borderTop: "3.5px solid var(--ink)", background: "var(--paper)" }}
      >
        <button
          onClick={prev}
          disabled={idx === 0}
          className="comic-btn"
          style={{
            fontSize: 13,
            padding: "6px 12px",
            opacity: idx === 0 ? 0.35 : 1,
            cursor: idx === 0 ? "not-allowed" : "pointer",
          }}
        >
          <ArrowLeft className="h-4 w-4" /> prev
        </button>

        {/* Slide indicator dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === idx ? 28 : 12,
                height: 12,
                border: "2.5px solid var(--ink)",
                background: i === idx ? "var(--accent)" : "var(--paper)",
                cursor: "pointer",
                transition: "width .2s ease-out, background .15s",
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={idx === SLIDES.length - 1}
          className="comic-btn primary"
          style={{
            fontSize: 13,
            padding: "6px 12px",
            opacity: idx === SLIDES.length - 1 ? 0.35 : 1,
            cursor: idx === SLIDES.length - 1 ? "not-allowed" : "pointer",
          }}
        >
          next <ArrowRight className="h-4 w-4" />
        </button>
      </footer>

      <p
        className="mono text-[10px] text-center pb-3"
        style={{ color: "var(--ink-3)" }}
      >
        keyboard: ← → space · esc to exit · tap halves on mobile
      </p>
    </main>
  );
}

interface Slide {
  kicker: string;
  title: string;
  body: React.ReactNode;
}

const SLIDES: Slide[] = [
  // ───────────────────── 1. Problem
  {
    kicker: "the problem · 1 / 5",
    title: "Tipping in Bitcoin is too painful to use.",
    body: (
      <div className="grid sm:grid-cols-2 gap-6">
        <ul className="space-y-3 text-base" style={{ color: "var(--ink-2)" }}>
          <li><b>BTC is volatile.</b> Sending ↑$5 of Bitcoin to a creator who tips back in a week of price moves is a coin-flip.</li>
          <li><b>Lightning UX is brutal.</b> Channels, liquidity, custodial wallets — most tippers give up.</li>
          <li><b>Patreon takes 5–10%.</b> Custodial. Platform-locked. Slow payouts.</li>
          <li><b>X native Bitcoin tip</b> = same as above, twitter-only, Lightning gotchas inherited.</li>
        </ul>
        <div
          className="comic-card ink p-5 self-start"
          style={{ transform: "rotate(-1.2deg)" }}
        >
          <span className="kicker" style={{ opacity: 0.7 }}>the gap</span>
          <p className="text-base mt-2 leading-snug">
            No tipping tool today gives creators <b>stable</b>, <b>Bitcoin-backed</b> money <b>cross-platform</b> with <b>self-custody</b>, then turns that income into <b>composable credit</b>.
          </p>
        </div>
      </div>
    ),
  },

  // ───────────────────── 2. Solution
  {
    kicker: "the solution · 2 / 5",
    title: "Nih — tip MUSD anywhere on the web.",
    body: (
      <div className="space-y-6">
        <p className="text-lg max-w-3xl" style={{ color: "var(--ink-2)" }}>
          A browser extension injects a tip button on Twitter, YouTube, GitHub, and LinkedIn. One click sends <b>real Mezo MUSD</b> — Bitcoin-backed stable — to the creator&apos;s wallet. Creators can borrow against accumulated tips at 1% APR without ever selling their BTC exposure.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { h: "Tip", d: "1-click MUSD via extension or /tip. 0.5% fee — half off if paid in MEZO." },
            { h: "Subscribe", d: "Per-second streams (Patreon-style monthly presets) via NihStream." },
            { h: "Borrow", d: "60% LTV credit line at 1% fixed APR against your tip balance." },
            { h: "Earn", d: "Deposit MUSD into the real Mezo Stability Pool — BTC yield from liquidations." },
          ].map((c) => (
            <div key={c.h} className="comic-card p-4">
              <b className="h3 block">{c.h}</b>
              <p className="text-[13px] mt-1.5" style={{ color: "var(--ink-3)" }}>{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ───────────────────── 3. Demo / traction
  {
    kicker: "demo · 3 / 5",
    title: "Live on matsnet with real data.",
    body: (
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <ul className="space-y-3 text-base" style={{ color: "var(--ink-2)" }}>
          <li>📦 <b>10 contracts</b> live on Mezo matsnet · 29/29 tests passing.</li>
          <li>💰 <b>FULL_REAL mode</b> — all Nih primitives use real Mezo MUSD (<code className="mono text-[11px]">0xf9BB…0af</code>).</li>
          <li>📊 <b>Goldsky subgraph nih/v4</b> — 8 seeded real-MUSD tips already indexed.</li>
          <li>🧩 <b>Plasmo extension</b> (Chrome MV3) — Twitter, YouTube, GitHub, LinkedIn.</li>
          <li>🖥 <b>16-route dashboard</b>: tip, subscribe, borrow, earn, claim, unlock paywall, interactive tour, public profile, leaderboard, dev docs.</li>
          <li>🤖 <b>AI tip-amount suggestion</b> via OpenRouter LLM + Boar Network on-chain context.</li>
        </ul>
        <div className="comic-card accent p-5">
          <span className="kicker" style={{ opacity: 0.8 }}>try it now</span>
          <ul className="mt-2 space-y-2 text-sm">
            <li>👉 <a className="underline" href="/onboarding">/onboarding</a> — interactive product tour</li>
            <li>👉 <a className="underline" href="/dashboard">/dashboard</a> — your handles + balances</li>
            <li>👉 <a className="underline" href="/c/twitter/hajislamet">/c/twitter/hajislamet</a> — public profile</li>
            <li>👉 <a className="underline" href="/unlock">/unlock</a> — MUSD-gated content demo</li>
            <li>👉 <a className="underline" href="/docs">/docs</a> — developer reference</li>
          </ul>
        </div>
      </div>
    ),
  },

  // ───────────────────── 4. Tech / partners
  {
    kicker: "tech · 4 / 5",
    title: "Built on real Mezo primitives + 6 partners.",
    body: (
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="comic-card p-5">
          <span className="kicker">real Mezo wraps</span>
          <ul className="mt-2 space-y-1.5 text-[13px] mono">
            <li>NihRouter / Vault / Credit / Stream → <b>real MUSD</b></li>
            <li>NihEarn → <b>Mezo StabilityPool</b></li>
            <li>NihTrove → <b>Mezo BorrowerOperations</b></li>
            <li>NihRegistry → handle → wallet attestation tiers</li>
          </ul>
        </div>
        <div className="comic-card p-5">
          <span className="kicker">bonus prizes claimed</span>
          <ul className="mt-2 space-y-1.5 text-[13px]">
            <li>✅ <b>Goldsky</b> — nih/v4 subgraph live</li>
            <li>✅ <b>Spectrum Nodes</b> — 3 GraphQL endpoints wired, <code className="mono text-[11px]">/api/spectrum-stats</code></li>
            <li>✅ <b>Boar Network</b> — Mezo mainnet RPC inside AI agent</li>
            <li>✅ <b>OpenRouter</b> — LLM aggregator powering /api/suggest</li>
            <li>✅ <b>Tenderly</b> — simulator deep-link in every tx-toast</li>
            <li>✅ <b>Validation Cloud</b> — mainnet plan RPC</li>
          </ul>
        </div>
        <div className="comic-card ink p-5 lg:col-span-2">
          <span className="kicker" style={{ opacity: 0.7 }}>cross-track integration</span>
          <p className="text-sm mt-2">
            Touches all 3 Mezo tracks: <b>Supernormal dApps (MUSD)</b> as the primary tip currency, <b>Bank on Bitcoin</b> via NihCredit + NihTrove, <b>MEZO Utilization</b> via fee-discount path.
          </p>
        </div>
      </div>
    ),
  },

  // ───────────────────── 5. Ask
  {
    kicker: "ask · 5 / 5",
    title: "Bitcoin spendable. Creators bankable.",
    body: (
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        <div>
          <p className="text-lg mb-5" style={{ color: "var(--ink-2)" }}>
            We&apos;re asking for the <b>$5K veMEZO First Place (MUSD Track)</b> plus
            a milestone grant for mainnet deployment with the first 100
            verified creators within 90 days.
          </p>
          <ul className="space-y-2 text-sm" style={{ color: "var(--ink-2)" }}>
            <li>📚 docs: <a className="underline" href="/docs">/docs</a></li>
            <li>🎬 walkthrough: <a className="underline" href="/onboarding">/onboarding</a></li>
            <li>🌐 live: <a className="underline" href="https://nih-seven.vercel.app" target="_blank" rel="noopener noreferrer">nih-seven.vercel.app <ExternalLink className="inline h-3 w-3" /></a></li>
            <li>💻 source: <a className="underline" href="https://github.com/PugarHuda/nih" target="_blank" rel="noopener noreferrer">github.com/PugarHuda/nih <ExternalLink className="inline h-3 w-3" /></a></li>
            <li>👤 builder: <b>Pugar Huda Mantoro</b> — solo + Claude Code</li>
          </ul>
        </div>
        <div
          className="comic-card accent p-5"
          style={{ transform: "rotate(1.5deg)" }}
        >
          <span className="kicker" style={{ opacity: 0.8 }}>tagline</span>
          <p className="text-xl mt-2 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            &quot;Nih&quot; — Indonesian for &ldquo;here you go.&rdquo;
            The casual hand-off, made on-chain.
          </p>
          <Link
            href="/dashboard"
            className="comic-btn primary mt-4 inline-flex"
            style={{ fontSize: 14, padding: "8px 16px" }}
          >
            Open the app →
          </Link>
        </div>
      </div>
    ),
  },
];
