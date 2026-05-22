"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addresses, erc20Abi, creditAbi } from "@/lib/contracts";
import { formatMUSD } from "@/lib/utils";
import { TrendingUp, Loader2, Banknote } from "lucide-react";

export default function BorrowPage() {
  const { address, isConnected } = useAccount();
  const [collateralInput, setCollateralInput] = useState("");
  const [pending, setPending] = useState<"none" | "approve" | "open" | "repay">("none");
  const { writeContractAsync } = useWriteContract();

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
      <main className="container max-w-2xl py-16">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs text-brand mb-4">
            <TrendingUp className="h-3.5 w-3.5" /> Creator Credit Line
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Borrow against your tips
          </h1>
          <p className="text-muted mb-10 max-w-md">
            Lock claimed tips as collateral. Mint up to 60% as MUSD instantly. 1% fixed
            rate. Repay any time to release collateral.
          </p>
        </motion.div>

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
      className={`rounded-lg border p-3 ${
        highlight ? "border-brand/40 bg-brand/5" : "border-border bg-bg/40"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${highlight ? "text-brand" : "text-fg"}`}>{value}</p>
    </div>
  );
}
