"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { ExternalLink, ArrowRight, ShieldCheck } from "lucide-react";
import { addresses, registryAbi, vaultAbi } from "@/lib/contracts";
import { createPublicClient, http } from "viem";
import { matsnet } from "@/lib/chain";
import { lookupHandle, fetchHandleStats, type HandleStat } from "@/lib/goldsky";
import { formatMUSD } from "@/lib/utils";
import { profileUrl, PLATFORM_LABELS, type Platform } from "@/lib/handle-utils";

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
          We support 9 platforms.
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
          <span className="kicker">your profile · {rows.length} handle{rows.length === 1 ? "" : "s"}</span>
          <h3 className="h3 mt-1.5">Where the tips land.</h3>
        </div>
        <Link href="/claim" className="text-[12px] underline" style={{ color: "var(--ink-3)" }}>
          claim another
        </Link>
      </div>

      <ul className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const platformLabel = r.platform ? PLATFORM_LABELS[r.platform].name : "unknown";
          const platformIcon = r.platform ? PLATFORM_LABELS[r.platform].icon : "•";
          const publicHref = r.platform ? `/c/${r.platform}/${encodeURIComponent(r.username)}` : null;
          const externalHref = r.platform ? profileUrl(r.platform, r.username) : null;
          return (
            <li
              key={r.handleId}
              className="p-3 flex flex-col sm:flex-row sm:items-center gap-3"
              style={{
                background: "var(--paper)",
                border: "3px solid var(--ink)",
                boxShadow: "3px 3px 0 0 var(--ink)",
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span
                  className="flex-none flex items-center justify-center"
                  style={{
                    width: 36,
                    height: 36,
                    background: "var(--accent)",
                    color: "var(--ink)",
                    border: "3px solid var(--ink)",
                    fontFamily: "var(--font-display)",
                    fontSize: 16,
                  }}
                >
                  {platformIcon}
                </span>
                <div className="min-w-0">
                  <b className="text-[14px] truncate">@{r.username}</b>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="mono text-[10px] uppercase tracking-wider"
                      style={{ color: "var(--ink-3)" }}
                    >
                      {platformLabel}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 mono text-[10px] uppercase tracking-wider"
                      style={{ color: "var(--good)" }}
                    >
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 text-right sm:min-w-[240px]">
                <div>
                  <div className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
                    lifetime
                  </div>
                  <div className="tabular text-[14px]" style={{ fontFamily: "var(--font-display)" }}>
                    {formatMUSD(r.lifetime)} MUSD
                  </div>
                  <div className="mono text-[10px]" style={{ color: "var(--ink-3)" }}>
                    {r.tipCount} tip{r.tipCount === 1 ? "" : "s"}
                  </div>
                </div>
                <div>
                  <div className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
                    in vault
                  </div>
                  <div
                    className="tabular text-[14px]"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: r.pending > 0n ? "var(--accent-2)" : "var(--ink)",
                    }}
                  >
                    {formatMUSD(r.pending)} MUSD
                  </div>
                  {r.pending > 0n && (
                    <Link href="/claim" className="mono text-[10px] underline" style={{ color: "var(--accent-2)" }}>
                      claim now
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-none">
                {publicHref && (
                  <Link href={publicHref}>
                    <button
                      className="comic-btn"
                      style={{ fontSize: 12, padding: "5px 10px" }}
                      title="Public profile page"
                    >
                      public
                    </button>
                  </Link>
                )}
                {externalHref && (
                  <a
                    href={externalHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open on ${platformLabel}`}
                    style={{ color: "var(--ink-3)" }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
