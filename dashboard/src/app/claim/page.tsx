"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { keccak256, encodePacked } from "viem";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addresses, registryAbi, vaultAbi } from "@/lib/contracts";
import { formatMUSD } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Platform = "twitter" | "youtube" | "github" | "substack" | "medium";

export default function ClaimPage() {
  const { address, isConnected } = useAccount();
  const [platform, setPlatform] = useState<Platform>("twitter");
  const [username, setUsername] = useState("");
  const [step, setStep] = useState<"input" | "verifying" | "registered" | "claiming" | "done">("input");
  const { writeContractAsync } = useWriteContract();

  const handleIdHash = username
    ? keccak256(encodePacked(["string", "string", "string"], [platform, ":", username]))
    : undefined;

  const { data: pending, refetch: refetchPending } = useReadContract({
    address: addresses.Vault,
    abi: vaultAbi,
    functionName: "pendingFor",
    args: handleIdHash ? [handleIdHash] : undefined,
    query: { enabled: !!handleIdHash },
  });

  const { data: resolved, refetch: refetchResolve } = useReadContract({
    address: addresses.Registry,
    abi: registryAbi,
    functionName: "resolveById",
    args: handleIdHash ? [handleIdHash] : undefined,
    query: { enabled: !!handleIdHash },
  });

  async function handleVerify() {
    if (!address || !username) return;
    setStep("verifying");
    try {
      // Hit backend /api/verify to get a verifier-signed attestation
      const resp = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform, username, wallet: address }),
      });
      if (!resp.ok) throw new Error("Verification failed");
      const { tier, deadline, signature } = await resp.json();

      await writeContractAsync({
        address: addresses.Registry,
        abi: registryAbi,
        functionName: "registerWithSignature",
        args: [handleIdHash!, tier, BigInt(deadline), signature],
      });

      toast.success("Handle verified!");
      setStep("registered");
      await refetchResolve();
    } catch (err) {
      toast.error((err as Error).message);
      setStep("input");
    }
  }

  async function handleClaim() {
    if (!handleIdHash) return;
    setStep("claiming");
    try {
      await writeContractAsync({
        address: addresses.Vault,
        abi: vaultAbi,
        functionName: "claim",
        args: [handleIdHash],
      });
      toast.success("Tips claimed!");
      setStep("done");
      await refetchPending();
    } catch (err) {
      toast.error((err as Error).message);
      setStep("registered");
    }
  }

  const pendingAmount = (pending as bigint) ?? 0n;
  const resolvedTuple = resolved as readonly [`0x${string}`, number] | undefined;
  const isRegistered = !!resolvedTuple && resolvedTuple[0] !== "0x0000000000000000000000000000000000000000";

  return (
    <>
      <Header />
      <main className="container max-w-xl py-16">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Claim your tips</h1>
          <p className="text-muted mb-10">
            Someone tipped you before you registered. Verify your handle, then claim.
          </p>
        </motion.div>

        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect your wallet</CardTitle>
              <CardDescription>You need a wallet to claim into.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>What&apos;s your handle?</CardTitle>
              <CardDescription>Tell us which social account is yours.</CardDescription>
            </CardHeader>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted mb-2 block">Platform</label>
                <div className="flex flex-wrap gap-2">
                  {(["twitter", "youtube", "github", "substack", "medium"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        platform === p
                          ? "bg-brand text-bg border-brand"
                          : "bg-surface text-fg border-border hover:border-brand/50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-muted mb-2 block">Username</label>
                <Input
                  placeholder={platform === "twitter" ? "hajislamet" : "yourhandle"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.trim().replace(/^@/, ""))}
                />
              </div>

              {username && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-border bg-bg/50 p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs text-muted">Pending in vault</p>
                    <p className="text-2xl font-semibold mt-1">{formatMUSD(pendingAmount)} MUSD</p>
                  </div>
                  {pendingAmount > 0n ? (
                    <CheckCircle2 className="h-6 w-6 text-accent" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-muted" />
                  )}
                </motion.div>
              )}

              <div className="pt-2">
                {!isRegistered ? (
                  <Button onClick={handleVerify} disabled={!username || step === "verifying"} className="w-full">
                    {step === "verifying" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                      </>
                    ) : (
                      "Verify handle"
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleClaim}
                    disabled={pendingAmount === 0n || step === "claiming"}
                    className="w-full"
                  >
                    {step === "claiming" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Claiming…
                      </>
                    ) : (
                      `Claim ${formatMUSD(pendingAmount)} MUSD`
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </main>
    </>
  );
}
