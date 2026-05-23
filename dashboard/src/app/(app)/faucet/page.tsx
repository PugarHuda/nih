"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addresses, erc20Abi } from "@/lib/contracts";
import { useRequireChain } from "@/lib/use-require-chain";
import { Droplet, Loader2, ExternalLink } from "lucide-react";

const MINT_AMOUNT = parseEther("100");

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { ensure } = useRequireChain();
  const [pending, setPending] = useState<"none" | "musd" | "mezo">("none");

  async function mint(token: "musd" | "mezo") {
    if (!address) return;
    if (!(await ensure())) return;
    setPending(token);
    try {
      await writeContractAsync({
        address: token === "musd" ? addresses.MUSD : addresses.MEZO,
        abi: [
          { type: "function", name: "mint", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [] },
        ],
        functionName: "mint",
        args: [address, MINT_AMOUNT],
      });
      toast.success(`Minted 100 ${token.toUpperCase()}`);
    } catch (err) {
      toast.error((err as Error).message);
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
            The Mock MUSD and Mock MEZO tokens on matsnet are open-mint. Grab some to try the full
            tip / claim / borrow loop.
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
                <CardTitle>100 MUSD</CardTitle>
                <CardDescription>The stablecoin used for every tip.</CardDescription>
              </CardHeader>
              <Button onClick={() => mint("musd")} disabled={pending !== "none"} className="w-full">
                {pending === "musd" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Minting…
                  </>
                ) : (
                  "Mint 100 MUSD"
                )}
              </Button>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>100 MEZO</CardTitle>
                <CardDescription>Pay protocol fees at a 50% discount.</CardDescription>
              </CardHeader>
              <Button onClick={() => mint("mezo")} disabled={pending !== "none"} className="w-full" variant="secondary">
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
