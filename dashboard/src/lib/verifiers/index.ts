/**
 * Per-platform handle ownership verifiers.
 *
 * Each verifier independently fetches a public surface owned by the claimed
 * identity (GitHub README, Twitter profile, Substack about, etc.) and looks
 * for the challenge string. If found, the backend mints a Tier 1 attestation.
 *
 * Challenge string is `Verifying my Nih wallet 0x{wallet}` — lowercase-compared.
 * The wallet address is the salt: an attacker can post the challenge for THEIR
 * wallet, but can't make it match a victim's wallet (since the address differs).
 */
import { verifyGithub } from "./github";
import { verifyTwitter } from "./twitter";
import { verifyMedium } from "./medium";
import { verifySubstack } from "./substack";
import { verifyYouTube } from "./youtube";

export type Platform = "twitter" | "youtube" | "github" | "substack" | "medium";

export interface VerifyResult {
  ok: boolean;
  evidence?: string;
  reason?: string;
}

export function challengeFor(wallet: string): string {
  return `Verifying my Nih wallet ${wallet.toLowerCase()}`;
}

export async function verify(
  platform: Platform,
  username: string,
  wallet: string
): Promise<VerifyResult> {
  const challenge = challengeFor(wallet);
  switch (platform) {
    case "github":
      return verifyGithub(username, challenge);
    case "twitter":
      return verifyTwitter(username, challenge);
    case "medium":
      return verifyMedium(username, challenge);
    case "substack":
      return verifySubstack(username, challenge);
    case "youtube":
      return verifyYouTube(username, challenge);
    default:
      return { ok: false, reason: `Unsupported platform: ${platform}` };
  }
}
