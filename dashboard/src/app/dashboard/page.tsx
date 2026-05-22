"use client";

import { useAccount, useReadContract } from "wagmi";
import { motion } from "framer-motion";
import Link from "next/link";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addresses, erc20Abi, routerAbi, registryAbi } from "@/lib/contracts";
import { formatMUSD } from "@/lib/utils";
import { ArrowUpRight, Banknote, Inbox, Sparkles } from "lucide-react";

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

  if (!isConnected) {
    return (
      <>
        <Header />
        <main className="container py-24 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Connect to see your dashboard</CardTitle>
              <CardDescription>
                Your tips, your credit line, your registered handles — all in one place.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container py-12 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Creator dashboard</h1>
          <p className="text-muted mb-10">
            Receive tips, borrow against them, and never sell your Bitcoin.
          </p>
        </motion.div>

        {/* Top stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <StatCard
            label="MUSD balance"
            value={`${formatMUSD((musdBalance as bigint) ?? 0n)} MUSD`}
            icon={<Banknote className="h-5 w-5" />}
            color="text-accent"
          />
          <StatCard
            label="Lifetime tips received"
            value={`${formatMUSD((totalReceived as bigint) ?? 0n)} MUSD`}
            icon={<Inbox className="h-5 w-5" />}
            color="text-brand"
          />
          <StatCard
            label="Linked handles"
            value={`${(handles as `0x${string}`[] | undefined)?.length ?? 0}`}
            icon={<Sparkles className="h-5 w-5" />}
            color="text-fg"
          />
        </div>

        {/* Action grid */}
        <div className="grid md:grid-cols-2 gap-5">
          <ActionCard
            title="Borrow against your tips"
            desc="Lock claimed tips as collateral; mint up to 60% as MUSD instantly. Repay anytime."
            cta="Open credit line"
            href="/borrow"
            highlight
          />
          <ActionCard
            title="Claim unclaimed tips"
            desc="People may have tipped you before you registered. Verify your handle to claim."
            cta="Go to claim"
            href="/claim"
          />
          <ActionCard
            title="Link a new platform"
            desc="Connect Twitter, YouTube, GitHub, Substack — one wallet, every platform."
            cta="Add handle"
            href="/link"
          />
          <ActionCard
            title="View on explorer"
            desc="See all your on-chain activity, tips, and credit positions on Mezo Explorer."
            cta="Open explorer"
            href={`https://explorer.test.mezo.org/address/${address}`}
            external
          />
        </div>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-widest text-muted">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

function ActionCard({
  title,
  desc,
  cta,
  href,
  highlight,
  external,
}: {
  title: string;
  desc: string;
  cta: string;
  href: string;
  highlight?: boolean;
  external?: boolean;
}) {
  return (
    <Card className={highlight ? "border-brand/40" : ""}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <div className="pt-2">
        {external ? (
          <Button variant={highlight ? "default" : "outline"} asChild>
            <a href={href} target="_blank" rel="noopener noreferrer">
              {cta} <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
        ) : (
          <Button variant={highlight ? "default" : "outline"} asChild>
            <Link href={href}>
              {cta} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
