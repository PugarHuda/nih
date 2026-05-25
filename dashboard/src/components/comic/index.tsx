"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import {
  fetchRecentTips,
  fetchHandleStats,
  lookupHandle,
  type RecentTip,
  type HandleStat,
} from "@/lib/goldsky";
import { addresses, routerAbi } from "@/lib/contracts";
import { formatMUSD, truncateAddress } from "@/lib/utils";
import { useTipperLabels } from "@/lib/use-tipper-labels";

// Shared polling hook so multiple comic widgets share one Goldsky timer.
function useNihStats(intervalMs = 15_000) {
  const [tips, setTips] = useState<RecentTip[]>([]);
  const [handleStats, setHandleStats] = useState<HandleStat[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [t, h] = await Promise.all([fetchRecentTips(20), fetchHandleStats(10)]);
      if (!cancelled) {
        setTips(t);
        setHandleStats(h);
        setLoaded(true);
      }
    }
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return { tips, handleStats, loaded };
}

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

const PLATFORM_COLOR: Record<string, string> = {
  twitter: "#1DA1F2",
  github: "#6E40C9",
  youtube: "#E03131",
  substack: "#FF6719",
  medium: "#1A8917",
  reddit: "#FF4500",
  hn: "#FF6600",
  twitch: "#9146FF",
  linkedin: "#0A66C2",
  other: "#888888",
};

