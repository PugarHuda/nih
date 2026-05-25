"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { Send, ExternalLink } from "lucide-react";
import { fetchTipsBySender, lookupHandle, type RecentTip } from "@/lib/goldsky";
import { addresses, routerAbi } from "@/lib/contracts";
import { supporterStatus } from "@/lib/supporter-tier";
import { formatMUSD } from "@/lib/utils";

const EXPLORER = "https://explorer.test.mezo.org";

function relativeTime(ts: string): string {
  const diff = Math.floor(Date.now() / 1000) - Number(ts);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * "Tips you sent" — the tipper's own outgoing history. Answers "where did
 * I tip?". Reads the connected wallet's sent tips from the subgraph and
 * resolves each recipient handle via lookupHandle; links every row to the
 * on-chain transaction.
 */
export function SentTipsCard({ limit = 10 }: { limit?: number }) {
  const { address, isConnected } = useAccount();
  const [tips, setTips] = useState<RecentTip[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!address) {
      setTips([]);
      setLoaded(true);
      return;
    }
    let alive = true;
    setLoaded(false);
    fetchTipsBySender(address, limit)
      .then((t) => alive && setTips(t))
      .catch(() => alive && setTips([]))
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [address, limit]);

  const total = tips.reduce((acc, t) => acc + BigInt(t.amount), 0n);

  // Lifetime tipped, straight from the router — authoritative source for the
  // supporter tier (more complete than the last N tips fetched above).
  const { data: totalSent } = useReadContract({
    address: addresses.Router,
    abi: routerAbi,
    functionName: "totalSent",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const status = supporterStatus(totalSent as bigint | undefined);

  return (
    <div className="comic-card px-5 py-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4" style={{ color: "var(--accent-2)" }} />
          <span className="kicker">Tips you sent</span>
          {status.tier && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5"
              title={`Supporter tier — earned by tipping ${status.sentMusd.toFixed(0)}+ MUSD lifetime`}
              style={{
                background: "var(--paper)",
                border: `2px solid ${status.tier.color}`,
                color: status.tier.color,
                boxShadow: "2px 2px 0 0 var(--ink)",
              }}
            >
              {status.tier.emoji} {status.tier.name} Supporter
            </span>
          )}
        </div>
        {tips.length > 0 && (
          <span className="text-[12px]" style={{ color: "var(--ink-3)" }}>
            {tips.length} tip{tips.length === 1 ? "" : "s"} · {formatMUSD(total)} MUSD total
          </span>
        )}
      </div>
      {isConnected && status.next && (
        <p className="text-[11px] mb-3" style={{ color: "var(--ink-3)" }}>
          {status.tier
            ? `${status.toNext.toFixed(0)} MUSD more to ${status.next.emoji} ${status.next.name} Supporter`
            : `Tip ${Math.max(1, Math.ceil(status.toNext))} MUSD to earn your first ${status.next.emoji} ${status.next.name} Supporter badge`}
        </p>
      )}

      {!isConnected ? (
        <p className="text-sm text-center py-5" style={{ color: "var(--ink-3)" }}>
          Connect your wallet to see where you&apos;ve tipped.
        </p>
      ) : !loaded ? (
        <p className="text-sm text-center py-5" style={{ color: "var(--ink-3)" }}>
          Loading your tip history…
        </p>
      ) : tips.length === 0 ? (
        <p className="text-sm text-center py-5" style={{ color: "var(--ink-3)" }}>
          You haven&apos;t tipped anyone yet. Find a creator and send your first MUSD.
        </p>
      ) : (
        <ul className="space-y-2">
          {tips.map((t) => {
            const handle = lookupHandle(t.handleId);
            const to = handle
              ? `${handle.platform}:${handle.username}`
              : t.handleId.slice(0, 12) + "…";
            return (
              <li
                key={t.id}
                className="flex items-center gap-3 p-2.5"
                style={{
                  background: "var(--paper)",
                  border: "2.5px solid var(--ink)",
                  boxShadow: "2px 2px 0 0 var(--ink)",
                }}
              >
                <span className="text-[13px] flex-1 min-w-0 truncate">
                  to <b className="mono">{to}</b>
                </span>
                <span className="text-sm font-semibold tabular" style={{ color: "var(--accent-2)" }}>
                  {formatMUSD(BigInt(t.amount))} MUSD
                </span>
                <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>
                  {relativeTime(t.timestamp)}
                </span>
                <a
                  href={`${EXPLORER}/tx/${t.txHash ?? t.id.slice(0, 66)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-none hover:opacity-70"
                  title="View transaction"
                  style={{ color: "var(--ink-3)" }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
