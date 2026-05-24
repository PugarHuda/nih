"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { isAddress, parseEther, maxUint256 } from "viem";
import { toast } from "sonner";
import { txSuccess, txError } from "@/lib/tx-toast";
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

// Monthly subscription presets — the Supernormal Social/Creator focus.
// Selecting one fills the form with `amount = preset` and `duration = 1 month`.
const SUB_PRESETS = [5, 10, 25];

export default function StreamPage() {
  const { address, isConnected } = useAccount();
  const params = useSearchParams();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(DURATIONS[3].seconds); // default 1 month — subscription bias

  // Pre-fill from query params (used by /c/profile Subscribe buttons).
  useEffect(() => {
    const to = params.get("to");
    const amt = params.get("amount");
    const dur = params.get("duration");
    if (to) setRecipient(to);
    if (amt) setAmount(amt);
    if (dur) {
      const seconds = Number(dur);
      if (!Number.isNaN(seconds) && seconds > 0) setDuration(seconds);
    }
  }, [params]);
  const [pending, setPending] = useState<"none" | "approve" | "create">("none");
  const { writeContractAsync } = useWriteContract();
  const { ensure } = useRequireChain();

  const amountWei = amount ? parseEther(amount) : 0n;
  const ratePerSec = amountWei && duration ? amountWei / BigInt(duration) : 0n;
  const recipientIsSelf =
    isAddress(recipient) &&
    !!address &&
    recipient.toLowerCase() === address.toLowerCase();

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
  // recipient cannot equal the sender (NihStream reverts InvalidRecipient).
  const valid = isAddress(recipient) && amountWei > 0n && !recipientIsSelf;

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
      const txHash = await writeContractAsync({
        address: addresses.Stream,
        abi: streamAbi,
        functionName: "create",
        args: [recipient as `0x${string}`, amountWei, BigInt(duration)],
      });
      txSuccess({ message: "Stream started", txHash });
      setRecipient("");
      setAmount("");
      await Promise.all([refetchOutgoing(), refetchIncoming()]);
    } catch (err) {
      txError(err);
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
          <h1 className="h1 mb-2" style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}>
            Subscribe to creators.
          </h1>
          <p className="mb-6 max-w-xl" style={{ color: "var(--ink-3)" }}>
            Pay creators MUSD by the second instead of one-shot tips. Works as a
            Patreon-style subscription, a payroll stream, or per-second access
            payments. Sender or recipient can cancel any time; unaccrued MUSD
            refunds.
          </p>
        </div>

        {/* How it works — keep the mental model close to the form. */}
        <div className="comic-card mb-6 px-5 py-4">
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

        {/* Worked example with concrete numbers — most people understand
            streams faster from a story than from spec language. */}
        <div className="comic-card accent mb-8 px-5 py-4">
          <span className="kicker" style={{ opacity: 0.7 }}>worked example · 5 MUSD / month</span>
          <p className="text-[13px] leading-snug mt-1.5">
            You start a <b>5 MUSD / month</b> subscription to @creator on day 0.
          </p>
          <ul
            className="mt-2 grid sm:grid-cols-3 gap-3 text-[12px] leading-snug"
            style={{ color: "rgba(0,0,0,.78)" }}
          >
            <li>
              <b>Day 0 →</b> 5 MUSD locked in NihStream. Your wallet is down
              5 MUSD. @creator can withdraw <b>0 MUSD</b>.
            </li>
            <li>
              <b>Day 15 →</b> halfway. @creator can withdraw <b>2.50 MUSD</b>.
              If they don't, it keeps accruing.
            </li>
            <li>
              <b>Day 30 →</b> full month elapsed. @creator can withdraw the
              full <b>5 MUSD</b>. Stream ends naturally.
            </li>
          </ul>
          <p className="text-[12px] mt-2.5" style={{ color: "rgba(0,0,0,.78)" }}>
            <b>Cancel on day 10?</b> @creator keeps the ~1.67 MUSD that
            accrued; the remaining ~3.33 MUSD refunds to your wallet
            instantly in the same tx.
          </p>
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

              {/* Monthly subscription presets — one-tap for the Patreon flow. */}
              <div className="mt-3 mb-1" data-tour="sub-presets">
                <label className="text-xs uppercase tracking-wider text-muted mb-2 block">
                  Quick subscription
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUB_PRESETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setAmount(String(m));
                        setDuration(2592000);
                      }}
                      className="h-10 px-4 rounded-md text-xs font-medium border bg-surface text-fg border-border hover:border-brand/50 transition"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {m} MUSD / month
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted mb-2 block">Recipient address</label>
                  <Input value={recipient} onChange={(e) => setRecipient(e.target.value.trim())} placeholder="0x…" />
                  {recipientIsSelf && (
                    <p className="text-[12px] mt-1.5" style={{ color: "var(--bad)" }}>
                      Stream recipient can&apos;t be your own wallet. Paste a
                      different address.
                    </p>
                  )}
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
                    {/* For monthly subscriptions the per-hour value rounds
                        to 0.00 — show day + month rates which are above
                        cent precision. formatMUSD already returns the
                        formatted string; do NOT round-trip through Number()
                        because comma separators turn into NaN. */}
                    Rate ≈ {formatMUSD(ratePerSec * 86400n)} MUSD / day ·{" "}
                    {formatMUSD(ratePerSec * 2592000n)} / month
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
      const txHash = await writeContractAsync({ address: addresses.Stream, abi: streamAbi, functionName: "withdraw", args: [streamId] });
      txSuccess({ message: "Withdrawn", txHash });
      await Promise.all([refetchW(), refresh()]);
    } catch (err) {
      txError(err);
    } finally {
      setBusy("none");
    }
  }
  async function doCancel() {
    if (!(await ensure())) return;
    setBusy("cancel");
    try {
      const txHash = await writeContractAsync({ address: addresses.Stream, abi: streamAbi, functionName: "cancel", args: [streamId] });
      txSuccess({ message: "Stream cancelled", txHash });
      await refresh();
    } catch (err) {
      txError(err);
    } finally {
      setBusy("none");
    }
  }

  return (
    <li
      className="p-3"
      style={{
        background: "var(--paper)",
        border: "3px solid var(--ink)",
        boxShadow: "2px 2px 0 0 var(--ink)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
            #{streamId.toString()} · {role === "sender" ? "to" : "from"}{" "}
            <code className="mono" style={{ color: "var(--ink)" }}>{truncateAddress(counterparty)}</code>
          </p>
          <p className="text-[15px] mt-0.5" style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
            {formatMUSD(s[2])} MUSD total
          </p>
        </div>
        <div className="text-right">
          <p className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
            {role === "recipient" ? "Withdrawable" : "Streamed"}
          </p>
          <p
            className="text-[15px] tabular"
            style={{ fontFamily: "var(--font-display)", color: "var(--accent-2)" }}
          >
            {formatMUSD((withdrawable as bigint | undefined) ?? 0n)} MUSD
          </p>
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
