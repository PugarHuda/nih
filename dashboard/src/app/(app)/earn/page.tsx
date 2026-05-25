"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, formatEther, maxUint256 } from "viem";
import { toast } from "sonner";
import { txSuccess, txError } from "@/lib/tx-toast";
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

  // NihEarn wraps Mezo's REAL StabilityPool — deposits MUST be in real
  // Mezo MUSD (`addresses.MUSD`). Showing Mock MUSD balance here
  // would mislead the user into approving the wrong token.
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
        // Approve REAL Mezo MUSD — NihEarn forwards into the real
        // StabilityPool which only accepts the real MUSD token.
        await writeContractAsync({ address: addresses.MUSD, abi: erc20Abi, functionName: "approve", args: [addresses.Earn, maxUint256] });
        await refetchAllowance();
      }
      setPending("deposit");
      const txHash = await writeContractAsync({ address: addresses.Earn, abi: earnAbi, functionName: "deposit", args: [amountWei] });
      txSuccess({ message: `Deposited ${amount} MUSD into Mezo Stability Pool`, txHash });
      setAmount("");
      await Promise.all([refetchEarn(), refetchShares()]);
    } catch (err) {
      txError(err);
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
      const txHash = await writeContractAsync({ address: addresses.Earn, abi: earnAbi, functionName: "withdraw", args: [shares] });
      txSuccess({ message: "Withdrawn from Stability Pool", txHash });
      await Promise.all([refetchEarn(), refetchShares()]);
    } catch (err) {
      txError(err);
    } finally {
      setPending("none");
    }
  }

  const earned = ((earnBalance as bigint | undefined) ?? 0n) - ((principal as bigint | undefined) ?? 0n);

  return (
    <>
      <Header />
      <main className="container max-w-2xl py-12">
        <div className="fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs text-brand mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Real Mezo yield
          </div>
          <h1 className="h1 mb-2" style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}>Earn on your tips</h1>
          <p className="mb-8 max-w-md" style={{ color: "var(--ink-3)" }}>
            Put your idle tips to work. Drop your MUSD into Mezo&apos;s savings pool and
            it quietly earns you <b>real Bitcoin</b> over time — like a high-yield
            savings account, except the interest comes in BTC. Nih takes nothing, and
            you can pull your money out whenever.
          </p>
        </div>

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
              <CardTitle>Deposit real MUSD</CardTitle>
              <CardDescription>
                You hold {formatMUSD((musdBalance as bigint | undefined) ?? 0n)} real Mezo MUSD.
              </CardDescription>
            </CardHeader>

            {/* Real-MUSD heads-up — the most common confusion on this page is
                "I have 1M MUSD why can't I deposit". Mock MUSD (from /faucet)
                won't work; only real MUSD from BorrowerOperations does. */}
            {((musdBalance as bigint | undefined) ?? 0n) === 0n && (
              <div
                className="mt-3 mb-1 p-3"
                style={{
                  background: "var(--accent)",
                  color: "var(--ink)",
                  border: "3.5px solid var(--ink)",
                  boxShadow: "3px 3px 0 0 var(--ink)",
                }}
              >
                <p className="text-[13px] leading-snug">
                  <b>Heads up:</b> NihEarn wraps Mezo's <em>real</em>{" "}
                  StabilityPool. The Mock MUSD from /faucet won't deposit
                  here. To get real MUSD on matsnet, open a Mezo trove (deposit
                  BTC, mint MUSD) via{" "}
                  <a
                    href="https://app.test.mezo.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    app.test.mezo.org
                  </a>
                  .
                </p>
              </div>
            )}

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
    <div
      style={{
        padding: 12,
        background: highlight ? "var(--accent)" : "var(--paper)",
        color: highlight ? "var(--accent-ink)" : "var(--ink)",
        border: "3px solid var(--ink)",
        boxShadow: highlight ? "3px 3px 0 0 var(--ink)" : "2px 2px 0 0 var(--ink)",
      }}
    >
      <p className="kicker" style={{ color: highlight ? "rgba(0,0,0,0.7)" : "var(--ink-3)" }}>
        {label}
      </p>
      <p
        className="tabular mt-1"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 22,
          lineHeight: 1,
          color: "inherit",
        }}
      >
        {value}
      </p>
    </div>
  );
}
