"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, maxUint256, keccak256, toBytes } from "viem";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addresses, erc20Abi, routerAbi } from "@/lib/contracts";
import { formatMUSD } from "@/lib/utils";
import { Loader2 } from "lucide-react";

function TipInner() {
  const params = useSearchParams();
  const { address, isConnected } = useAccount();
  const platform = (params.get("platform") ?? "twitter") as
    | "twitter"
    | "youtube"
    | "github"
    | "substack"
    | "medium";
  const username = (params.get("username") ?? "").replace(/^@/, "");
  const amount = Number(params.get("amount") ?? "5");
  const context = params.get("context") ?? "";

  const [pending, setPending] = useState<"none" | "approve" | "tip" | "done">("none");
  const { writeContractAsync } = useWriteContract();

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: addresses.MUSD,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, addresses.Router] : undefined,
    query: { enabled: !!address },
  });

  const amountWei = parseEther(String(amount));
  const currentAllowance = (allowance as bigint | undefined) ?? 0n;
  const needsApproval = currentAllowance < amountWei;

  async function handleSend() {
    if (!isConnected) return;
    setPending(needsApproval ? "approve" : "tip");
    try {
      if (needsApproval) {
        await writeContractAsync({
          address: addresses.MUSD,
          abi: erc20Abi,
          functionName: "approve",
          args: [addresses.Router, maxUint256],
        });
        await refetchAllowance();
      }
      const ctx = context ? keccak256(toBytes(context)) : ("0x" + "0".repeat(64) as `0x${string}`);
      setPending("tip");
      await writeContractAsync({
        address: addresses.Router,
        abi: routerAbi,
        functionName: "tip",
        args: [platform, username, amountWei, false, ctx],
      });
      toast.success(`Tipped ${amount} MUSD to @${username}`);
      setPending("done");
    } catch (err) {
      toast.error((err as Error).message);
      setPending("none");
    }
  }

  return (
    <main className="container max-w-lg py-16">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle>Confirm your tip</CardTitle>
            <CardDescription>
              You&apos;re tipping <strong>@{username || "—"}</strong> on{" "}
              <strong>{platform}</strong>
            </CardDescription>
          </CardHeader>

          <div className="space-y-5 pt-2">
            <div className="rounded-xl border border-brand/30 bg-brand/5 p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-muted">Amount</p>
              <p className="text-4xl font-semibold text-brand mt-1.5">
                {formatMUSD(amountWei, 0)} MUSD
              </p>
              <p className="text-xs text-muted mt-1">
                ≈ ${formatMUSD(amountWei, 2)} • 0.5% protocol fee
              </p>
            </div>

            {pending === "done" ? (
              <div className="rounded-lg bg-accent/10 border border-accent/30 p-4 text-center text-accent text-sm">
                ✓ Tip sent
              </div>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!isConnected || pending === "approve" || pending === "tip"}
                className="w-full"
                size="lg"
              >
                {pending === "approve" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Approving MUSD…
                  </>
                ) : pending === "tip" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending tip…
                  </>
                ) : !isConnected ? (
                  "Connect wallet first"
                ) : (
                  `Send ${amount} MUSD`
                )}
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </main>
  );
}

export default function TipPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<main className="container py-24 text-center text-muted">Loading…</main>}>
        <TipInner />
      </Suspense>
    </>
  );
}
