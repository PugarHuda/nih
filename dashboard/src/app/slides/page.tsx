"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { fetchRecentTips, fetchHandleStats } from "@/lib/goldsky";
import { formatMUSD } from "@/lib/utils";

/**
 * /slides — 5-slide hackathon pitch deck.
 *
 * Keyboard: ←/→ or Space to advance, Esc to exit to home.
 * Mobile: tap left/right halves.
 * URL: `?n=2` jumps to a slide; persists when navigating between slides
 * so deep-linking to a specific slide works for screenshots.
 */
interface LiveStats {
  totalTips: number;
  totalVolume: bigint;
  avgTip: bigint;
  topHandles: { label: string; total: bigint; tips: number }[];
  loaded: boolean;
}

export default function SlidesPage() {
  const [idx, setIdx] = useState(0);
  const [live, setLive] = useState<LiveStats>({
    totalTips: 0,
    totalVolume: 0n,
    avgTip: 0n,
    topHandles: [],
    loaded: false,
  });

  // Pull live numbers from Goldsky once per slide-mount; refresh every
  // 30s. Used by the Demo + Numbers slides.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [tips, stats] = await Promise.all([
        fetchRecentTips(100),
        fetchHandleStats(5),
      ]);
      if (cancelled) return;
      const totalTips = tips.length;
      const totalVolume = tips.reduce((acc, t) => acc + BigInt(t.amount), 0n);
      const avgTip = totalTips > 0 ? totalVolume / BigInt(totalTips) : 0n;
      const KNOWN: Record<string, string> = {
        "0xc0a8544bd367c1f9e4bad8de180be3c96f97d663c4168d837e04c5628c64e77e": "github:PugarHuda",
        "0x3c5b565e32b3a7f627794117bdd3a0292f1e4d225316f4b5b2bae3d08a6ca151": "twitter:EncodeClub",
        "0x876ed16774c41851a77836c6b7c8a73d1c4b8235505742837e791346d9640d75": "twitter:hajislamet",
        "0xe42fad11825c4bb4bc805f9ad53dbde50e93baf1431d09934ba95fe91bf60d91": "twitter:pugarhuda",
        "0x6773975048115fba630eae27d130fa00457470464b1f3b7cbc48b2720e319a51": "twitter:MezoNetwork",
      };
      const topHandles = stats.map((s) => ({
        label: KNOWN[s.handleId.toLowerCase()] ?? `${s.handleId.slice(0, 10)}…`,
        total: BigInt(s.totalReceived),
        tips: Number(s.tipCount),
      }));
      setLive({ totalTips, totalVolume, avgTip, topHandles, loaded: true });
    }
    load();
    const t = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

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

  const slides = useMemo(() => SLIDES(live), [live]);
  const next = useCallback(() => setIdx((i) => Math.min(slides.length - 1, i + 1)), [slides.length]);
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
        setIdx(slides.length - 1);
      } else if (e.key === "Escape") {
        window.location.href = "/";
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const slide = slides[idx];

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
            pitch deck · {idx + 1} / {slides.length}
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
          {slides.map((_, i) => (
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
          disabled={idx === slides.length - 1}
          className="comic-btn primary"
          style={{
            fontSize: 13,
            padding: "6px 12px",
            opacity: idx === slides.length - 1 ? 0.35 : 1,
            cursor: idx === slides.length - 1 ? "not-allowed" : "pointer",
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

function SLIDES(live: LiveStats): Slide[] { return [
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
      <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div>
          <p className="text-base" style={{ color: "var(--ink-2)" }}>
            Browser extension injects a tip button on <b>Twitter, YouTube, GitHub, LinkedIn</b>. One click sends <b>real Mezo MUSD</b> — Bitcoin-backed stable — to the creator&apos;s wallet. Creators borrow against accumulated tips at 1% APR without ever selling their BTC exposure.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            {[
              { h: "Tip", d: "1-click MUSD via extension or /tip. 0.5% fee, 0.25% in MEZO." },
              { h: "Subscribe", d: "Per-second streams (Patreon-style monthly presets) via NihStream." },
              { h: "Borrow", d: "60% LTV credit line at 1% fixed APR against your tip balance." },
              { h: "Earn", d: "Deposit MUSD into the real Mezo Stability Pool — BTC yield." },
            ].map((c) => (
              <div key={c.h} className="comic-card p-3">
                <b className="text-[15px] block" style={{ fontFamily: "var(--font-display)" }}>{c.h}</b>
                <p className="text-[12px] mt-1" style={{ color: "var(--ink-3)" }}>{c.d}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <TwitterMockup />
          <span className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
            extension preview
          </span>
        </div>
      </div>
    ),
  },

  // ───────────────────── 3. Demo / traction
  {
    kicker: "demo · 3 / 5",
    title: "Live on matsnet with real data.",
    body: (
      <div className="space-y-5">
        {/* Live numbers row — refreshed every 30s from Goldsky */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <BigStat label="Total tips" value={live.loaded ? String(live.totalTips) : "…"} />
          <BigStat
            label="Total MUSD volume"
            value={live.loaded ? formatMUSD(live.totalVolume) : "…"}
            unit="MUSD"
            highlight
          />
          <BigStat
            label="Avg tip"
            value={live.loaded ? formatMUSD(live.avgTip) : "…"}
            unit="MUSD"
          />
          <BigStat label="Live subgraph" value="nih/v4" unit="goldsky" />
        </div>
        <div className="grid lg:grid-cols-2 gap-5 items-start">
          <ul className="space-y-2 text-[14px]" style={{ color: "var(--ink-2)" }}>
            <li>📦 <b>10 contracts</b> on Mezo matsnet · 29/29 tests.</li>
            <li>💰 <b>FULL_REAL</b> — every Nih primitive uses real Mezo MUSD (<code className="mono text-[10px]">0xf9BB…0af</code>).</li>
            <li>📊 Goldsky subgraph <b>nih/v4</b> indexing live (numbers above).</li>
            <li>🧩 Plasmo extension (Chrome MV3) on 4 platforms.</li>
            <li>🖥 18 dashboard routes — tip / subscribe / borrow / earn / trove / claim / unlock / tour / profile / leaderboard / docs / slides.</li>
            <li>🤖 AI tip-amount via OpenRouter LLM + Boar mainnet context.</li>
          </ul>
          <div className="comic-card accent p-4">
            <span className="kicker" style={{ opacity: 0.8 }}>try it now</span>
            <ul className="mt-1.5 space-y-1.5 text-[13px]">
              <li>👉 <a className="underline" href="/onboarding">/onboarding</a> — guided tour</li>
              <li>👉 <a className="underline" href="/dashboard">/dashboard</a> — your handles + stats</li>
              <li>👉 <a className="underline" href="/trove">/trove</a> — open BTC trove → mint MUSD</li>
              <li>👉 <a className="underline" href="/unlock">/unlock</a> — MUSD-gated content</li>
              <li>👉 <a className="underline" href="/docs">/docs</a> — developer reference</li>
            </ul>
          </div>
        </div>
        {live.loaded && live.topHandles.length > 0 && (
          <div className="comic-card p-3">
            <span className="kicker">top handles right now</span>
            <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-2">
              {live.topHandles.map((h) => (
                <div
                  key={h.label}
                  className="p-2 text-[11px]"
                  style={{ background: "var(--paper)", border: "2.5px solid var(--ink)" }}
                >
                  <b className="block truncate">{h.label}</b>
                  <span className="mono" style={{ color: "var(--ink-3)" }}>
                    {formatMUSD(h.total)} MUSD · {h.tips} tip{h.tips === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
]; }

// Compact stat box for the live-numbers row.
function BigStat({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        padding: 12,
        background: highlight ? "var(--accent)" : "var(--paper)",
        color: highlight ? "var(--accent-ink)" : "var(--ink)",
        border: "3px solid var(--ink)",
        boxShadow: highlight ? "3px 3px 0 0 var(--ink)" : "2px 2px 0 0 var(--ink)",
      }}
    >
      <p className="kicker" style={{ color: highlight ? "rgba(0,0,0,0.7)" : "var(--ink-3)" }}>
        {label}
      </p>
      <p
        className="tabular mt-1 leading-none"
        style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "inherit" }}
      >
        {value}
      </p>
      {unit && (
        <p className="mono text-[10px] mt-0.5" style={{ color: "inherit", opacity: 0.7 }}>
          {unit}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Twitter mockup — SVG-only so it ships zero assets but still looks
// like a real tweet with the Nih tip button injected under it.
// ─────────────────────────────────────────────────────────────────────
function TwitterMockup() {
  return (
    <svg
      viewBox="0 0 520 280"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", maxWidth: 480, height: "auto" }}
    >
      {/* Card */}
      <rect x="2" y="2" width="516" height="276" rx="14" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="3" />
      {/* Avatar */}
      <circle cx="42" cy="42" r="22" fill="#1DA1F2" stroke="#0A0A0A" strokeWidth="2" />
      <text x="42" y="48" textAnchor="middle" fontSize="20" fontWeight="700" fill="#FFFFFF">V</text>
      {/* Name + handle */}
      <text x="74" y="38" fontSize="14" fontWeight="700" fill="#0A0A0A">Vitalik Buterin</text>
      <text x="74" y="55" fontSize="12" fill="#666">@VitalikButerin · 2h</text>
      {/* Tweet body */}
      <text x="22" y="92" fontSize="13" fill="#0A0A0A">Stable money on Bitcoin rails should feel</text>
      <text x="22" y="111" fontSize="13" fill="#0A0A0A">as effortless as sending a like. We&apos;re</text>
      <text x="22" y="130" fontSize="13" fill="#0A0A0A">closer than ever.</text>
      {/* Reactions row */}
      <text x="22" y="170" fontSize="11" fill="#999">💬 412   🔁 1.8K   ❤ 9.2K</text>
      {/* Nih tip button — comic style with offset shadow */}
      <g transform="translate(22, 195)">
        <rect x="3" y="3" width="160" height="44" fill="#0A0A0A" />
        <rect x="0" y="0" width="160" height="44" fill="#FFD32D" stroke="#0A0A0A" strokeWidth="3" />
        <text x="14" y="29" fontSize="14" fontWeight="700" fill="#0A0A0A">
          N · Tip 5 MUSD ✦
        </text>
      </g>
      {/* Pointing label */}
      <g transform="translate(200, 200)">
        <path d="M0 18 L18 14" stroke="#E03131" strokeWidth="2" fill="none" />
        <text x="24" y="20" fontSize="11" fill="#E03131" fontStyle="italic">
          injected by the Nih extension
        </text>
        <text x="24" y="36" fontSize="11" fill="#E03131" fontStyle="italic">
          on every supported social profile.
        </text>
      </g>
    </svg>
  );
}
