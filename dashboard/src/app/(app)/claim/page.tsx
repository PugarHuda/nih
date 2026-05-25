"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { keccak256, encodePacked } from "viem";
import { toast } from "sonner";
import { txSuccess, txError } from "@/lib/tx-toast";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addresses, registryAbi, vaultAbi } from "@/lib/contracts";
import { formatMUSD } from "@/lib/utils";
import { useRequireChain } from "@/lib/use-require-chain";
import { CheckCircle2, AlertCircle, Loader2, Copy, ExternalLink } from "lucide-react";

type Platform = "twitter" | "youtube" | "github" | "linkedin";

const PLATFORM_HINTS: Record<Platform, { where: string; cta?: string; ctaUrl?: (u: string) => string }> = {
  twitter: {
    where: "Post a public tweet from this account containing the exact text below.",
    cta: "Compose tweet",
    ctaUrl: () => `https://twitter.com/intent/tweet`,
  },
  github: {
    where: "Add the text to your profile README at github.com/{username}/{username}, or any public gist.",
    cta: "Open profile README",
    ctaUrl: (u) => `https://github.com/${u}/${u}/edit/main/README.md`,
  },
  youtube: {
    where: "Paste the text into your channel description (youtube.com/@{username}/about).",
  },
  linkedin: {
    where: "Paste the text into your LinkedIn About section (linkedin.com/in/{username}).",
  },
};

