"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import { toast } from "sonner";
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

  const { data: owed } = useReadContract({
    address: addresses.Credit,
    abi: creditAbi,
    functionName: "owedAmount",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: addresses.MUSD,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, addresses.Credit] : undefined,
    query: { enabled: !!address },
  });

  const collateralWei = collateralInput ? parseEther(collateralInput) : 0n;
  const borrowable = (collateralWei * 6000n) / 10000n;
  const loanTuple = loan as readonly [bigint, bigint, bigint] | undefined;
  const hasActiveLoan = !!loanTuple && loanTuple[0] > 0n;
  const currentAllowance = (allowance as bigint | undefined) ?? 0n;
  const needsApproval = currentAllowance < collateralWei;

  async function handleApprove() {
    if (!(await ensure())) return;
    setPending("approve");
    try {
      await writeContractAsync({
        address: addresses.MUSD,
        abi: erc20Abi,
        functionName: "approve",
        args: [addresses.Credit, parseEther("1000000")],
      });
      toast.success("Approved");
      await refetchAllowance();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending("none");
    }
  }

  async function handleOpen() {
    if (!collateralWei) return;
    if (!(await ensure())) return;
    setPending("open");
    try {
      await writeContractAsync({
        address: addresses.Credit,
        abi: creditAbi,
        functionName: "open",
        args: [collateralWei],
      });
      toast.success(`Borrowed ${formatMUSD(borrowable)} MUSD`);
      setCollateralInput("");
      await refetchLoan();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending("none");
    }
  }

  async function handleRepay() {
    if (!(await ensure())) return;
    setPending("repay");
    try {
      await writeContractAsync({
        address: addresses.Credit,
        abi: creditAbi,
        functionName: "repay",
      });
      toast.success("Loan repaid; collateral released");
      await refetchLoan();
    } catch (err) {
      toast.error((err as Error).message);
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
            Lock claimed tips as collateral. Mint up to 60% as MUSD instantly. 1%
            fixed rate. Repay any time to release collateral.
          </p>
        </div>

        {/* How it works — explain the mechanics + monitoring up front so
            the form below doesn't feel like a black box. */}
        <div className="comic-card my-8 px-5 py-4">
          <span className="kicker">how it works</span>
          <ol
            className="mt-2 grid sm:grid-cols-4 gap-3 text-[12px] leading-snug"
            style={{ color: "var(--ink-2)" }}
          >
            <li>
              <b>1. Collateral</b> — pick how much of your claimed tip MUSD to
              escrow in NihCredit. You keep ownership; you just can't spend it
              until the loan closes.
            </li>
            <li>
              <b>2. Borrow</b> — receive 60% of that amount as freshly-minted
              MUSD. 1% fixed APR accrues from the open block.
            </li>
            <li>
              <b>3. Monitor</b> — your live row below shows: principal, debt
              (principal + interest), and the LTV ratio. Anything over 80% LTV
              is liquidation territory.
            </li>
            <li>
              <b>4. Repay</b> — pay back any portion; collateral unlocks
              proportionally. Repay in full to close the position.
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
          <Card>
            <CardHeader>
              <CardTitle>Active credit line</CardTitle>
              <CardDescription>Repay anytime to release your collateral.</CardDescription>
            </CardHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <Box label="Collateral locked" value={`${formatMUSD(loanTuple![1])} MUSD`} />
                <Box label="Owed (incl. interest)" value={`${formatMUSD((owed as bigint) ?? 0n)} MUSD`} />
              </div>
              <Button onClick={handleRepay} disabled={pending === "repay"} className="w-full">
                {pending === "repay" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Repaying…
                  </>
                ) : (
                  "Repay & close"
                )}
              </Button>
            </div>
          </Card>
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

              <div className="grid grid-cols-2 gap-3">
                <Box label="You receive" value={`${formatMUSD(borrowable)} MUSD`} highlight />
                <Box label="Rate" value="1% fixed APR" />
              </div>

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
                <Button onClick={handleOpen} disabled={!collateralWei || pending === "open"} className="w-full">
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

function Box({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      style={{
        padding: 12,
        border: "3.5px solid var(--ink)",
        background: highlight ? "var(--accent)" : "var(--bg-2)",
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
    </div>
  );
}
