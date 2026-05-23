"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { keccak256, encodePacked } from "viem";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addresses, registryAbi, vaultAbi } from "@/lib/contracts";
import { formatMUSD } from "@/lib/utils";
import { useRequireChain } from "@/lib/use-require-chain";
import { CheckCircle2, AlertCircle, Loader2, Copy, ExternalLink } from "lucide-react";

type Platform = "twitter" | "youtube" | "github" | "substack" | "medium";

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
    where: "Paste the text into your channel description (youtube.com/{username}/about).",
  },
  substack: {
    where: "Paste the text into your Substack About page ({username}.substack.com/about).",
  },
  medium: {
    where: "Paste the text into your Medium bio (medium.com/@{username}).",
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

      await writeContractAsync({
        address: addresses.Registry,
        abi: registryAbi,
        functionName: "registerWithSignature",
        args: [handleIdHash!, tier, BigInt(deadline), signature],
      });

      toast.success("Handle verified!");
      setStep("registered");
      await refetchResolve();
    } catch (err) {
      toast.error((err as Error).message);
      setStep("input");
    }
  }

  async function handleClaim() {
    if (!handleIdHash) return;
    if (!(await ensure())) return;
    setStep("claiming");
    try {
      await writeContractAsync({
        address: addresses.Vault,
        abi: vaultAbi,
        functionName: "claim",
        args: [handleIdHash],
      });
      toast.success("Tips claimed!");
      setStep("done");
      await refetchPending();
    } catch (err) {
      toast.error((err as Error).message);
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
            <Card>
              <CardHeader>
                <CardTitle>1. Pick your handle</CardTitle>
                <CardDescription>Tell us which social account is yours.</CardDescription>
              </CardHeader>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted mb-2 block">Platform</label>
                  <div className="flex flex-wrap gap-2">
                    {(["twitter", "youtube", "github", "substack", "medium"] as const).map((p) => (
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