function relativeTime(unixSeconds: string): string {
  const t = Number(unixSeconds);
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - t);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ name }: { name: string }) {
  const safe = (name || "??").slice(0, 2);
  const initials = (safe[0] + (safe[1] ?? "")).toUpperCase();
  const colors = ["#FFD32D", "#2B7CE9", "#E03131", "#1F8A3A"];
  let code = 0;
  for (let i = 0; i < name.length; i++) code = (code + name.charCodeAt(i)) >>> 0;
  const color = colors[code % colors.length];
  return (
    <span
      style={{
        width: 32,
        height: 32,
        background: color,
        border: "3px solid var(--ink)",
        boxShadow: "2px 2px 0 0 var(--ink)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontSize: 13,
        color: "var(--ink)",
        flex: "0 0 auto",
      }}
    >
      {initials}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// TipDropBanner — rotates real tips from the subgraph every 6.5s.
// ─────────────────────────────────────────────────────────────────
export function TipDropBanner() {
  const { tips, loaded } = useNihStats();
  const { label: tipperLabel } = useTipperLabels();
  const [idx, setIdx] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    if (tips.length === 0) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % tips.length);
      setFadeKey((k) => k + 1);
    }, 6500);
    return () => clearInterval(id);
  }, [tips.length]);

  if (!loaded) return null;
  if (tips.length === 0) {
    return (
      <div className="mb-6">
        <div className="comic-card flex items-center gap-4 px-5 py-3">
          <span className="sfx flex-none">...</span>
          <div className="flex-1 min-w-0 text-sm opacity-70">
            No tips on matsnet yet. Be the first — head to <code className="mono text-xs">/tip</code>.
          </div>
        </div>
      </div>
    );
  }

  const tip = tips[idx % tips.length];
  const handle = lookupHandle(tip.handleId);
  const platform = handle?.platform ?? "other";
  const platformLabel = handle ? (PLATFORM_LABEL[platform] ?? platform) : "an unregistered handle";
  const handleLabel = handle ? `@${handle.username}` : tip.handleId.slice(0, 10) + "…";
  // Resolve the tipper's wallet → their registered handle when we know it,
  // so the ticker reads "twitter:bob tipped" instead of a raw 0x address.
  const sender = tipperLabel(tip.sender.address);
  const senderLabel = sender ? `${sender.platform}:${sender.username}` : truncateAddress(tip.sender.address);

  return (
    <div className="mb-6 overflow-hidden">
      <div
        key={fadeKey}
        className="comic-card accent flex items-center gap-4 px-5 py-3"
        style={{ animation: "nih-pop .35s cubic-bezier(.2,.7,.2,1)" }}
      >
        <span className="sfx flex-none">NIH!</span>
        <Avatar name={handle?.username ?? "??"} />
        <div className="flex-1 min-w-0">
          <b className="text-sm">
            <code className="mono text-xs opacity-80">{senderLabel}</code>
            {" tipped "}
            <span className="tabular">{formatMUSD(BigInt(tip.amount))}</span> MUSD to {handleLabel} on{" "}
            {platformLabel}
          </b>
          <div className="text-xs opacity-75 truncate">
            tx <code className="mono text-[10px]">{tip.id.slice(0, 18)}…</code>
          </div>
        </div>
        <span className="mono text-[11px] opacity-60">{relativeTime(tip.timestamp)}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ActivityHeatmap — 7×6 grid of real tip volume bucketed by
// (day-of-week, 4-hour band). Empty cells render with low opacity.
// ─────────────────────────────────────────────────────────────────

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const BANDS = ["00–04", "04–08", "08–12", "12–16", "16–20", "20–24"];

export function ActivityHeatmap() {
  const { tips, loaded } = useNihStats();

  const cells = useMemo(() => {
    const grid: number[][] = DAYS.map(() => BANDS.map(() => 0));
    for (const tip of tips) {
      const d = new Date(Number(tip.timestamp) * 1000);
      const dow = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
      const band = Math.min(BANDS.length - 1, Math.floor(d.getUTCHours() / 4));
      grid[dow][band] += 1;
    }
    return grid;
  }, [tips]);

  const max = useMemo(() => {
    let m = 0;
    for (const row of cells) for (const v of row) if (v > m) m = v;
    return m;
  }, [cells]);

  return (
    <div>
      <div className="grid grid-cols-[52px_1fr] gap-2 items-center">
        <div />
        <div
          className="mono text-[9px] tracking-[.05em] text-[color:var(--ink-3)] mb-1"
          style={{ display: "grid", gridTemplateColumns: `repeat(${BANDS.length}, 1fr)`, gap: 4 }}
        >
          {BANDS.map((b) => (
            <span key={b} className="text-center">{b}</span>
          ))}
        </div>
        {DAYS.map((d, di) => (
          <div key={d} className="contents">
            <div className="mono text-[10px] tracking-[.1em] text-[color:var(--ink-3)]">{d}</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${BANDS.length}, 1fr)`, gap: 4 }}>
              {cells[di].map((v, bi) => (
                <div
                  key={bi}
                  style={{
                    height: 22,
                    background: v === 0 ? "var(--bg-2)" : "var(--accent)",
                    opacity: v === 0 ? 0.4 : Math.min(1, 0.4 + (max > 0 ? (v / max) * 0.6 : 0)),
                    border: "var(--border-w) var(--border-style) var(--line-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: max > 0 && v / max >= 0.6 ? "var(--accent-ink)" : "var(--ink-2)",
                    fontWeight: max > 0 && v / max >= 0.6 ? 700 : 400,
                  }}
                >
                  {v > 0 ? v : ""}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 text-[11px] mono text-[color:var(--ink-3)]">
        <span>{loaded ? `${tips.length} tip${tips.length === 1 ? "" : "s"} indexed` : "loading…"}</span>
        <div className="flex items-center gap-2">
          <span>less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
            <span
              key={i}
              style={{
                width: 14,
                height: 14,
                background: v === 0 ? "var(--bg-2)" : "var(--accent)",
                opacity: v === 0 ? 0.4 : 0.4 + v * 0.6,
                border: "var(--border-w) var(--border-style) var(--line-2)",
              }}
            />
          ))}
          <span>more</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TopTippersCard — top recipient handles by MUSD received (real
// handleStats). We label "top recipients" since one seeded sender means
// the more honest signal is which handles attracted the most volume.
// ─────────────────────────────────────────────────────────────────

export function TopTippersCard() {
  const { handleStats, loaded } = useNihStats();

  const top = handleStats.slice(0, 5).map((h) => {
    const meta = lookupHandle(h.handleId);
    return {
      key: h.handleId,
      name: meta ? `${meta.platform}:${meta.username}` : `${h.handleId.slice(0, 10)}…`,
      amount: BigInt(h.totalReceived),
      tipCount: Number(h.tipCount),
      avatarSeed: meta?.username ?? h.handleId,
    };
  });

  const max = top[0]?.amount ?? 1n;

  return (
    <div className="comic-card">
      <span className="kicker">top recipients · all-time</span>
      <h3 className="h3 mt-1.5 mb-3">Who gets the love.</h3>
      {!loaded ? (
        <div className="text-xs muted">loading…</div>
      ) : top.length === 0 ? (
        <div className="text-xs muted">No tips on matsnet yet.</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {top.map((t, i) => (
            <div key={t.key} className="flex items-center gap-2.5">
              <span className="mono muted w-[18px] text-[11px]">0{i + 1}</span>
              <Avatar name={t.avatarSeed} />
              <div className="flex-1 min-w-0">
                <b className="text-[13px] truncate">{t.name}</b>
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
                      width: `${max > 0n ? Number((t.amount * 100n) / max) : 0}%`,
                      height: "100%",
                      background: "var(--accent)",
                    }}
                  />
                </div>
              </div>
              <div className="text-right flex-none">
                <b className="tabular text-[13px]">{formatMUSD(t.amount)}</b>
                <div className="muted mono text-[10px]">
                  {t.tipCount} tip{t.tipCount === 1 ? "" : "s"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PlatformDonut — distribution of indexed handle volume across
// platforms. Unknown handleIds collapse to "other".
// ─────────────────────────────────────────────────────────────────

export function PlatformDonut() {
  const { handleStats, loaded } = useNihStats();

  const platforms = useMemo(() => {
    const totals = new Map<string, bigint>();
    for (const h of handleStats) {
      const meta = lookupHandle(h.handleId);
      const platform = meta?.platform ?? "other";
      totals.set(platform, (totals.get(platform) ?? 0n) + BigInt(h.totalReceived));
    }
    return [...totals.entries()]
      .map(([platform, amount]) => ({
        platform,
        label: PLATFORM_LABEL[platform] ?? platform,
        amount,
        color: PLATFORM_COLOR[platform] ?? PLATFORM_COLOR.other,
      }))
      .sort((a, b) => Number(b.amount - a.amount));
  }, [handleStats]);

  const total = platforms.reduce((s, d) => s + d.amount, 0n);
  const R = 56;
  const CX = 80;
  const CY = 80;
  const STROKE = 22;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="comic-card">
      <span className="kicker">platform mix · all-time</span>
      <h3 className="h3 mt-1.5 mb-3">Where you earn.</h3>
      {!loaded ? (
        <div className="text-xs muted">loading…</div>
      ) : platforms.length === 0 ? (
        <div className="text-xs muted">No platform data yet.</div>
      ) : (
        <div className="flex items-center gap-4">
          <svg width="160" height="160" viewBox="0 0 160 160" className="flex-none">
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--bg-2)" strokeWidth={STROKE} />
            {platforms.map((d) => {
              const arcLen = total > 0n ? (Number(d.amount) / Number(total)) * C : 0;
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
            <text x={CX} y={CY - 2} textAnchor="middle"
              style={{ fontFamily: "var(--font-display)", fontSize: 22, fill: "var(--ink)" }}>
              {formatMUSD(total)}
            </text>
            <text x={CX} y={CY + 16} textAnchor="middle"
              style={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--ink-3)", letterSpacing: ".08em" }}>
              MUSD · ALL
            </text>
          </svg>
          <div className="flex-1 min-w-0">
            {platforms.map((d) => (
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
                <b className="tabular">{formatMUSD(d.amount)}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MilestoneCard — connected wallet's lifetime MUSD received toward
// a 100 MUSD verified-earner badge, pulled live from NihRouter.
// ─────────────────────────────────────────────────────────────────

export function MilestoneCard({ target = 100 }: { target?: number }) {
  const { address, isConnected } = useAccount();

  const { data: totalReceivedRaw } = useReadContract({
    address: addresses.Router,
    abi: routerAbi,
    functionName: "totalReceived",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const received = (totalReceivedRaw as bigint | undefined) ?? 0n;
  const targetWei = BigInt(target) * 10n ** 18n;
  const pct = isConnected && targetWei > 0n
    ? Math.min(100, Number((received * 100n) / targetWei))
    : 0;
  const remaining = targetWei > received ? targetWei - received : 0n;

  return (
    <div className="comic-card accent relative overflow-hidden">
      <span className="kicker" style={{ color: "currentColor", opacity: 0.7 }}>
        milestone · lifetime
      </span>
      <div className="flex items-baseline gap-2 mt-1.5">
        <span className="tabular" style={{ fontFamily: "var(--font-display)", fontSize: 44, lineHeight: 1 }}>
          {formatMUSD(received)}
        </span>
        <span className="text-lg opacity-70">/ {target} MUSD</span>
      </div>
      <p className="text-[13px] leading-snug my-2 opacity-80">
        Receive {target} MUSD lifetime → unlock the verified-earner badge.
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
          {isConnected ? `${formatMUSD(remaining)} MUSD to go` : "connect wallet to track"}
        </span>
      </div>
    </div>
  );
}
