"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { ExternalLink, ArrowRight } from "lucide-react";
import {
  fetchRecentTips,
  fetchTipsBySender,
  lookupHandle,
  type RecentTip,
} from "@/lib/goldsky";
import { addresses, routerAbi } from "@/lib/contracts";
import { useTipperLabels } from "@/lib/use-tipper-labels";
import { supporterStatus } from "@/lib/supporter-tier";
import { formatMUSD, truncateAddress } from "@/lib/utils";

const EXPLORER = "https://explorer.test.mezo.org";
const ROWS = 6;

type Tab = "everyone" | "you";

/**
 * One compact, calm tip-activity feed — replaces the old stacked
 * RecentTippers + SentTips cards (which showed near-identical data in the
 * demo, since the connected wallet is the only tipper). A single card with
 * an Everyone / You toggle: lighter hairline rows, one line each, capped at
 * a handful with a link to the full leaderboard. The You tab also surfaces
 * the wallet's supporter tier.
 */
export function TipActivityCard() {
  const { address, isConnected } = useAccount();
  const { label: tipperLabel } = useTipperLabels();
  const [tab, setTab] = useState<Tab>("everyone");
  const [everyone, setEveryone] = useState<RecentTip[] | null>(null);
  const [mine, setMine] = useState<RecentTip[] | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const all = await fetchRecentTips(ROWS);
      if (alive) setEveryone(all);
    };
    load();
    const id = setInterval(load, 20_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!address) {
      setMine([]);
      return;
    }
    let alive = true;
    fetchTipsBySender(address, ROWS)
      .then((t) => alive && setMine(t))
      .catch(() => alive && setMine([]));
    return () => {
      alive = false;
    };
  }, [address]);

  const { data: totalSent } = useReadContract({
    address: addresses.Router,
    abi: routerAbi,
    functionName: "totalSent",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const status = supporterStatus(totalSent as bigint | undefined);

  const rows = tab === "everyone" ? everyone : mine;
  const loading = rows === null;

  // Resolve a tip's recipient to "@handle" (known handleId) → sender's owned
  // handle → short handleId. Keeps raw hashes out of the happy path.
  function recipientLabel(t: RecentTip) {
    const known = lookupHandle(t.handleId);
    if (known) return { text: `@${known.username}`, href: `/c/${known.platform}/${encodeURIComponent(known.username)}` };
    return { text: t.handleId.slice(0, 6) + "…" + t.handleId.slice(-4), href: null as string | null };
  }

  return (
    <div className="comic-card">
      {/* Header: title + tab toggle + leaderboard link */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="kicker">tip activity · live</span>
          <div className="flex gap-1">
            {(["everyone", "you"] as const).map((tb) => (
              <button
                key={tb}
                type="button"
                onClick={() => setTab(tb)}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-md transition"
                style={{
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  background: tab === tb ? "var(--ink)" : "transparent",
                  color: tab === tb ? "var(--paper)" : "var(--ink-3)",
                  border: "2px solid var(--ink)",
                }}
              >
                {tb === "everyone" ? "Everyone" : "You"}
              </button>
            ))}
          </div>
        </div>
        <Link href="/leaderboard" className="text-[12px] hover:underline" style={{ color: "var(--ink-3)" }}>
          full leaderboard →
        </Link>
      </div>

      {/* You tab: supporter tier + lifetime sent */}
      {tab === "you" && isConnected && status.tier && (
        <div className="flex items-center gap-2 mb-2 text-[12px]">
          <span
            className="inline-flex items-center gap-1 font-semibold px-2 py-0.5"
            style={{ border: `2px solid ${status.tier.color}`, color: status.tier.color }}
          >
            {status.tier.emoji} {status.tier.name} Supporter
          </span>
          <span style={{ color: "var(--ink-3)" }}>
            {formatMUSD((totalSent as bigint) ?? 0n)} MUSD tipped
            {status.next ? ` · ${status.toNext.toFixed(0)} to ${status.next.name}` : ""}
          </span>
        </div>
      )}

      {loading ? (
        <p className="text-xs py-4 text-center" style={{ color: "var(--ink-3)" }}>loading…</p>
      ) : rows!.length === 0 ? (
        <p className="text-xs py-4 text-center" style={{ color: "var(--ink-3)" }}>
          {tab === "you"
            ? isConnected
              ? "You haven't tipped yet."
              : "Connect your wallet to see your tips."
            : "No tips on matsnet yet."}
        </p>
      ) : (
        <ul>
          {rows!.map((t, i) => {
            const rcpt = recipientLabel(t);
            const sender = tipperLabel(t.sender.address);
            const senderText = sender ? `${sender.platform}:${sender.username}` : truncateAddress(t.sender.address);
            return (
              <li
                key={t.id}
                className="flex items-center gap-2 py-2 text-[13px]"
                style={{ borderTop: i === 0 ? "none" : "1px solid rgba(10,10,10,0.08)" }}
              >
                {/* Everyone shows sender→recipient; You shows just the recipient. */}
                {tab === "everyone" && (
                  <>
                    <span className="mono truncate" style={{ color: "var(--ink-3)", maxWidth: "30%" }}>
                      {senderText}
                    </span>
                    <ArrowRight className="h-3 w-3 flex-none" style={{ color: "var(--ink-3)" }} />
                  </>
                )}
                {rcpt.href ? (
                  <Link href={rcpt.href} className="truncate font-medium hover:underline" style={{ color: "var(--ink)" }}>
                    {rcpt.text}
                  </Link>
                ) : (
                  <span className="mono truncate" style={{ color: "var(--ink-2)" }}>{rcpt.text}</span>
                )}
                <b className="tabular ml-auto flex-none" style={{ fontFamily: "var(--font-display)", color: "var(--accent-2)" }}>
                  {formatMUSD(BigInt(t.amount))}
                </b>
                <span className="mono flex-none" style={{ color: "var(--ink-3)", fontSize: 10, minWidth: 28, textAlign: "right" }}>
                  {relativeTime(t.timestamp)}
                </span>
                <a
                  href={`${EXPLORER}/tx/${t.txHash ?? t.id.slice(0, 66)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View tx"
                  className="flex-none hover:opacity-70"
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
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - Number(unixSeconds));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
