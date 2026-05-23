"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, maxUint256, keccak256, toBytes } from "viem";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addresses, erc20Abi, routerAbi } from "@/lib/contracts";
import { formatMUSD } from "@/lib/utils";
import { useRequireChain } from "@/lib/use-require-chain";
import { Loader2, Sparkles } from "lucide-react";

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
  const [suggestion, setSuggestion] = useState<{ amount: number; reasoning: string; source: string } | null>(null);
  const { writeContractAsync } = useWriteContract();
  const { ensure } = useRequireChain();

  // Fetch a tip-amount suggestion when the page loads.
  useEffect(() => {
    if (!username) return;
    fetch("/api/suggest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platform,
        authorHandle: username,
        senderAddress: address,
        postText: context,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.amount) setSuggestion(data);
      })
      .catch(() => {});
  }, [platform, username, context, address]);

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
    if (!(await ensure())) return;
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
      <div className="fade-up">
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

            <>
              {suggestion && suggestion.amount !== amount && (
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 fade-up">
                  <div className="flex items-start gap-3">
                    <span className="rounded-md bg-accent/15 p-1.5 text-accent">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex-1 text-sm">
                      <p className="text-fg mb-1">
                        {suggestion.source === "claude+boar" ? "Claude suggests" : "Heuristic suggests"}{" "}
                        <strong className="text-accent">{suggestion.amount} MUSD</strong>
                      </p>
                      <p className="text-muted text-xs leading-relaxed">{suggestion.reasoning}</p>
                    </div>
                    <a
                      href={`/tip?platform=${platform}&username=${encodeURIComponent(username)}&amount=${suggestion.amount}`}
                      className="text-xs text-brand hover:underline whitespace-nowrap mt-0.5"
                    >
                      Use →
                    </a>
                  </div>
                </div>
              )}
            </>

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
      </div>
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
