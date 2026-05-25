"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, maxUint256, keccak256, toBytes } from "viem";
import { txSuccess, txError } from "@/lib/tx-toast";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addresses, erc20Abi, routerAbi } from "@/lib/contracts";
import { formatMUSD } from "@/lib/utils";
import { useRequireChain } from "@/lib/use-require-chain";
import { Loader2, Sparkles, CheckCircle2, ExternalLink, ChevronDown } from "lucide-react";

const EXPLORER = "https://explorer.test.mezo.org";

// Where "Back to {platform}" sends the tipper when no explicit return URL
// is supplied (e.g. opened from the dashboard rather than the extension).
const PLATFORM_HOME: Record<string, (u: string) => string> = {
  twitter: (u) => `https://x.com/${u}`,
  youtube: (u) => `https://www.youtube.com/@${u}`,
  github: (u) => `https://github.com/${u}`,
  linkedin: (u) => `https://www.linkedin.com/in/${u}`,
};

const PLATFORM_NAME: Record<string, string> = {
  twitter: "X / Twitter",
  youtube: "YouTube",
  github: "GitHub",
  linkedin: "LinkedIn",
};

// Only follow http(s) return URLs — never javascript:/data: schemes.
function safeReturnUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function TipInner() {
  const params = useSearchParams();
  const { address, isConnected } = useAccount();
  const platform = (params.get("platform") ?? "twitter") as
    | "twitter"
    | "youtube"
    | "github"
    | "linkedin";
  const username = (params.get("username") ?? "").replace(/^@/, "");
  const amount = Number(params.get("amount") ?? "5");
  const context = params.get("context") ?? "";

  // Where to send the tipper after success. Prefer an explicit ?return=
  // (the exact tweet/post they came from), else the creator's profile home.
  const returnUrl =
    safeReturnUrl(params.get("return")) ??
    (username ? PLATFORM_HOME[platform]?.(username) ?? null : null);

  const [pending, setPending] = useState<"none" | "approve" | "approveMezo" | "tip" | "done">("none");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [feeInfo, setFeeInfo] = useState(false);
  const [payInMezo, setPayInMezo] = useState(params.get("feeMezo") === "1");
  const [suggestion, setSuggestion] = useState<{ amount: number; reasoning: string; source: string; model?: string } | null>(null);
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

  // After a successful tip, count down then bounce the tipper back to the
  // page they came from (the tweet/post/profile). Manual button too.
  useEffect(() => {
    if (pending !== "done" || !returnUrl || countdown === null) return;
    if (countdown <= 0) {
      window.location.href = returnUrl;
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [pending, countdown, returnUrl]);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: addresses.MUSD,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, addresses.Router] : undefined,
    query: { enabled: !!address },
  });

  const { data: mezoAllowance, refetch: refetchMezoAllowance } = useReadContract({
    address: addresses.MEZO,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, addresses.Router] : undefined,
    query: { enabled: !!address },
  });

  const amountWei = parseEther(String(amount));
  const currentAllowance = (allowance as bigint | undefined) ?? 0n;
  const needsApproval = currentAllowance < amountWei;
  // MEZO fee is tiny (0.25% of amount, rate-converted) — approve generously
  // once so the tipper never re-approves. Threshold is amount-relative.
  const currentMezoAllowance = (mezoAllowance as bigint | undefined) ?? 0n;
  const needsMezoApproval = payInMezo && currentMezoAllowance < amountWei;

  // Recipient nets the full amount when the fee is paid in MEZO (musdFee=0),
  // else amount minus the 0.5% MUSD fee.
  const feeMusd = payInMezo ? 0n : (amountWei * 50n) / 10_000n;
  const netToCreator = amountWei - feeMusd;

  async function handleSend() {
    if (!isConnected) return;
    if (!(await ensure())) return;
    try {
      if (needsApproval) {
        setPending("approve");
        await writeContractAsync({
          address: addresses.MUSD,
          abi: erc20Abi,
          functionName: "approve",
          args: [addresses.Router, maxUint256],
        });
        await refetchAllowance();
      }
      if (needsMezoApproval) {
        setPending("approveMezo");
        await writeContractAsync({
          address: addresses.MEZO,
          abi: erc20Abi,
          functionName: "approve",
          args: [addresses.Router, maxUint256],
        });
        await refetchMezoAllowance();
      }
      const ctx = context ? keccak256(toBytes(context)) : ("0x" + "0".repeat(64) as `0x${string}`);
      setPending("tip");
      const hash = await writeContractAsync({
        address: addresses.Router,
        abi: routerAbi,
        functionName: "tip",
        args: [platform, username, amountWei, payInMezo, ctx],
      });
      setTxHash(hash);
      // Receipt-gated: stay in the "Sending tip…" state until the tx
      // confirms, then flip to the success screen + start the bounce-back
      // countdown. (Codebase convention — never flip UI on broadcast.)
      txSuccess({
        message: `Tipped ${amount} MUSD to @${username}`,
        txHash: hash,
        description: "Indexed by Goldsky in ~15s",
        onConfirmed: () => {
          setPending("done");
          if (returnUrl) setCountdown(5);
        },
      });
    } catch (err) {
      txError(err);
      setPending("none");
    }
  }

  // ── Success screen ──────────────────────────────────────────────
  if (pending === "done") {
    return (
      <main className="container max-w-lg py-16">
        <div className="fade-up">
          <Card>
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <span
                className="inline-flex h-16 w-16 items-center justify-center"
                style={{
                  background: "var(--accent)",
                  border: "3px solid var(--ink)",
                  boxShadow: "4px 4px 0 0 var(--ink)",
                }}
              >
                <CheckCircle2 className="h-8 w-8" style={{ color: "var(--ink)" }} />
              </span>
              <div>
                <h2 className="h2" style={{ fontSize: "clamp(28px,4vw,40px)" }}>
                  Tip sent!
                </h2>
                <p className="muted text-sm mt-1">
                  <strong>{amount} MUSD</strong> to <strong>@{username}</strong> on{" "}
                  {PLATFORM_NAME[platform] ?? platform}.{" "}
                  {payInMezo
                    ? "They received the full amount (fee paid in MEZO)."
                    : `They received ${formatMUSD(netToCreator, 2)} MUSD after the 0.5% fee.`}
                </p>
              </div>

              {txHash && (
                <a
                  href={`${EXPLORER}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs hover:underline inline-flex items-center gap-1"
                  style={{ color: "var(--accent-2)" }}
                >
                  View transaction <ExternalLink className="h-3 w-3" />
                </a>
              )}

              <div className="w-full flex flex-col gap-2 mt-2">
                {returnUrl && (
                  <Button asChild className="w-full" size="lg">
                    <a href={returnUrl}>
                      Back to {PLATFORM_NAME[platform] ?? platform}
                      {countdown !== null && countdown > 0 ? ` (${countdown})` : ""} ↗
                    </a>
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/c/${platform}/${username}`}>View profile</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setPending("none");
                      setTxHash(null);
                      setCountdown(null);
                    }}
                  >
                    Tip again
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  const busy = pending === "approve" || pending === "approveMezo" || pending === "tip";

  return (
    <main className="container max-w-lg py-16">
      <div className="fade-up" data-tour="tip-form">
        <Card>
          <CardHeader>
            <CardTitle>Confirm your tip</CardTitle>
            <CardDescription>
              You&apos;re tipping <strong>@{username || "—"}</strong> on{" "}
              <strong>{platform}</strong>. The platform name is what makes the
              recipient unique on-chain (handleId = keccak256(&quot;{platform}:{username || "…"}&quot;)).
            </CardDescription>
          </CardHeader>

          <div className="space-y-5 pt-2">
            <div className="rounded-xl border border-brand/30 bg-brand/5 p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-muted">Amount</p>
              <p className="text-4xl font-semibold text-brand mt-1.5">
                {formatMUSD(amountWei, 0)} MUSD
              </p>
              <p className="text-xs text-muted mt-1">
                {payInMezo ? (
                  <>creator gets the full {formatMUSD(amountWei, 0)} MUSD · fee 0.25% in MEZO</>
                ) : (
                  <>creator gets {formatMUSD(netToCreator, 2)} MUSD · 0.5% protocol fee</>
                )}
              </p>
            </div>

            {/* Pay-fee-in-MEZO toggle + explainer. Answers "what is this?" */}
            <div
              className="rounded-lg p-3"
              style={{ border: "2px solid var(--ink)", background: "var(--paper)" }}
            >
              <label className="flex items-center justify-between cursor-pointer gap-3">
                <div>
                  <p className="text-sm font-semibold">Pay protocol fee in MEZO</p>
                  <p className="text-[11px] text-muted">
                    50% off the fee · creator receives 100% of your MUSD
                  </p>
                </div>
                <input
                  type="checkbox"
                  data-no-sparkle
                  checked={payInMezo}
                  onChange={(e) => setPayInMezo(e.target.checked)}
                  className="h-5 w-5 accent-brand flex-none"
                />
              </label>
              <button
                type="button"
                onClick={() => setFeeInfo((v) => !v)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted hover:text-fg"
              >
                <ChevronDown
                  className="h-3 w-3 transition-transform"
                  style={{ transform: feeInfo ? "rotate(180deg)" : "none" }}
                />
                What does this mean?
              </button>
              {feeInfo && (
                <div className="mt-2 text-[11px] leading-relaxed text-muted space-y-1.5 fade-up">
                  <p>
                    Nih charges a small protocol fee on each tip. <b>By default</b> it&apos;s{" "}
                    <b>0.5%</b>, taken out of your MUSD — so the creator receives 99.5%.
                  </p>
                  <p>
                    <b>Turn this on</b> and the fee drops to <b>0.25%</b> and is paid separately
                    in <b>MEZO</b> (the network token). Two upsides: the creator gets <b>100%</b>{" "}
                    of your MUSD tip, and you pay half the fee. The trade-off: you spend a little
                    MEZO and approve it once.
                  </p>
                </div>
              )}
            </div>

            <>
              {suggestion && (
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 fade-up">
                  <div className="flex items-start gap-3">
                    <span className="rounded-md bg-accent/15 p-1.5 text-accent">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex-1 text-sm">
                      <p className="text-fg mb-1">
                        {suggestion.source.includes("claude")
                          ? "Claude suggests"
                          : suggestion.source.includes("ai")
                          ? "AI suggests"
                          : "Heuristic suggests"}{" "}
                        <strong className="text-accent">{suggestion.amount} MUSD</strong>
                        {suggestion.source.includes("boar") && (
                          <span className="text-[10px] text-muted ml-1.5">· on-chain context via Boar</span>
                        )}
                      </p>
                      <p className="text-muted text-xs leading-relaxed">{suggestion.reasoning}</p>
                    </div>
                    {suggestion.amount !== amount ? (
                      <a
                        href={`/tip?platform=${platform}&username=${encodeURIComponent(username)}&amount=${suggestion.amount}${payInMezo ? "&feeMezo=1" : ""}${returnUrl ? `&return=${encodeURIComponent(returnUrl)}` : ""}`}
                        className="text-xs text-brand hover:underline whitespace-nowrap mt-0.5"
                      >
                        Use →
                      </a>
                    ) : (
                      <span className="text-[11px] text-accent whitespace-nowrap mt-0.5">✓ matches</span>
                    )}
                  </div>
                </div>
              )}
            </>

            <Button
              onClick={handleSend}
              disabled={!isConnected || busy}
              className="w-full"
              size="lg"
            >
              {pending === "approve" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Approving MUSD…
                </>
              ) : pending === "approveMezo" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Approving MEZO…
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

            {/* Recognition nudge — tips from a wallet that owns a verified
                handle are credited to that handle on the leaderboard. */}
            <p className="text-[11px] text-center text-muted">
              Want to be recognized as the tipper on the leaderboard?{" "}
              <Link href="/claim" className="hover:underline" style={{ color: "var(--accent-2)" }}>
                Claim your handle
              </Link>{" "}
              — then tips you send show your name, not just your address.
            </p>
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
