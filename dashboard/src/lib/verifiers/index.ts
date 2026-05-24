/**
 * Per-platform handle ownership verifiers.
 *
 * Each verifier independently fetches a public surface owned by the claimed
 * identity (GitHub README, Twitter profile, YouTube about, LinkedIn slug)
 * and looks for the challenge string. If found, the backend mints a
 * Tier 1 attestation.
 *
 * Challenge string is `Verifying my Nih wallet 0x{wallet}` — lowercase-compared.
 * The wallet address is the salt: an attacker can post the challenge for
 * THEIR wallet, but can't make it match a victim's wallet (since the
 * address differs).
 */
import { verifyGithub } from "./github";
import { verifyTwitter } from "./twitter";
import { verifyYouTube } from "./youtube";

export type Platform = "twitter" | "youtube" | "github" | "linkedin";

export interface VerifyResult {
  ok: boolean;
  evidence?: string;
  reason?: string;
}

export function challengeFor(wallet: string): string {
  return `Verifying my Nih wallet ${wallet.toLowerCase()}`;
}

/**
 * Generic URL-anchored verifier. The fetched URL path proves we asked
 * for THIS user (so substring spoofs from a different profile can't
 * reach this branch).
 */
async function verifyViaUrl(url: string, challenge: string): Promise<VerifyResult> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "user-agent": "Mozilla/5.0 (compatible; nih-verifier/1.0)" },
    });
    if (!res.ok) return { ok: false, reason: `${url} returned ${res.status}` };
    const text = (await res.text()).toLowerCase();
    if (text.includes(challenge.toLowerCase())) return { ok: true, evidence: url };
    return { ok: false, reason: `Challenge not found on ${url} yet. Post it then retry.` };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

export async function verify(
  platform: Platform,
  username: string,
  wallet: string,
): Promise<VerifyResult> {
  const challenge = challengeFor(wallet);
  const u = username.replace(/^@/, "");
  switch (platform) {
    case "github":   return verifyGithub(u, challenge);
    case "twitter":  return verifyTwitter(u, challenge);
    case "youtube":  return verifyYouTube(u, challenge);
    case "linkedin": return verifyViaUrl(`https://www.linkedin.com/in/${u}/`, challenge);
    default:         return { ok: false, reason: `Unsupported platform: ${platform}` };
  }
}
