"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import { toast } from "sonner";
import { txSuccess, txError } from "@/lib/tx-toast";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addresses, erc20Abi, creditAbi } from "@/lib/contracts";
import { formatMUSD } from "@/lib/utils";
import { useRequireChain } from "@/lib/use-require-chain";
import { TrendingUp, Loader2, Banknote } from "lucide-react";

export default function BorrowPage() {
  const { address, isConnected } = useAccount();
  const [collateralInput, setCollateralInput] = useState("");
  const [pending, setPending] = useState<"none" | "approve" | "open" | "repay">("none");
  const { writeContractAsync } = useWriteContract();
  const { ensure } = useRequireChain();

  const { data: musdBalance } = useReadContract({
    address: addresses.MUSD,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: loan, refetch: refetchLoan } = useReadContract({
    address: addresses.Credit,
    abi: creditAbi,
    functionName: "loans",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: owed, refetch: refetchOwed } = useReadContract({
    address: addresses.Credit,
    abi: creditAbi,
    functionName: "owedAmount",
    args: address ? [address] : undefined,
    // refetchInterval so interest accrual is live without a manual reload.
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: addresses.MUSD,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, addresses.Credit] : undefined,
    query: { enabled: !!address },
  });

  // Pool treasury — NihCredit needs >= borrowable + collateral on hand
  // to fulfil the loan. Surface this so users don't hit
  // `InsufficientLiquidity` reverts.
  const { data: poolBalance } = useReadContract({
    address: addresses.MUSD,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [addresses.Credit],
    query: { refetchInterval: 30_000 },
  });

  const collateralWei = collateralInput ? parseEther(collateralInput) : 0n;
  const borrowable = (collateralWei * 6000n) / 10000n;
  const loanTuple = loan as readonly [bigint, bigint, bigint] | undefined;
  const hasActiveLoan = !!loanTuple && loanTuple[0] > 0n;
  const currentAllowance = (allowance as bigint | undefined) ?? 0n;
  const needsApproval = currentAllowance < collateralWei;
  const pool = (poolBalance as bigint | undefined) ?? 0n;
  // Contract requires pool >= collateral + borrowable AFTER the transfer-in
  // (i.e. existing pool >= borrowable). Show insufficient state otherwise.
  const insufficientLiquidity = collateralWei > 0n && pool < borrowable;

  async function handleApprove() {
    if (!(await ensure())) return;
    setPending("approve");
    try {
      const txHash = await writeContractAsync({
        address: addresses.MUSD,
        abi: erc20Abi,
        functionName: "approve",
        args: [addresses.Credit, parseEther("1000000")],
      });
      txSuccess({ message: "Approved", txHash });
      await refetchAllowance();
    } catch (err) {
      txError(err);
    } finally {
      setPending("none");
    }
  }

  async function handleOpen() {
    if (!collateralWei) return;
    if (!(await ensure())) return;
    setPending("open");
    try {
      const txHash = await writeContractAsync({
        address: addresses.Credit,
        abi: creditAbi,
        functionName: "open",
        args: [collateralWei],
      });
      txSuccess({ message: `Borrowed ${formatMUSD(borrowable)} MUSD`, txHash });
      setCollateralInput("");
      await Promise.all([refetchLoan(), refetchOwed()]);
    } catch (err) {
      txError(err);
    } finally {
      setPending("none");
    }
  }

  async function handleRepay() {
    if (!(await ensure())) return;
    setPending("repay");
    try {
      const txHash = await writeContractAsync({
        address: addresses.Credit,
        abi: creditAbi,
        functionName: "repay",
      });
      txSuccess({ message: "Loan repaid; collateral released", txHash });
      await Promise.all([refetchLoan(), refetchOwed()]);
    } catch (err) {
      txError(err);
    } finally {
      setPending("none");
    }
  }

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-2xl px-6 py-12">
        <div className="fade-up">
          <span
            className="chip"
            style={{ background: "var(--accent)", color: "var(--ink)", marginBottom: 12, display: "inline-flex" }}
          >
            <TrendingUp className="h-3.5 w-3.5" /> Creator Credit Line
          </span>
          <h1 className="h1 mt-3" style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}>
            Borrow.
          </h1>
          <p className="mt-3 text-base max-w-md" style={{ color: "var(--ink-3)" }}>
            Tips piling up but you&apos;d rather not spend them? Set some aside as a
            deposit and borrow up to 60% of it as cash you can use right now — for
            just 1% a year. Pay it back whenever, and your deposit is free again.
            Like a pawn shop, except you never hand over your stuff.
          </p>
        </div>

        {/* How it works — explain the mechanics + monitoring up front so
            the form below doesn't feel like a black box. */}
        <div className="comic-card my-8 px-5 py-4" data-tour="borrow-howto">
          <span className="kicker">how it works</span>
          <ol
            className="mt-2 grid sm:grid-cols-4 gap-3 text-[12px] leading-snug"
            style={{ color: "var(--ink-2)" }}
          >
            <li>
              <b>1. Set aside</b> — choose how much of your tip MUSD to put down as
              a deposit. It&apos;s still yours; you just can&apos;t spend it until you
              pay the loan back.
            </li>
            <li>
              <b>2. Borrow</b> — get 60% of that as cash, instantly. Interest is a
              flat 1% a year — no surprises.
            </li>
            <li>
              <b>3. Keep an eye</b> — the row below shows what you owe and how much
              of your deposit it&apos;s using. Stay well under the limit and you&apos;re safe.
            </li>
            <li>
              <b>4. Pay back</b> — repay any amount, any time; your deposit frees up
              as you go. Pay it all and you&apos;re done.
            </li>
          </ol>
        </div>


        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect to borrow</CardTitle>
              <CardDescription>You need a wallet with claimed MUSD tips.</CardDescription>
            </CardHeader>
          </Card>
        ) : hasActiveLoan ? (
          (() => {
            const principal = loanTuple![0];
            const collateral = loanTuple![1];
            const openedAt = loanTuple![2]; // seconds (uint64)
            const debt = (owed as bigint | undefined) ?? principal;
            const interestAccrued = debt > principal ? debt - principal : 0n;
            // LTV % = debt / collateral × 100. Both 18-decimal.
            const ltv =
              collateral > 0n
                ? Number((debt * 10000n) / collateral) / 100
                : 0;
            const liquidationLtv = 80;
            const daysOpen = Math.max(
              0,
              Math.floor((Date.now() / 1000 - Number(openedAt)) / 86400),
            );
            return (
              <Card>
                <CardHeader>
                  <CardTitle>Active credit line</CardTitle>
                  <CardDescription>
                    Day {daysOpen} since open · interest accrues at 1% APR ·
                    repay anytime to release collateral.
                  </CardDescription>
                </CardHeader>
                <div className="space-y-4 pt-2">
                  {/* Headline numbers */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Box label="Collateral locked" value={`${formatMUSD(collateral)} MUSD`} />
                    <Box label="Principal borrowed" value={`${formatMUSD(principal)} MUSD`} />
                    <Box
                      label="Interest accrued"
                      value={`${formatMUSD(interestAccrued)} MUSD`}
                    />
                    <Box
                      label="Total owed"
                      value={`${formatMUSD(debt)} MUSD`}
                      highlight
                    />
                  </div>

                  {/* LTV bar */}
                  <div
                    className="comic-card px-4 py-3"
                    style={{ background: "var(--paper)" }}
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="kicker">loan-to-value</span>
                      <b className="tabular text-sm">
                        {ltv.toFixed(2)}% / {liquidationLtv}% liquidation
                      </b>
                    </div>
                    <div
                      style={{
                        height: 10,
                        background: "var(--bg-2)",
                        border: "2px solid var(--line)",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, (ltv / liquidationLtv) * 100)}%`,
                          height: "100%",
                          background:
                            ltv >= liquidationLtv
                              ? "var(--bad)"
                              : ltv >= liquidationLtv * 0.85
                                ? "var(--accent-2)"
                                : "var(--good)",
                          transition: "width .5s ease-out",
                        }}
                      />
                    </div>
                    <p className="text-[11px] mt-1.5" style={{ color: "var(--ink-3)" }}>
                      {ltv < liquidationLtv * 0.5
                        ? "Healthy position — well below liquidation."
                        : ltv < liquidationLtv * 0.85
                          ? "Moderate. Consider repaying to free collateral."
                          : ltv < liquidationLtv
                            ? "Warning — close to liquidation threshold."
                            : "At or past liquidation. Repay now."}
                    </p>
                  </div>

                  {/* Repay */}
                  <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-stretch">
                    <Button
                      onClick={handleRepay}
                      disabled={pending === "repay"}
                      className="w-full"
                      size="lg"
                    >
                      {pending === "repay" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Repaying…
                        </>
                      ) : (
                        <>Repay {formatMUSD(debt)} MUSD & close</>
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>
                    Repay deducts {formatMUSD(debt)} MUSD from your wallet
                    and unlocks {formatMUSD(collateral)} MUSD of collateral in
                    the same tx. Partial repays aren't supported on the
                    current contract — close the position then re-open if you
                    want a smaller loan.
                  </p>
                </div>
              </Card>
            );
          })()
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Open a new credit line</CardTitle>
              <CardDescription>
                You have {formatMUSD((musdBalance as bigint) ?? 0n)} MUSD available as collateral.
              </CardDescription>
            </CardHeader>

            <div className="space-y-5 pt-2">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted mb-2 block">
                  Collateral amount (MUSD)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100"
                  value={collateralInput}
                  onChange={(e) => setCollateralInput(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Box label="You receive" value={`${formatMUSD(borrowable)} MUSD`} highlight />
                <Box label="Rate" value="1% fixed APR" hint="Same as Mezo&apos;s native trove — fixed forever" />
                <Box label="Pool treasury" value={`${formatMUSD(pool)} MUSD`} />
              </div>

              {insufficientLiquidity && (
                <div
                  className="p-3 text-[12px]"
                  style={{
                    background: "var(--accent-2)",
                    color: "var(--paper)",
                    border: "3.5px solid var(--ink)",
                    boxShadow: "3px 3px 0 0 var(--ink)",
                  }}
                >
                  <b>Treasury too low.</b> NihCredit needs at least{" "}
                  {formatMUSD(borrowable)} MUSD on hand to fulfil this loan
                  (current pool: {formatMUSD(pool)} MUSD). Reduce collateral or
                  wait until lenders top the pool up.
                </div>
              )}

              {needsApproval && collateralWei > 0n ? (
                <Button onClick={handleApprove} disabled={pending === "approve"} className="w-full">
                  {pending === "approve" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Approving…
                    </>
                  ) : (
                    "Approve MUSD"
                  )}
                </Button>
              ) : (
                <Button onClick={handleOpen} disabled={!collateralWei || pending === "open" || insufficientLiquidity} className="w-full">
                  {pending === "open" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Opening…
                    </>
                  ) : (
                    <>
                      <Banknote className="h-4 w-4" /> Borrow {formatMUSD(borrowable)} MUSD
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        )}
      </main>
    </>
  );
}

function Box({ label, value, highlight, hint }: { label: string; value: string; highlight?: boolean; hint?: string }) {
  return (
    <div
      style={{
        padding: 12,
        border: "3.5px solid var(--ink)",
        background: highlight ? "var(--accent)" : "var(--paper)",
        color: highlight ? "var(--accent-ink)" : "var(--ink)",
        boxShadow: highlight ? "3px 3px 0 0 var(--ink)" : "none",
      }}
    >
      <p className="kicker">{label}</p>
      <p
        className="tabular mt-1"
        style={{ fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 1 }}
      >
        {value}
      </p>
      {hint && (
        <p className="text-[10px] mt-1 opacity-70" style={{ color: "inherit" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
