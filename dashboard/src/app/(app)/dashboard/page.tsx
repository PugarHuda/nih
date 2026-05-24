"use client";

import { useAccount, useReadContract } from "wagmi";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { addresses, erc20Abi, routerAbi, registryAbi } from "@/lib/contracts";
import { formatMUSD } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import {
  TipDropBanner,
  ActivityHeatmap,
  TopTippersCard,
  PlatformDonut,
  MilestoneCard,
} from "@/components/comic";
import { ProfileHandlesCard } from "@/components/profile-handles-card";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  const { data: musdBalance } = useReadContract({
    address: addresses.MUSD,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: totalReceived } = useReadContract({
    address: addresses.Router,
    abi: routerAbi,
    functionName: "totalReceived",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: handles } = useReadContract({
    address: addresses.Registry,
    abi: registryAbi,
    functionName: "handlesOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const handleCount = (handles as `0x${string}`[] | undefined)?.length ?? 0;
  const balance = formatMUSD((musdBalance as bigint) ?? 0n);
  const received = formatMUSD((totalReceived as bigint) ?? 0n);

  return (
    <>
      <Header />
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="fade-up">
          <span className="kicker">creator dashboard</span>
          <h1 className="h1 mt-2 mb-2">
            {isConnected ? "Welcome back." : "Sign in to see your tips."}
          </h1>
          <p className="text-base mb-8" style={{ color: "var(--ink-3)" }}>
            Receive tips, borrow against them, and never sell your Bitcoin.
          </p>
        </div>

        {/* Live tip-drop banner — POW! comic notification */}
        <div data-tour="tip-banner">
          <TipDropBanner />
        </div>

        {/* Big stat row — wallet balance + lifetime + handles */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6" data-tour="stats-row">
          <ComicStat label="Wallet balance" value={`${balance} MUSD`} note={isConnected ? undefined : "connect wallet"} highlight />
          <ComicStat label="Lifetime tips received" value={`${received} MUSD`} note={`since you joined Nih`} />
          <ComicStat label="Linked handles" value={`${handleCount}`} note={`of 9 supported platforms`} />
        </div>

        {/* Your profile — same data as the /c/[platform]/[username] public
            page, inline so the user doesn't have to click through to see
            their handle stats. */}
        <div className="mb-6">
          <ProfileHandlesCard />
        </div>

        {/* Main grid — left big charts, right side cards */}
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
          <div className="flex flex-col gap-5">
            {/* Activity heatmap */}
            <div className="comic-card">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <span className="kicker">activity · last 7 days</span>
                  <h3 className="h3 mt-1.5">When tips arrive.</h3>
                </div>
                <div className="text-right">
                  <div className="tabular" style={{ fontFamily: "var(--font-display)", fontSize: 32, lineHeight: 1 }}>
                    +63 <span style={{ fontSize: 14, color: "var(--ink-3)" }}>MUSD</span>
                  </div>
                  <div className="mono muted text-[11px] mt-1">↑ 27% vs last week · 18 tips</div>
                </div>
              </div>
              <ActivityHeatmap />
              <span
                className="note"
                style={{
                  position: "absolute",
                  bottom: 18,
                  right: 18,
                  transform: "rotate(-4deg)",
                  color: "var(--accent-2)",
                  fontSize: 18,
                }}
              >
                nights peak!
              </span>
            </div>

            {/* Recent action grid */}
            <div className="comic-card" data-tour="things-to-do">
              <span className="kicker">things to do</span>
              <h3 className="h3 mt-1.5 mb-4">Make your tips work.</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <ComicAction
                  title="Verify your handle"
                  desc="Claim parked tips waiting in the on-chain vault."
                  href="/claim"
                />
                <ComicAction title="Open a credit line" desc="Borrow MUSD against your tips at 1% APR." href="/borrow" hot />
                <ComicAction title="Earn from idle MUSD" desc="Deposit into the real Mezo Stability Pool." href="/earn" />
                <ComicAction title="Stream payroll" desc="Per-second MUSD streams, Sablier-style." href="/stream" />
              </div>
            </div>

            {/* Public profile card */}
            <div className="comic-card ink">
              <span className="kicker" style={{ color: "rgba(255,255,255,.55)" }}>
                your public profile
              </span>
              <h3 className="h3 mt-1.5" style={{ color: "var(--paper)" }}>
                nih.app/@{handleCount > 0 ? "you" : "creator"}
              </h3>
              <p className="text-[13px] leading-snug mt-2" style={{ color: "rgba(255,255,255,.7)" }}>
                Drop this link anywhere. We render OG cards for X, Discord and Slack.
              </p>
              <div className="flex gap-2 mt-3.5">
                <Link
                  href="/c/twitter/hajislamet"
                  className="comic-btn primary"
                  style={{ fontSize: 14, padding: "8px 14px" }}
                >
                  Preview <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={address ? `https://explorer.test.mezo.org/address/${address}` : "/c/twitter/hajislamet"}
                  className="comic-btn"
                  style={{
                    fontSize: 14,
                    padding: "8px 14px",
                    background: "transparent",
                    color: "var(--paper)",
                    borderColor: "rgba(255,255,255,.3)",
                    boxShadow: "4px 4px 0 0 rgba(255,255,255,.2)",
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on explorer
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <MilestoneCard target={100} />
            <TopTippersCard />
            <PlatformDonut />
          </div>
        </div>
      </main>
    </>
  );
}

function ComicStat({
  label,
  value,
  note,
  highlight,
}: {
  label: string;
  value: string;
  note?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`comic-card ${highlight ? "" : ""}`}>
      <span className="kicker">{label}</span>
      <div className="tabular mt-2.5" style={{ fontFamily: "var(--font-display)", fontSize: 36, lineHeight: 1 }}>
        {value}
      </div>
      {note && <div className="mono muted text-[11px] mt-2">{note}</div>}
    </div>
  );
}

function ComicAction({
  title,
  desc,
  href,
  hot,
}: {
  title: string;
  desc: string;
  href: string;
  hot?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block"
      style={{
        padding: "14px 16px",
        background: hot ? "var(--accent)" : "var(--bg-2)",
        color: hot ? "var(--accent-ink)" : "var(--ink)",
        border: "var(--border-w) var(--border-style) var(--line)",
        boxShadow: "4px 4px 0 0 var(--ink)",
        textDecoration: "none",
        transition: "transform .08s, box-shadow .08s",
      }}
    >
      <div className="flex items-center justify-between">
        <b className="text-[15px]">{title}</b>
        <ArrowUpRight className="h-4 w-4" />
      </div>
      <div className="text-[12px] opacity-80 mt-1.5 leading-snug">{desc}</div>
    </Link>
  );
}
