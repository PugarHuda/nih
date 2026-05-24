"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { ArrowRight, ShieldCheck, Copy } from "lucide-react";
import { addresses, registryAbi, vaultAbi } from "@/lib/contracts";
import { createPublicClient, http } from "viem";
import { matsnet } from "@/lib/chain";
import { lookupHandle, fetchHandleStats, type HandleStat } from "@/lib/goldsky";
import { formatMUSD } from "@/lib/utils";
import { PLATFORM_LABELS, type Platform } from "@/lib/handle-utils";

/**
 * Your-profile card — the same data the public profile page shows, but
 * rendered inline on the dashboard. Lists every handle the connected
 * wallet has registered on NihRegistry, with per-handle lifetime
 * received + pending vault balance + a "View public page" link.
 */

const client = createPublicClient({
  chain: matsnet,
  transport: http(),
});

interface HandleRow {
  handleId: string;
  platform: Platform | null;
  username: string;
  lifetime: bigint;
  tipCount: number;
  pending: bigint;
}

export function ProfileHandlesCard() {
  const { address, isConnected } = useAccount();
  const [rows, setRows] = useState<HandleRow[] | null>(null);

  const { data: handles } = useReadContract({
    address: addresses.Registry,
    abi: registryAbi,
    functionName: "handlesOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });

  useEffect(() => {
    if (!isConnected || !handles) {
      setRows(null);
      return;
    }
    const ids = (handles as `0x${string}`[] | undefined) ?? [];
    if (ids.length === 0) {
      setRows([]);
      return;
    }
    let cancelled = false;

    (async () => {
      const stats: HandleStat[] = await fetchHandleStats(50);
      const statByHandle = new Map<string, HandleStat>();
      for (const s of stats) statByHandle.set(s.handleId.toLowerCase(), s);

      const rowsOut: HandleRow[] = [];
      for (const id of ids) {
        const meta = lookupHandle(id);
        let pending = 0n;
        try {
          pending = (await client.readContract({
            address: addresses.Vault,
            abi: vaultAbi,
            functionName: "pendingFor",
            args: [id],
          })) as bigint;
        } catch { /* tolerate RPC blips */ }
        const stat = statByHandle.get(id.toLowerCase());
        rowsOut.push({
          handleId: id,
          platform: (meta?.platform as Platform | undefined) ?? null,
          username: meta?.username ?? id.slice(0, 10) + "…",
          lifetime: stat ? BigInt(stat.totalReceived) : 0n,
          tipCount: stat ? Number(stat.tipCount) : 0,
          pending,
        });
      }
      if (!cancelled) setRows(rowsOut);
    })();

    return () => {
      cancelled = true;
    };
  }, [isConnected, handles]);

  if (!isConnected) {
    return (
      <div className="comic-card">
        <span className="kicker">your profile</span>
        <h3 className="h3 mt-1.5 mb-1">Connect to see your handles.</h3>
        <p className="text-[13px] leading-snug" style={{ color: "var(--ink-3)" }}>
          Once you connect a wallet that has registered handles, they'll show
          up here with their lifetime tip totals.
        </p>
      </div>
    );
  }

  if (rows === null) {
    return (
      <div className="comic-card">
        <span className="kicker">your profile</span>
        <h3 className="h3 mt-1.5 mb-1">Loading…</h3>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="comic-card">
        <span className="kicker">your profile</span>
        <h3 className="h3 mt-1.5 mb-1">No handles registered yet.</h3>
        <p className="text-[13px] leading-snug" style={{ color: "var(--ink-3)" }}>
          Verify a social handle to claim tips that arrive in your name.
          We support twitter, youtube, github, linkedin.
        </p>
        <div className="mt-3">
          <Link href="/claim">
            <button className="comic-btn primary" style={{ fontSize: 13, padding: "6px 14px" }}>
              Claim a handle <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="comic-card">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="kicker">handles owned by your wallet · {rows.length}</span>
          <h3 className="h3 mt-1.5">Where the tips land.</h3>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-3)" }}>
            One wallet can own multiple handles (e.g. a creator with X + GitHub + LinkedIn).
            All five seeded handles below resolve to this demo wallet for the hackathon walk-through.
          </p>
        </div>
        <Link href="/claim" className="text-[12px] underline" style={{ color: "var(--ink-3)" }}>
          claim another
        </Link>
      </div>

      <ul className="grid sm:grid-cols-2 gap-2.5">
        {rows.map((r) => {
          const platformLabel = r.platform ? PLATFORM_LABELS[r.platform].name : "unknown";
          const platformIcon = r.platform ? PLATFORM_LABELS[r.platform].icon : "•";
          const publicHref = r.platform ? `/c/${r.platform}/${encodeURIComponent(r.username)}` : null;
          const shareUrl = publicHref ? `https://nih-seven.vercel.app${publicHref}` : null;
          return (
            <li
              key={r.handleId}
              className="px-3 py-2.5 flex items-center gap-2.5"
              style={{
                background: "var(--paper)",
                border: "3px solid var(--ink)",
                boxShadow: "2px 2px 0 0 var(--ink)",
                minHeight: 56,
              }}
            >
              <span
                className="flex-none flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--accent)",
                  color: "var(--ink)",
                  border: "2.5px solid var(--ink)",
                  fontFamily: "var(--font-display)",
                  fontSize: 14,
                }}
                title={platformLabel}
              >
                {platformIcon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 truncate">
                  <b className="text-[13px] truncate" style={{ color: "var(--ink)" }}>
                    @{r.username}
                  </b>
                  <ShieldCheck className="h-3 w-3 flex-none" style={{ color: "var(--good)" }} />
                </div>
                <div className="flex items-center gap-2 mt-0.5 mono text-[10px]" style={{ color: "var(--ink-3)" }}>
                  <span className="tabular">
                    <b style={{ color: "var(--ink)" }}>{formatMUSD(r.lifetime)}</b> MUSD · {r.tipCount} tip{r.tipCount === 1 ? "" : "s"}
                  </span>
                  {r.pending > 0n && (
                    <Link
                      href="/claim"
                      className="underline"
                      style={{ color: "var(--accent-2)" }}
                    >
                      claim {formatMUSD(r.pending)}
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-none">
                {publicHref && (
                  <Link
                    href={publicHref}
                    title="Open public profile"
                    className="px-2 py-1 mono text-[10px] uppercase tracking-wider"
                    style={{
                      border: "2px solid var(--ink)",
                      background: "var(--paper)",
                      color: "var(--ink)",
                    }}
                  >
                    view
                  </Link>
                )}
                {shareUrl && (
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        const { toast } = await import("sonner");
                        toast.success("Profile link copied", {
                          description: shareUrl,
                          duration: 4000,
                        });
                      } catch {
                        /* ignore */
                      }
                    }}
                    title="Copy share link"
                    className="px-2 py-1"
                    style={{
                      border: "2px solid var(--ink)",
                      background: "var(--accent)",
                      color: "var(--ink)",
                      cursor: "pointer",
                    }}
                    aria-label="Copy share link"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
