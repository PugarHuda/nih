"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchRecentTips, lookupHandle, type RecentTip } from "@/lib/goldsky";
import { formatMUSD, truncateAddress } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

/**
 * Recent-tippers card.
 *
 * "Who tipped me, when, how much, on which handle." Pulled live from
 * the Goldsky subgraph. Most recent first. Shows sender address (link
 * to explorer), amount, target handle (link to public profile), and
 * tx hash (link to explorer).
 *
 * Used on the dashboard so creators can see real tipping activity
 * without going to the leaderboard.
 */
export function RecentTippersCard({ limit = 8 }: { limit?: number }) {
  const [tips, setTips] = useState<RecentTip[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const t = await fetchRecentTips(limit);
      if (!cancelled) setTips(t);
    }
    load();
    const id = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [limit]);

  return (
    <div className="comic-card">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="kicker">recent tips · live</span>
          <h3 className="h3 mt-1">Who&apos;s tipping right now.</h3>
        </div>
        <Link href="/leaderboard" className="text-[12px] underline" style={{ color: "var(--ink-3)" }}>
          full leaderboard
        </Link>
      </div>
      {!tips ? (
        <p className="text-xs muted">loading…</p>
      ) : tips.length === 0 ? (
        <p className="text-xs muted">No tips on matsnet yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {tips.map((t) => {
            const meta = lookupHandle(t.handleId);
            const handleLabel = meta
              ? `@${meta.username} · ${meta.platform}`
              : `${t.handleId.slice(0, 10)}…`;
            const handleHref = meta
              ? `/c/${meta.platform}/${encodeURIComponent(meta.username)}`
              : null;
            const ago = relativeTime(t.timestamp);
            return (
              <li
                key={t.id}
                className="flex items-center gap-2 px-2.5 py-2"
                style={{
                  background: "var(--paper)",
                  border: "2.5px solid var(--ink)",
                  fontSize: 12,
                  color: "var(--ink)",
                }}
              >
                <a
                  href={`https://explorer.test.mezo.org/address/${t.sender.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono"
                  style={{ color: "var(--ink-3)" }}
                  title="Sender wallet"
                >
                  {truncateAddress(t.sender.address)}
                </a>
                <span style={{ color: "var(--ink-3)" }}>→</span>
                {handleHref ? (
                  <Link href={handleHref} className="truncate" style={{ color: "var(--ink)" }}>
                    {handleLabel}
                  </Link>
                ) : (
                  <span className="truncate">{handleLabel}</span>
                )}
                <b
                  className="tabular ml-auto"
                  style={{ fontFamily: "var(--font-display)", color: "var(--accent-2)" }}
                >
                  {formatMUSD(BigInt(t.amount))} MUSD
                </b>
                <span className="mono" style={{ color: "var(--ink-3)", fontSize: 10 }}>
                  {ago}
                </span>
                <a
                  href={`https://explorer.test.mezo.org/tx/${t.id.slice(0, 66)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View tx on explorer"
                  style={{ color: "var(--ink-3)" }}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function relativeTime(unixSeconds: string): string {
  const t = Number(unixSeconds);
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - t);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
