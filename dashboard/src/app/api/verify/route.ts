import { NextRequest, NextResponse } from "next/server";
import { keccak256, encodePacked, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";
import { verify, challengeFor, type Platform } from "@/lib/verifiers";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const PLATFORMS = new Set<Platform>(["twitter", "youtube", "github", "substack", "medium"]);

/**
 * Backend verifier — Tier 1 attestation.
 *
 * Pipeline:
 *  1. Validate input shape.
 *  2. Call the platform-specific verifier that fetches the public profile
 *     and looks for the challenge string `Verifying my Nih wallet 0x{addr}`.
 *  3. If found, sign the attestation that NihRegistry will accept on-chain.
 *
 * The signer key is per-deployment (env VERIFIER_PRIVATE_KEY). Registry
 * trusts only this signer for Tier 1 — to upgrade trust, replace it with a
 * DAO multisig signer or a TEE-attested signer.
 */
export async function POST(req: NextRequest) {
  // Rate limit — verifying public profiles is expensive (5 external fetches each call).
  const ip = clientIp(req);
  const rl = rateLimit(`verify:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rl.retryAfter },
      { status: 429, headers: { "retry-after": String(rl.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { platform, username, wallet } = body as { platform?: string; username?: string; wallet?: string };

  if (!platform || !username || !wallet) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!PLATFORMS.has(platform as Platform)) {
    return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 });
  }
  if (!isAddress(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const verifierKey = process.env.VERIFIER_PRIVATE_KEY as Hex | undefined;
  if (!verifierKey) {
    return NextResponse.json({ error: "Verifier not configured" }, { status: 500 });
  }

  // 1. Real ownership check
  const result = await verify(platform as Platform, username, wallet);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: "Challenge not found on your public profile",
        reason: result.reason,
        challenge: challengeFor(wallet),
      },
      { status: 403 }
    );
  }

  // 2. Sign Tier 1 attestation
  const account = privateKeyToAccount(verifierKey);
  const handleId = keccak256(encodePacked(["string", "string", "string"], [platform, ":", username]));
  const tier = 1;
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31611);
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  const digest = keccak256(
    encodePacked(
      ["bytes32", "address", "uint8", "uint256", "uint256"],
      [handleId, wallet as Hex, tier, BigInt(deadline), BigInt(chainId)]
    )
  );
  const signature = await account.signMessage({ message: { raw: digest } });

  return NextResponse.json({
    tier,
    deadline,
    signature,
    handleId,
    evidence: result.evidence,
  });
}

/**
 * GET — returns the challenge text the user should post on their profile.
 * The /claim page calls this so we don't duplicate the format string.
 */
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
  }
  return NextResponse.json({ challenge: challengeFor(wallet) });
}
