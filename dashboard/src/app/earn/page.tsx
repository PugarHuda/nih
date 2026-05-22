"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, formatEther, maxUint256 } from "viem";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addresses, erc20Abi, earnAbi, mezoPrimitives } from "@/lib/contracts";
import { formatMUSD } from "@/lib/utils";
import { useRequireChain } from "@/lib/use-require-chain";
import { Loader2, TrendingUp, Sparkles, ExternalLink } from "lucide-react";

export default function EarnPage() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState<"none" | "approve" | "deposit" | "withdraw">("none");
  const { writeContractAsync } = useWriteContract();
  const { ensure } = useRequireChain();

  const { data: musdBalance } = useReadContract({
    address: addresses.MUSD,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: earnBalance, refetch: refetchEarn } = useReadContract({
    address: addresses.Earn,
    abi: earnAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: userShares, refetch: refetchShares } = useReadContract({
    address: addresses.Earn,
    abi: earnAbi,
    functionName: "userShares",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: totalAssets } = useReadContract({
    address: addresses.Earn,
    abi: earnAbi,
    functionName: "totalAssets",
  });
  const { data: principal } = useReadContract({
    address: addresses.Earn,
    abi: earnAbi,
    functionName: "depositedPrincipal",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: addresses.MUSD,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, addresses.Earn] : undefined,
    query: { enabled: !!address },
  });

  const amountWei = amount ? parseEther(amount) : 0n;
  const needsApproval = ((allowance as bigint | undefined) ?? 0n) < amountWei;

  async function deposit() {
    if (amountWei === 0n) return;
    if (!(await ensure())) return;
    try {
      if (needsApproval) {
        setPending("approve");
        await writeContractAsync({ address: addresses.MUSD, abi: erc20Abi, functionName: "approve", args: [addresses.Earn, maxUint256] });
        await refetchAllowance();
      }
      setPending("deposit");
      await writeContractAsync({ address: addresses.Earn, abi: earnAbi, functionName: "deposit", args: [amountWei] });
      toast.success(`Deposited ${amount} MUSD into Mezo Stability Pool`);
      setAmount("");
      await Promise.all([refetchEarn(), refetchShares()]);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending("none");
    }
  }

  async function withdrawAll() {
    if (!(await ensure())) return;
    const shares = (userShares as bigint | undefined) ?? 0n;
    if (shares === 0n) return;
    setPending("withdraw");
    try {
      await writeContractAsync({ address: addresses.Earn, abi: earnAbi, functionName: "withdraw", args: [shares] });
      toast.success("Withdrawn from Stability Pool");
      await Promise.all([refetchEarn(), refetchShares()]);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending("none");
    }
  }

  const earned = ((earnBalance as bigint | undefined) ?? 0n) - ((principal as bigint | undefined) ?? 0n);

  return (
    <>
      <Header />
      <main className="container max-w-2xl py-12">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs text-brand mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Real Mezo yield
          </div>
          <h1 className="h1 mb-2" style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}>Earn on your tips</h1>
          <p className="mb-8 max-w-md" style={{ color: "var(--ink-3)" }}>
            Deposit tip income directly into Mezo&apos;s MUSD Stability Pool. You earn
            BTC from every liquidation + MUSD from redemption fees. Pure pass-through —
            Nih takes no fee. Withdraw any time.
          </p>
        </motion.div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your position</CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs">
              Powered by Mezo StabilityPool
              <a
                href={`https://explorer.test.mezo.org/address/${mezoPrimitives.StabilityPool}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline inline-flex items-center gap-0.5"
              >
                view on explorer <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Stat label="Your balance" value={`${formatMUSD((earnBalance as bigint | undefined) ?? 0n)} MUSD`} />
            <Stat label="Lifetime earned" value={`${formatMUSD(earned > 0n ? earned : 0n)} MUSD`} highlight />
            <Stat label="Principal in" value={`${formatMUSD((principal as bigint | undefined) ?? 0n)} MUSD`} />
            <Stat label="Pool TVL via Nih" value={`${formatMUSD((totalAssets as bigint | undefined) ?? 0n)} MUSD`} />
          </div>
        </Card>

        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect to deposit</CardTitle>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Deposit MUSD</CardTitle>
              <CardDescription>You hold {formatMUSD((musdBalance as bigint | undefined) ?? 0n)} MUSD.</CardDescription>
            </CardHeader>
            <div className="space-y-4 pt-2">
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" />
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={deposit} disabled={amountWei === 0n || pending !== "none"}>
                  {pending === "approve" ? <><Loader2 className="h-4 w-4 animate-spin" /> Approving…</> :
                   pending === "deposit" ? <><Loader2 className="h-4 w-4 animate-spin" /> Depositing…</> :
                   "Deposit"}
                </Button>
                <Button onClick={withdrawAll} variant="outline" disabled={((userShares as bigint | undefined) ?? 0n) === 0n || pending !== "none"}>
                  {pending === "withdraw" ? <><Loader2 className="h-4 w-4 animate-spin" /> Withdrawing…</> : "Withdraw all"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </main>
    </>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-brand/40 bg-brand/5" : "border-border bg-bg/40"}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${highlight ? "text-brand" : "text-fg"}`}>{value}</p>
    </div>
  );
}
