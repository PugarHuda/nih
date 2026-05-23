"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { isAddress, parseEther, maxUint256 } from "viem";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addresses, erc20Abi, streamAbi } from "@/lib/contracts";
import { formatMUSD, truncateAddress } from "@/lib/utils";
import { useRequireChain } from "@/lib/use-require-chain";
import { Loader2, Waves, ArrowRight, X } from "lucide-react";

const DURATIONS = [
  { label: "1 hour", seconds: 3600 },
  { label: "1 day", seconds: 86400 },
  { label: "1 week", seconds: 604800 },
  { label: "1 month", seconds: 2592000 },
];

export default function StreamPage() {
  const { address, isConnected } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(DURATIONS[1].seconds);
  const [pending, setPending] = useState<"none" | "approve" | "create">("none");
  const { writeContractAsync } = useWriteContract();
  const { ensure } = useRequireChain();

  const amountWei = amount ? parseEther(amount) : 0n;
  const ratePerSec = amountWei && duration ? amountWei / BigInt(duration) : 0n;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: addresses.MUSD,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, addresses.Stream] : undefined,
    query: { enabled: !!address },
  });

  const { data: outgoing, refetch: refetchOutgoing } = useReadContract({
    address: addresses.Stream,
    abi: streamAbi,
    functionName: "outgoingOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: incoming, refetch: refetchIncoming } = useReadContract({
    address: addresses.Stream,
    abi: streamAbi,
    functionName: "incomingOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const needsApproval = ((allowance as bigint | undefined) ?? 0n) < amountWei;
  const valid = isAddress(recipient) && amountWei > 0n;

  async function handleStart() {
    if (!valid) return;
    if (!(await ensure())) return;
    try {
      if (needsApproval) {
        setPending("approve");
        await writeContractAsync({
          address: addresses.MUSD,
          abi: erc20Abi,
          functionName: "approve",
          args: [addresses.Stream, maxUint256],
        });
        await refetchAllowance();
      }
      setPending("create");
      await writeContractAsync({
        address: addresses.Stream,
        abi: streamAbi,
        functionName: "create",
        args: [recipient as `0x${string}`, amountWei, BigInt(duration)],
      });
      toast.success("Stream started");
      setRecipient("");
      setAmount("");
      await Promise.all([refetchOutgoing(), refetchIncoming()]);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending("none");
    }
  }

  return (
    <>
      <Header />
      <main className="container max-w-3xl py-12">
        <div className="fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs text-brand mb-4">
            <Waves className="h-3.5 w-3.5" /> Per-second streaming
          </div>
          <h1 className="h1 mb-2" style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}>Tip stream</h1>
          <p className="mb-6 max-w-xl" style={{ color: "var(--ink-3)" }}>
            Stream MUSD by the second instead of one-shot tips. Perfect for
            payroll, subscriptions, content unlocks, or paying contractors.
            Sender or recipient can cancel any time; unaccrued MUSD refunds.
          </p>
        </div>

        {/* How it works — keep the mental model close to the form. */}
        <div className="comic-card mb-8 px-5 py-4">
          <span className="kicker">how it works</span>
          <ol
            className="mt-2 grid sm:grid-cols-4 gap-3 text-[12px] leading-snug"
            style={{ color: "var(--ink-2)" }}
          >
            <li>
              <b>1. Lock</b> the full MUSD amount up front. The contract escrows it
              for the recipient.
            </li>
            <li>
              <b>2. Accrue</b> per second — the recipient's claimable balance grows
              continuously, no per-tx gas.
            </li>
            <li>
              <b>3. Withdraw</b> any portion that's accrued. Recipient pulls when
              they want; contract refuses to overpay.
            </li>
            <li>
              <b>4. Cancel</b> any time, either side. Streamed amount stays with
              the recipient, the rest refunds to the sender.
            </li>
          </ol>
        </div>

        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect your wallet</CardTitle>
              <CardDescription>Streams require a sender wallet on Mezo matsnet.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>New stream</CardTitle>
                <CardDescription>Lock total amount, recipient withdraws as time passes.</CardDescription>
              </CardHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted mb-2 block">Recipient address</label>
                  <Input value={recipient} onChange={(e) => setRecipient(e.target.value.trim())} placeholder="0x…" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted mb-2 block">Total MUSD</label>
                    <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted mb-2 block">Duration</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {DURATIONS.map((d) => (
                        <button
                          key={d.seconds}
                          onClick={() => setDuration(d.seconds)}
                          className={`h-10 rounded-md text-xs font-medium border transition ${
                            duration === d.seconds
                              ? "bg-brand text-bg border-brand"
                              : "bg-surface text-fg border-border hover:border-brand/50"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {ratePerSec > 0n && (
                  <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs text-accent">
                    Rate ≈ {Number(formatMUSD(ratePerSec * 3600n))} MUSD / hour ({Number(formatMUSD(ratePerSec * 86400n))} / day)
                  </div>
                )}

                <Button onClick={handleStart} disabled={!valid || pending !== "none"} className="w-full" size="lg">
                  {pending === "approve" ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Approving MUSD…</>
                  ) : pending === "create" ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Starting stream…</>
                  ) : (
                    <>Start stream <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Outgoing</CardTitle>
                  <CardDescription>Streams you started</CardDescription>
                </CardHeader>
                <StreamList ids={outgoing as bigint[] | undefined} role="sender" refresh={refetchOutgoing} />
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Incoming</CardTitle>
                  <CardDescription>Streams to your wallet</CardDescription>
                </CardHeader>
                <StreamList ids={incoming as bigint[] | undefined} role="recipient" refresh={refetchIncoming} />
              </Card>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function StreamList({ ids, role, refresh }: { ids: bigint[] | undefined; role: "sender" | "recipient"; refresh: () => void }) {
  if (!ids || ids.length === 0) {
    return <p className="text-sm text-muted text-center py-6">Nothing here yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {ids.map((id) => (
        <StreamRow key={id.toString()} streamId={id} role={role} refresh={refresh} />
      ))}
    </ul>
  );
}

function StreamRow({ streamId, role, refresh }: { streamId: bigint; role: "sender" | "recipient"; refresh: () => void }) {
  const { writeContractAsync } = useWriteContract();
  const { ensure } = useRequireChain();
  const [busy, setBusy] = useState<"none" | "withdraw" | "cancel">("none");

  const { data: stream } = useReadContract({
    address: addresses.Stream,
    abi: streamAbi,
    functionName: "streams",
    args: [streamId],
  });
  const { data: withdrawable, refetch: refetchW } = useReadContract({
    address: addresses.Stream,
    abi: streamAbi,
    functionName: "withdrawable",
    args: [streamId],
  });

  if (!stream) return null;
  const s = stream as readonly [string, string, bigint, bigint, bigint, bigint, bigint, boolean];
  const counterparty = role === "sender" ? s[1] : s[0];

  async function doWithdraw() {
    if (!(await ensure())) return;
    setBusy("withdraw");
    try {
      await writeContractAsync({ address: addresses.Stream, abi: streamAbi, functionName: "withdraw", args: [streamId] });
      toast.success("Withdrawn");
      await Promise.all([refetchW(), refresh()]);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy("none");
    }
  }
  async function doCancel() {
    if (!(await ensure())) return;
    setBusy("cancel");
    try {
      await writeContractAsync({ address: addresses.Stream, abi: streamAbi, functionName: "cancel", args: [streamId] });
      toast.success("Stream cancelled");
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy("none");
    }
  }

  return (
    <li className="rounded-lg border border-border bg-bg/40 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">#{streamId.toString()} · {role === "sender" ? "to" : "from"} <code className="font-mono">{truncateAddress(counterparty)}</code></p>
          <p className="text-sm font-semibold mt-0.5">{formatMUSD(s[2])} MUSD total</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">{role === "recipient" ? "Withdrawable" : "Streamed"}</p>
          <p className="text-sm font-semibold text-accent">{formatMUSD((withdrawable as bigint | undefined) ?? 0n)} MUSD</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {role === "recipient" && (
          <Button size="sm" onClick={doWithdraw} disabled={busy !== "none" || ((withdrawable as bigint | undefined) ?? 0n) === 0n}>
            {busy === "withdraw" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Withdraw"}
          </Button>
        )}
        {!s[7] && (
          <Button size="sm" variant="outline" onClick={doCancel} disabled={busy !== "none"}>
            {busy === "cancel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><X className="h-3.5 w-3.5" /> Cancel</>}
          </Button>
        )}
      </div>
    </li>
  );
}