export default function ClaimPage() {
  const { address, isConnected } = useAccount();
  const [platform, setPlatform] = useState<Platform>("twitter");
  const [username, setUsername] = useState("");
  const [step, setStep] = useState<"input" | "verifying" | "registered" | "claiming" | "done">("input");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string>("");
  const { writeContractAsync } = useWriteContract();
  const { ensure } = useRequireChain();

  const handleIdHash = username
    ? keccak256(encodePacked(["string", "string", "string"], [platform, ":", username]))
    : undefined;

  // Pull challenge text from backend whenever wallet changes
  useEffect(() => {
    if (!address) return;
    fetch(`/api/verify?wallet=${address}`)
      .then((r) => r.json())
      .then((data) => setChallenge(data.challenge ?? ""))
      .catch(() => {});
  }, [address]);

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
    if (!(await ensure())) return;
    setStep("verifying");
    setVerifyError(null);
    try {
      const resp = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform, username, wallet: address }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setVerifyError(data.reason ?? data.error ?? "Verification failed");
        setStep("input");
        toast.error(data.reason ?? data.error ?? "Verification failed");
        return;
      }
      const { tier, deadline, signature } = data;

      const txHash = await writeContractAsync({
        address: addresses.Registry,
        abi: registryAbi,
        functionName: "registerWithSignature",
        args: [handleIdHash!, tier, BigInt(deadline), signature],
      });

      await txSuccess({
        message: "Handle verified!",
        txHash,
        onConfirmed: async () => {
          setStep("registered");
          await refetchResolve();
        },
      });
    } catch (err) {
      txError(err);
      setStep("input");
    }
  }

  async function handleClaim() {
    if (!handleIdHash) return;
    if (!(await ensure())) return;
    setStep("claiming");
    try {
      const txHash = await writeContractAsync({
        address: addresses.Vault,
        abi: vaultAbi,
        functionName: "claim",
        args: [handleIdHash],
      });
      await txSuccess({
        message: "Tips claimed!",
        txHash,
        onConfirmed: async () => {
          setStep("done");
          await refetchPending();
        },
      });
    } catch (err) {
      txError(err);
      setStep("registered");
    }
  }

  const pendingAmount = (pending as bigint) ?? 0n;
  const resolvedTuple = resolved as readonly [`0x${string}`, number] | undefined;
  const isRegistered = !!resolvedTuple && resolvedTuple[0] !== "0x0000000000000000000000000000000000000000";
  const hint = PLATFORM_HINTS[platform];

  return (
    <>
      <Header />
      <main className="container max-w-xl py-16">
        <div className="fade-up">
          <h1 className="h1 mb-2" style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}>Claim your tips</h1>
          <p className="mb-6" style={{ color: "var(--ink-3)" }}>
            Prove you own the handle by posting a challenge text on your public profile, then claim
            on-chain.
          </p>
        </div>

        {/* How verification works — answers the most common question
            ("do I just connect my wallet?"). The answer: no, ownership
            of the *social handle* needs a separate proof. */}
        <div className="comic-card mb-8 px-5 py-4">
          <span className="kicker">how verification works</span>
          <ol
            className="mt-2 grid sm:grid-cols-3 gap-3 text-[12px] leading-snug"
            style={{ color: "var(--ink-2)" }}
          >
            <li>
              <b>1. Pick your handle</b> — e.g. <code>twitter:hajislamet</code>. Your wallet
              is already connected; this proves which <em>social</em> account is yours.
            </li>
            <li>
              <b>2. Post the challenge</b> — copy the one-line text the dashboard generates
              and paste it on your public profile (tweet, channel description, README).
              Our verifier reads it directly from the platform.
            </li>
            <li>
              <b>3. Sign the attestation</b> — the verifier returns a signature; you submit
              it to NihRegistry on-chain. From then on, tips routed to your handle land
              straight in your wallet — no more vault parking.
            </li>
          </ol>
        </div>

        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect your wallet</CardTitle>
              <CardDescription>You need a wallet to claim into.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* OAuth fast-path (Tier 2) — affordance only for now.
                Backend NextAuth providers ship next milestone; for the
                hackathon we keep the deterministic challenge-text path. */}
            <div
              className="comic-card accent p-4"
              style={{ background: "var(--accent)" }}
            >
              <span className="kicker" style={{ opacity: 0.85 }}>
                fast path · coming next milestone
              </span>
              <h3 className="h3 mt-1 mb-2">Sign in with the platform.</h3>
              <p className="text-[13px] leading-snug" style={{ color: "rgba(0,0,0,0.78)" }}>
                One click via OAuth → instant Tier-2 attestation, no profile
                editing. We wire this up via NextAuth providers
                post-hackathon — for the demo, use the challenge-text path
                below (more robust + zero trust on OAuth providers).
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {([
                  { p: "twitter",  label: "Sign in with X" },
                  { p: "github",   label: "Sign in with GitHub" },
                  { p: "youtube",  label: "Sign in with YouTube" },
                  { p: "linkedin", label: "Sign in with LinkedIn" },
                ] as const).map((b) => (
                  <button
                    key={b.p}
                    disabled
                    title="OAuth Tier-2 path — wired up post-hackathon"
                    className="comic-btn"
                    style={{
                      fontSize: 12,
                      padding: "5px 12px",
                      opacity: 0.55,
                      cursor: "not-allowed",
                      background: "var(--paper)",
                      color: "var(--ink)",
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>1. Pick your handle</CardTitle>
                <CardDescription>Tell us which social account is yours.</CardDescription>
              </CardHeader>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted mb-2 block">Platform</label>
                  <div className="flex flex-wrap gap-2">
                    {(["twitter", "youtube", "github", "linkedin"] as const).map((p) => (
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
                  <div className="rounded-lg border border-border bg-bg/50 p-4 flex items-center justify-between fade-up">
                    <div>
                      <p className="text-xs text-muted">Pending in vault</p>
                      <p className="text-2xl font-semibold mt-1">{formatMUSD(pendingAmount)} MUSD</p>
                    </div>
                    {pendingAmount > 0n ? (
                      <CheckCircle2 className="h-6 w-6 text-accent" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-muted" />
                    )}
                  </div>
                )}
              </div>
            </Card>

            {username && !isRegistered && (
              <Card>
                <CardHeader>
                  <CardTitle>2. Post this challenge text</CardTitle>
                  <CardDescription>{hint.where.replace("{username}", username)}</CardDescription>
                </CardHeader>
                <div className="space-y-3 pt-2">
                  <div className="rounded-lg border border-border bg-bg/50 p-3 font-mono text-sm break-all relative">
                    {challenge || "Connecting…"}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(challenge);
                        toast.success("Challenge text copied");
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded bg-surface border border-border hover:bg-bg"
                      aria-label="Copy"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted">
                    Wallet-bound — only you can post this exact text from the account you control.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(challenge);
                        toast.success("Copied — now paste on your profile");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy challenge
                    </Button>
                    {hint.cta && hint.ctaUrl && challenge && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={
                            platform === "twitter"
                              ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(challenge)}`
                              : hint.ctaUrl(username)
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {hint.cta} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                  <details
                    className="text-xs mt-2"
                    style={{ color: "var(--ink-3)" }}
                  >
                    <summary className="cursor-pointer hover:text-fg">
                      Why don't you just use OAuth login?
                    </summary>
                    <p className="mt-2 leading-snug">
                      OAuth proves you're logged into Twitter/GitHub — to{" "}
                      <em>Twitter/GitHub</em>. The on-chain registry doesn't
                      trust them. A challenge text you post yourself is
                      cryptographic-grade proof: anyone can fetch your public
                      profile and verify it, no centralized auth provider in
                      the loop. We do plan to add OAuth as a faster Tier 2
                      path (still attestation-signed by our verifier, just
                      with the OAuth step replacing the public-post step) —
                      but only as a convenience, never as the only path.
                    </p>
                  </details>
                  {hint.cta && !challenge && (
                    <Button variant="outline" size="sm" disabled>
                      {hint.cta} <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {verifyError && (
                    <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-xs text-danger">
                      {verifyError}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {!isRegistered && (
              <div
                className="comic-card p-4"
                style={{ borderColor: "var(--accent-2)" }}
              >
                <span className="kicker" style={{ color: "var(--accent-2)" }}>
                  if verification keeps failing
                </span>
                <p className="text-[12px] mt-2 leading-snug" style={{ color: "var(--ink-2)" }}>
                  <b>Twitter syndication is rate-limited and only refreshes for
                  active accounts</b> — for brand-new handles the API often
                  returns the cached &quot;no tweets yet&quot; response for ~1 hour.
                  Alternatives:
                </p>
                <ul className="mt-2 space-y-1 text-[12px]" style={{ color: "var(--ink-2)" }}>
                  <li>
                    <b>GitHub</b>: paste the challenge into your profile README at
                    <code className="mono ml-1">github.com/{`{user}`}/{`{user}`}/blob/main/README.md</code>
                    (a personal repo with the same name as your username — GitHub auto-shows it on the profile). Verifier reads it raw, no rate limit.
                  </li>
                  <li>
                    <b>YouTube</b>: paste into your channel description at
                    <code className="mono ml-1">youtube.com/@{`{handle}`}/about</code>. Description is in the page HTML on every fetch.
                  </li>
                  <li>
                    <b>LinkedIn</b>: paste into the &quot;About&quot; section at
                    <code className="mono ml-1">linkedin.com/in/{`{slug}`}</code>. Public for non-logged-in fetchers.
                  </li>
                  <li>
                    <b>Twitter (workaround)</b>: post the challenge AND tag at
                    least one tweet to it (reply, retweet, anything that pings
                    syndication&apos;s cache). Wait ~3 min then retry.
                  </li>
                </ul>
              </div>
            )}
            <Card>
              <CardHeader>
                <CardTitle>{isRegistered ? "3. Claim" : "3. Verify ownership"}</CardTitle>
                <CardDescription>
                  {isRegistered
                    ? "All set — claim accumulated tips into your wallet."
                    : "We'll fetch your public profile, look for the challenge text, and sign your Tier 1 attestation."}
                </CardDescription>
              </CardHeader>
              <div className="pt-2">
                {!isRegistered ? (
                  <Button onClick={handleVerify} disabled={!username || step === "verifying"} className="w-full">
                    {step === "verifying" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Checking your profile…
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
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
