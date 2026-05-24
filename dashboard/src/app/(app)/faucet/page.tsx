"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { toast } from "sonner";
import { txSuccess, txError } from "@/lib/tx-toast";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addresses } from "@/lib/contracts";
import { useRequireChain } from "@/lib/use-require-chain";
import { Droplet, Loader2, ExternalLink } from "lucide-react";

const MINT_AMOUNT = parseEther("100");

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { ensure } = useRequireChain();
  const [pending, setPending] = useState<"none" | "mezo">("none");

  // MUSD is now Mezo's REAL primitive — no open mint. MEZO is still a mock
  // (real MEZO not on matsnet yet) so the faucet only hands out test MEZO
  // for fee-discount practice. Real MUSD comes from a Mezo trove.
  async function mintMezo() {
    if (!address) return;
    if (!(await ensure())) return;
    setPending("mezo");
    try {
      const txHash = await writeContractAsync({
        address: addresses.MEZO,
        abi: [
          { type: "function", name: "mint", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [] },
        ],
        functionName: "mint",
        args: [address, MINT_AMOUNT],
      });
      await txSuccess({ message: "Minted 100 MEZO", txHash });
    } catch (err) {
      txError(err);
    } finally {
      setPending("none");
    }
  }

  return (
    <>
      <Header />
      <main className="container max-w-2xl py-16">
        <div className="fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs text-brand mb-4">
            <Droplet className="h-3.5 w-3.5" /> Testnet faucet
          </div>
          <h1 className="h1 mb-2" style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}>Get test funds</h1>
          <p className="mb-8 max-w-md" style={{ color: "var(--ink-3)" }}>
            Nih now uses Mezo&apos;s <b>real MUSD</b> for the entire tip economy.
            To get real MUSD on matsnet, open a Mezo trove (deposit BTC,
            mint MUSD). Test MEZO is still mockable here for the fee-discount
            flow.
          </p>
        </div>

        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect first</CardTitle>
              <CardDescription>The faucet mints directly to your wallet.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Real MUSD</CardTitle>
                <CardDescription>
                  Open a Mezo trove with test BTC to mint real MUSD.
                </CardDescription>
              </CardHeader>
              <a
                href="https://app.test.mezo.org"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full">
                  Open Mezo trove <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>100 MEZO</CardTitle>
                <CardDescription>Pay protocol fees at a 50% discount.</CardDescription>
              </CardHeader>
              <Button onClick={mintMezo} disabled={pending !== "none"} className="w-full" variant="secondary">
                {pending === "mezo" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Minting…
                  </>
                ) : (
                  "Mint 100 MEZO"
                )}
              </Button>
            </Card>
          </div>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Need BTC for gas?</CardTitle>
            <CardDescription>The official Mezo matsnet faucet drips testnet BTC every few hours.</CardDescription>
          </CardHeader>
          <Button variant="outline" asChild>
            <a href="https://faucet.test.mezo.org" target="_blank" rel="noopener noreferrer">
              Open Mezo faucet <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </Card>
      </main>
    </>
  );
}
