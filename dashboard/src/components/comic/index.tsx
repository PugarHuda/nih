"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────
// TipDropBanner — live "tip just landed" notification (POW!)
// Rotates through a feed every 6.5s with a slide-in animation.
// ─────────────────────────────────────────────────────────────────

interface FeedItem {
  from: string;
  amount: number;
  platform: string;
  note: string;
}

const DEFAULT_FEED: FeedItem[] = [
  { from: "alice", amount: 5, platform: "twitter", note: "thank you for the thread" },
  { from: "mira", amount: 12, platform: "twitter", note: "this drawing made my day" },
  { from: "jun", amount: 25, platform: "github", note: "fix landed, you saved my week" },
  { from: "lin", amount: 50, platform: "github", note: "sponsoring the v2 release" },
  { from: "sam", amount: 1, platform: "twitter", note: "good post" },
  { from: "dee", amount: 10, platform: "substack", note: "consistently great writing" },
];

const PLATFORM_LABEL: Record<string, string> = {
  twitter: "X",
  github: "GitHub",
  youtube: "YouTube",
  substack: "Substack",
  medium: "Medium",
  reddit: "Reddit",
  hn: "Hacker News",
  twitch: "Twitch",
  linkedin: "LinkedIn",
};

export function TipDropBanner({ feed = DEFAULT_FEED }: { feed?: FeedItem[] }) {
  const [idx, setIdx] = useState(0);
  // CSS-driven fade — avoids framer-motion AnimatePresence quirks with
  // React 19 concurrent renders.
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % feed.length);
      setFadeKey((k) => k + 1);
    }, 6500);
    return () => clearInterval(t);
  }, [feed.length]);

  const tip = feed[idx] ?? feed[0];
  if (!tip) return null;

  return (
    <div className="mb-6 overflow-hidden">
      <div
        key={fadeKey}
        className="comic-card accent flex items-center gap-4 px-5 py-3"
        style={{ animation: "nih-pop .35s cubic-bezier(.2,.7,.2,1)" }}
      >
        <span className="sfx flex-none">NIH!</span>
        <Avatar name={tip.from} />
        <div className="flex-1 min-w-0">
          <b className="text-sm">
            {tip.from} tipped you <span className="tabular">{tip.amount}</span> MUSD on{" "}
            {PLATFORM_LABEL[tip.platform] ?? tip.platform}
          </b>
          <div className="text-xs opacity-75 truncate">&ldquo;{tip.note}&rdquo;</div>
        </div>
        <span className="mono text-[11px] opacity-60">just now</span>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const safe = (name || "??").slice(0, 2);
  const initials = (safe[0] + (safe[1] ?? "")).toUpperCase();
  const colors = ["#FFD32D", "#2B7CE9", "#E03131", "#1F8A3A"];
  const code = safe.charCodeAt(0) || 0;
  const color = colors[code % colors.length];
  return (
    <span
      style={{
        width: 36,
        height: 36,
        background: color,
        border: "3.5px solid var(--ink)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontSize: 14,
        color: "var(--ink)",
        flex: "0 0 auto",
      }}
    >
      {initials}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// ActivityHeatmap — 7×6 grid (day × time band) of tip volume.
// ─────────────────────────────────────────────────────────────────

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const BANDS = ["00–04", "04–08", "08–12", "12–16", "16–20", "20–24"];
const CELLS = [
  [0, 0, 1, 1, 2, 3],
  [0, 1, 2, 1, 3, 4],
  [1, 0, 1, 2, 2, 2],
  [0, 1, 1, 3, 2, 4],
  [1, 1, 2, 2, 3, 4],
  [2, 2, 1, 2, 3, 4],
  [1, 1, 1, 2, 4, 3],
];

export function ActivityHeatmap() {
  return (
    <div>
      <div className="grid grid-cols-[52px_1fr] gap-2 items-center">
        <div />
        <div
          className="mono text-[9px] tracking-[.05em] text-[color:var(--ink-3)] mb-1"
          style={{ display: "grid", gridTemplateColumns: `repeat(${BANDS.length}, 1fr)`, gap: 4 }}
        >
          {BANDS.map((b) => (
            <span key={b} className="text-center">
              {b}
            </span>
          ))}
        </div>
        {DAYS.map((d, di) => (
          <div key={d} className="contents">
            <div className="mono text-[10px] tracking-[.1em] text-[color:var(--ink-3)]">{d}</div>
            <div
              style={{ display: "grid", gridTemplateColumns: `repeat(${BANDS.length}, 1fr)`, gap: 4 }}
            >
              {CELLS[di].map((v, bi) => (
                <div
                  key={bi}
                  style={{
                    height: 22,
                    background: v === 0 ? "var(--bg-2)" : "var(--accent)",
                    opacity: v === 0 ? 0.4 : (v / 4) * 0.6 + 0.4,
                    border: "var(--border-w) var(--border-style) var(--line-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: v >= 3 ? "var(--accent-ink)" : "var(--ink-2)",
                    fontWeight: v >= 3 ? 700 : 400,
                  }}
                >
                  {v > 0 ? v : ""}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-3 text-[11px] mono text-[color:var(--ink-3)]">
        <span>less</span>
        {[0, 1, 2, 3, 4].map((v) => (
          <span
            key={v}
            style={{
              width: 14,
              height: 14,
              background: v === 0 ? "var(--bg-2)" : "var(--accent)",
              opacity: v === 0 ? 0.4 : (v / 4) * 0.6 + 0.4,
              border: "var(--border-w) var(--border-style) var(--line-2)",
            }}
          />
        ))}
        <span>more</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TopTippersCard — ranked list with bars
// ─────────────────────────────────────────────────────────────────

const TIPPERS = [
  { name: "mira", amount: 78, tips: 14 },
  { name: "lin", amount: 64, tips: 9 },
  { name: "jun", amount: 48, tips: 7 },
  { name: "alicewrites", amount: 32, tips: 5 },
  { name: "dee", amount: 22, tips: 4 },
];

export function TopTippersCard() {
  const max = TIPPERS[0].amount;
  return (
    <div className="comic-card">
      <span className="kicker">top tippers · this month</span>
      <h3 className="h3 mt-1.5 mb-3">Who keeps showing up.</h3>
      <div className="flex flex-col gap-2.5">
        {TIPPERS.map((t, i) => (
          <div key={t.name} className="flex items-center gap-2.5">
            <span className="mono muted w-[18px] text-[11px]">0{i + 1}</span>
            <Avatar name={t.name} />
            <div className="flex-1 min-w-0">
              <b className="text-[13px]">{t.name}</b>
              <div
                className="mt-1 overflow-hidden"
                style={{
                  height: 4,
                  background: "var(--bg-2)",
                  border: "var(--border-w) var(--border-style) var(--line-2)",
                }}
              >
                <div
                  style={{
                    width: `${(t.amount / max) * 100}%`,
                    height: "100%",
                    background: "var(--accent)",
                  }}
                />
              </div>
            </div>
            <div className="text-right flex-none">
              <b className="tabular text-[13px]">{t.amount}</b>
              <div className="muted mono text-[10px]">{t.tips} tips</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PlatformDonut — distribution of tip volume across platforms
// ─────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { platform: "twitter", label: "X", amount: 312, color: "#1DA1F2" },
  { platform: "github", label: "GitHub", amount: 142, color: "#6E40C9" },
  { platform: "substack", label: "Substack", amount: 38, color: "#FF6719" },
  { platform: "medium", label: "Medium", amount: 18, color: "#1A8917" },
  { platform: "hn", label: "Hacker News", amount: 12, color: "#FF6600" },
];

export function PlatformDonut() {
  const total = PLATFORMS.reduce((s, d) => s + d.amount, 0);
  const R = 56;
  const CX = 80;
  const CY = 80;
  const STROKE = 22;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="comic-card">
      <span className="kicker">platform mix · 30d</span>
      <h3 className="h3 mt-1.5 mb-3">Where you earn.</h3>
      <div className="flex items-center gap-4">
        <svg width="160" height="160" viewBox="0 0 160 160" className="flex-none">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--bg-2)" strokeWidth={STROKE} />
          {PLATFORMS.map((d) => {
            const arcLen = (d.amount / total) * C;
            const el = (
              <circle
                key={d.platform}
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke={d.color}
                strokeWidth={STROKE}
                strokeDasharray={`${arcLen} ${C - arcLen}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${CX} ${CY})`}
              />
            );
            offset += arcLen;
            return el;
          })}
          <text
            x={CX}
            y={CY - 2}
            textAnchor="middle"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fill: "var(--ink)",
            }}
          >
            {total}
          </text>
          <text
            x={CX}
            y={CY + 16}
            textAnchor="middle"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fill: "var(--ink-3)",
              letterSpacing: ".08em",
            }}
          >
            MUSD · 30D
          </text>
        </svg>
        <div className="flex-1 min-w-0">
          {PLATFORMS.map((d) => (
            <div key={d.platform} className="flex items-center gap-2 py-1 text-xs">
              <span
                style={{
                  width: 10,
                  height: 10,
                  background: d.color,
                  border: "var(--border-w) var(--border-style) var(--line-2)",
                  flex: "0 0 auto",
                }}
              />
              <span className="flex-1">{d.label}</span>
              <b className="tabular">{d.amount}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MilestoneCard — monthly tip-count goal with progress bar
// ─────────────────────────────────────────────────────────────────

export function MilestoneCard({ current = 68, target = 100 }: { current?: number; target?: number }) {
  const pct = Math.min(100, (current / target) * 100);
  return (
    <div className="comic-card accent relative overflow-hidden">
      <span className="kicker" style={{ color: "currentColor", opacity: 0.7 }}>
        milestone · this month
      </span>
      <div className="flex items-baseline gap-2 mt-1.5">
        <span
          className="tabular"
          style={{ fontFamily: "var(--font-display)", fontSize: 44, lineHeight: 1 }}
        >
          {current}
        </span>
        <span className="text-lg opacity-70">/ {target} tips</span>
      </div>
      <p className="text-[13px] leading-snug my-2 opacity-80">
        Hit {target} this month → unlock a verified badge on your profile.
      </p>
      <div
        style={{
          height: 12,
          background: "rgba(0,0,0,.15)",
          border: "var(--border-w) var(--border-style) var(--line)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "var(--ink)",
            transition: "width .8s cubic-bezier(.2,.7,.2,1)",
          }}
        />
      </div>
      <div className="flex items-center justify-between mt-2 mono text-[11px] opacity-70">
        <span>{pct.toFixed(0)}% there</span>
        <span>
          {target - current} to go · 12 days left
        </span>
      </div>
    </div>
  );
}
