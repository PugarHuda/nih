import { NextRequest, NextResponse } from "next/server";
import { keccak256, encodePacked } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

/**
 * Backend verifier endpoint.
 *
 * In production this would actually validate handle ownership via:
 *  - Twitter OAuth API (Tier 2)
 *  - signed-tweet challenge scrape (Tier 1)
 *  - DAO whitelist (Tier 3, off-chain registry)
 *
 * For the hackathon demo we treat any caller as Tier 1 (Signature) and sign
 * an attestation that the on-chain NihRegistry will accept.
 */
export async function POST(req: NextRequest) {
  const { platform, username, wallet } = await req.json();
  if (!platform || !username || !wallet) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const verifierKey = process.env.VERIFIER_PRIVATE_KEY as Hex | undefined;
  if (!verifierKey) {
    return NextResponse.json({ error: "Verifier not configured" }, { status: 500 });
  }

  const account = privateKeyToAccount(verifierKey);
  const handleId = keccak256(encodePacked(["string", "string", "string"], [platform, ":", username]));
  const tier = 1; // Signature tier
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31611);
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour

  const digest = keccak256(
    encodePacked(
      ["bytes32", "address", "uint8", "uint256", "uint256"],
      [handleId, wallet, tier, BigInt(deadline), BigInt(chainId)]
    )
  );

  const signature = await account.signMessage({ message: { raw: digest } });

  return NextResponse.json({ tier, deadline, signature, handleId });
}
