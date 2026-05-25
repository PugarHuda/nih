"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addresses, troveAbi } from "@/lib/contracts";
import { formatMUSD } from "@/lib/utils";
import { useRequireChain } from "@/lib/use-require-chain";
import { txSuccess, txError } from "@/lib/tx-toast";
import { Loader2, Bitcoin, ExternalLink } from "lucide-react";

/**
 * /trove — open a Mezo trove via NihTrove proxy.
 *
 * NihTrove deploys a per-user proxy clone the first time you open a
 * trove. Collateral (BTC) is sent with the tx; debt (real MUSD) is
 * minted by Mezo's BorrowerOperations and credited to the user's wallet.
 *
 * Mezo min net debt = 1800 MUSD. We default to 2000 MUSD with 0.04 BTC
 * collateral (~110% CR at $100k BTC) — adjust the inputs if you want
 * a bigger trove or a safer ratio.
 */
export default function TrovePage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { ensure } = useRequireChain();
  const [pending, setPending] = useState<"none" | "open" | "close">("none");
  const [collateralInput, setCollateralInput] = useState("0.04");
  const [debtInput, setDebtInput] = useState("2000");

  const { data: snap, refetch: refetchSnap } = useReadContract({
    address: addresses.Trove,
    abi: troveAbi,
    functionName: "snapshotOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const { data: proxy } = useReadContract({
    address: addresses.Trove,
    abi: troveAbi,
    functionName: "proxyOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const snapTuple = snap as readonly [bigint, bigint, bigint] | undefined;
  const debt = snapTuple?.[0] ?? 0n;
  const coll = snapTuple?.[1] ?? 0n;
  const status = snapTuple?.[2] ?? 0n;
  const isActive = status === 1n;

  const collateralWei = collateralInput ? parseEther(collateralInput) : 0n;
  const debtWei = debtInput ? parseEther(debtInput) : 0n;
  // Mezo charges a 0.5% issuance fee + 200 MUSD gas comp on top of debt.
  // Estimated repay-to-close = debt + ~200 MUSD.
  const estClose = isActive ? debt : 0n;

  async function handleOpen() {
    if (!collateralWei || !debtWei) return;
    if (!(await ensure())) return;
    setPending("open");
    try {
      const txHash = await writeContractAsync({
        address: addresses.Trove,
        abi: troveAbi,
        functionName: "openTroveFor",
        args: [debtWei],
        value: collateralWei,
      });
      await txSuccess({
        message: `Trove opened — ${debtInput} MUSD minted`,
        txHash,
        onConfirmed: async () => {
          await refetchSnap();
        },
      });
    } catch (err) {
      txError(err);
    } finally {
      setPending("none");
    }
  }

  async function handleClose() {
    if (!(await ensure())) return;
    setPending("close");
    try {
      const txHash = await writeContractAsync({
        address: addresses.Trove,
        abi: troveAbi,
        functionName: "closeTroveFor",
      });
      await txSuccess({
        message: `Trove closed — collateral released`,
        txHash,
        onConfirmed: async () => {
          await refetchSnap();
        },
      });
    } catch (err) {
      txError(err);
    } finally {
      setPending("none");
    }
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="fade-up">
          <span className="kicker">get spendable dollars · powered by Mezo</span>
          <h1 className="h1 mt-2 mb-2">
            <Bitcoin className="inline h-9 w-9 mr-2" style={{ color: "var(--accent-2)" }} />
            Turn BTC into MUSD.
          </h1>
          <p className="text-base mb-6" style={{ color: "var(--ink-3)" }}>
            Have Bitcoin but need spendable dollars? Lock some BTC here and unlock
            real MUSD against it — <b>without selling a single sat</b>. Pay the MUSD
            back and your Bitcoin comes home. It&apos;s the same engine that mints
            the MUSD behind every tip on Nih.
          </p>
        </div>

        {/* How it works */}
        <div className="comic-card mb-6 px-5 py-4" data-tour="trove-howto">
          <span className="kicker">how it works</span>
          <ol
            className="mt-2 grid sm:grid-cols-4 gap-3 text-[12px] leading-snug"
            style={{ color: "var(--ink-2)" }}
          >
            <li><b>1. Set up</b> — the first time, you create your own personal vault (a quick one-time step).</li>
            <li><b>2. Lock BTC</b> — choose how much Bitcoin to put in and how much MUSD to take out.</li>
            <li><b>3. Get MUSD</b> — Mezo checks your deposit safely covers the loan, then sends MUSD to your wallet.</li>
            <li><b>4. Get BTC back</b> — repay what you borrowed and your Bitcoin is released.</li>
          </ol>
        </div>

        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect to open a trove</CardTitle>
              <CardDescription>You need a wallet with matsnet BTC for collateral.</CardDescription>
            </CardHeader>
          </Card>
        ) : isActive ? (
          <Card>
            <CardHeader>
              <CardTitle>Your trove</CardTitle>
              <CardDescription>
                Proxy:{" "}
                {proxy && (
                  <a
                    href={`https://explorer.test.mezo.org/address/${proxy as string}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-1"
                  >
                    {(proxy as string).slice(0, 10)}…
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardDescription>
            </CardHeader>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <Box label="Debt" value={`${formatMUSD(debt)} MUSD`} />
              <Box label="Collateral" value={`${formatBTC(coll)} BTC`} />
              <Box label="Status" value="Active" highlight />
            </div>
            <p className="text-[12px] mt-3" style={{ color: "var(--ink-3)" }}>
              Closing repays ~{formatMUSD(estClose)} MUSD + 200 MUSD gas-comp
              and releases all collateral.
            </p>
            <Button
              onClick={handleClose}
              disabled={pending === "close"}
              className="w-full mt-4"
              size="lg"
              variant="outline"
            >
              {pending === "close" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Closing…</>
              ) : (
                <>Close trove & release collateral</>
              )}
            </Button>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Open a new trove</CardTitle>
              <CardDescription>
                Mezo min net debt = 1800 MUSD. Suggested: 0.04 BTC ≈ 2000 MUSD (110% ICR at $100k BTC).
              </CardDescription>
            </CardHeader>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              <div>
                <label className="kicker mb-1.5 block">Collateral (BTC)</label>
                <Input
                  type="number"
                  step="0.001"
                  value={collateralInput}
                  onChange={(e) => setCollateralInput(e.target.value)}
                  placeholder="0.04"
                />
              </div>
              <div>
                <label className="kicker mb-1.5 block">Debt to mint (MUSD)</label>
                <Input
                  type="number"
                  step="50"
                  value={debtInput}
                  onChange={(e) => setDebtInput(e.target.value)}
                  placeholder="2000"
                />
              </div>
            </div>
            <p className="text-[12px] mt-3" style={{ color: "var(--ink-3)" }}>
              First-time open also deploys your NihTrove proxy clone (one-time).
            </p>
            <Button
              onClick={handleOpen}
              disabled={!collateralWei || !debtWei || pending === "open"}
              className="w-full mt-4"
              size="lg"
            >
              {pending === "open" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Opening trove…</>
              ) : (
                <>Mint {debtInput} MUSD with {collateralInput} BTC</>
              )}
            </Button>
          </Card>
        )}
      </main>
    </>
  );
}

function Box({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
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
        style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, color: "inherit" }}
      >
        {value}
      </p>
    </div>
  );
}

function formatBTC(wei: bigint): string {
  const n = Number(wei) / 1e18;
  return n.toFixed(4);
}
