import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createPublicClient, http } from "viem";
import { matsnet } from "@/lib/chain";
import { addresses, registryAbi, routerAbi, vaultAbi } from "@/lib/contracts";
import { handleIdOf, profileUrl, avatarUrl, PLATFORM_LABELS, type Platform } from "@/lib/handle-utils";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMUSD, truncateAddress } from "@/lib/utils";
import { ExternalLink, ArrowRight, ShieldCheck } from "lucide-react";

const PLATFORMS = new Set<Platform>([
  "twitter", "youtube", "github", "substack", "medium",
  "reddit", "hackernews", "twitch", "linkedin",
]);
// Tier 0 = no record. Tiers 1-3 are different attestation routes, but
// from a tipper's perspective they all mean "ownership proven".
const TIER_LABELS = ["Unverified", "Verified", "Verified", "Verified"];

const client = createPublicClient({
  chain: matsnet,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.test.mezo.org"),
});

interface PageProps {
  params: Promise<{ platform: string; username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { platform, username } = await params;
  if (!PLATFORMS.has(platform as Platform)) return {};
  const cleanUsername = decodeURIComponent(username);
  const label = PLATFORM_LABELS[platform as Platform].name;
  return {
    title: `Tip @${cleanUsername} on ${label} — Nih`,
    description: `Send Bitcoin-backed MUSD to @${cleanUsername} on ${label} with one click. Powered by Mezo.`,
    openGraph: {
      title: `Tip @${cleanUsername} on ${label}`,
      description: `Bitcoin-backed MUSD tips, no platform fee, no conversion. Powered by Mezo.`,
      images: [`/api/og?platform=${platform}&username=${encodeURIComponent(cleanUsername)}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/api/og?platform=${platform}&username=${encodeURIComponent(cleanUsername)}`],
    },
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { platform: rawPlatform, username: rawUsername } = await params;
  if (!PLATFORMS.has(rawPlatform as Platform)) notFound();
  const platform = rawPlatform as Platform;
  const username = decodeURIComponent(rawUsername).replace(/^@/, "");

  const id = handleIdOf(platform, username);

  // Read on-chain state independently so a transient failure on one
  // doesn't blank both. Logs the underlying error to the server console
  // so we can spot RPC blips instead of silently rendering a fake
  // "unregistered" profile for a known-verified handle.
  const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;
  const resolved = await (
    client.readContract({
      address: addresses.Registry,
      abi: registryAbi,
      functionName: "resolveById",
      args: [id],
    }) as Promise<readonly [`0x${string}`, number]>
  ).catch((err) => {
    console.error("[profile] resolveById failed", { id, err });
    return [ZERO, 0] as const;
  });
  const pending = await (
    client.readContract({
      address: addresses.Vault,
      abi: vaultAbi,
      functionName: "pendingFor",
      args: [id],
    }) as Promise<bigint>
  ).catch((err) => {
    console.error("[profile] pendingFor failed", { id, err });
    return 0n;
  });

  const [wallet, tier] = resolved;
  const isRegistered = wallet !== "0x0000000000000000000000000000000000000000";

  let totalReceived = 0n;
  if (isRegistered) {
    try {
      totalReceived = (await client.readContract({
        address: addresses.Router,
        abi: routerAbi,
        functionName: "totalReceived",
        args: [wallet],
      })) as bigint;
    } catch { /* keep 0 */ }
  }

  const meta = PLATFORM_LABELS[platform];
  const avatar = avatarUrl(platform, username);

  return (
    <>
      <Header />
      <main className="container max-w-2xl py-16">
        <Card className="overflow-hidden">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex-none">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={`@${username}`}
                  width={88}
                  height={88}
                  className="rounded-xl border border-border"
                  unoptimized
                />
              ) : (
                <div className="h-22 w-22 rounded-xl bg-surface border border-border flex items-center justify-center text-3xl">
                  {meta.icon}
                </div>
              )}
            </div>

            {/* Header */}
            <div className="flex-1 min-w-0">
              <CardHeader className="p-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-2xl">@{username}</CardTitle>
                  {isRegistered && tier >= 1 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent px-2 py-0.5 text-[10px] uppercase tracking-wider">
                      <ShieldCheck className="h-3 w-3" /> {TIER_LABELS[tier]}
                    </span>
                  )}
                </div>
                <CardDescription className="flex items-center gap-2">
                  <span>{meta.name}</span>
                  <span>·</span>
                  <a
                    href={profileUrl(platform, username)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand inline-flex items-center gap-0.5"
                  >
                    open profile <ExternalLink className="h-3 w-3" />
                  </a>
                </CardDescription>
              </CardHeader>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Stat
              label="Lifetime received"
              value={`${formatMUSD(totalReceived)} MUSD`}
              hint={isRegistered ? "Tips delivered to wallet" : "—"}
            />
            <Stat
              label="Pending in vault"
              value={`${formatMUSD(pending)} MUSD`}
              hint={
                isRegistered
                  ? "Tips flow straight to wallet — no parking needed"
                  : "Waiting for ownership proof"
              }
            />
          </div>

          {isRegistered && (
            <div className="mt-5 rounded-lg border border-border bg-bg/50 px-4 py-3">
              <p className="text-xs text-muted">Wallet</p>
              <code className="font-mono text-sm text-fg">{wallet}</code>
              <a
                href={`https://explorer.test.mezo.org/address/${wallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 ml-3 text-xs text-brand hover:underline"
              >
                explorer <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* One-shot tip CTAs */}
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest text-muted mb-2">Tip once</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={`/tip?platform=${platform}&username=${encodeURIComponent(username)}&amount=5`}>
                  Tip 5 MUSD <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/tip?platform=${platform}&username=${encodeURIComponent(username)}&amount=10`}>
                  10 MUSD
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/tip?platform=${platform}&username=${encodeURIComponent(username)}&amount=25`}>
                  25 MUSD
                </Link>
              </Button>
            </div>
          </div>

          {/* Recurring subscription CTAs — only shown when we know the
              recipient wallet (registered handle). Routes to /stream
              prefilled with amount + 1 month duration. */}
          {isRegistered && wallet && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-widest text-muted mb-2">
                Subscribe monthly
              </p>
              <div className="flex flex-wrap gap-3">
                {[5, 10, 25].map((m) => (
                  <Button asChild key={m} variant="outline" size="lg">
                    <Link
                      href={`/stream?to=${wallet}&amount=${m}&duration=2592000`}
                      title={`Start a 1-month streaming subscription of ${m} MUSD to @${username}`}
                    >
                      {m} MUSD / mo
                    </Link>
                  </Button>
                ))}
              </div>
              <p className="text-[11px] text-muted mt-2">
                Routes via NihStream — locks the month up front, recipient
                accrues per second, cancel any time.
              </p>
            </div>
          )}

          {!isRegistered && (
            <div className="mt-5 rounded-lg border border-brand/30 bg-brand/5 p-4 text-sm">
              <p className="text-fg font-medium mb-1">Are you @{username}?</p>
              <p className="text-muted mb-3">
                Tips sent before you registered park in an on-chain vault. Verify ownership to claim them.
              </p>
              <Button asChild size="sm" variant="default">
                <Link href="/claim">Claim your tips <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          )}
        </Card>
      </main>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg/40 p-4">
      <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  );
}
