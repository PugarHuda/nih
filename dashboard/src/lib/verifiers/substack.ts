import type { VerifyResult } from "./index";

/**
 * Substack newsletter check.
 *
 * Substack maps each newsletter to {sub}.substack.com. We scan the about
 * page and recent posts page for the challenge string.
 */
export async function verifySubstack(username: string, challenge: string): Promise<VerifyResult> {
  const lower = challenge.toLowerCase();
  const sub = username.replace(/^@/, "").replace(/\.substack\.com$/, "");

  for (const url of [
    `https://${sub}.substack.com/about`,
    `https://${sub}.substack.com/`,
  ]) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "user-agent": "Mozilla/5.0 (compatible; nih-verifier/1.0)" },
      });
      if (!res.ok) continue;
      const text = (await res.text()).toLowerCase();
      if (text.includes(lower)) return { ok: true, evidence: url };
    } catch { /* next */ }
  }

  return {
    ok: false,
    reason: `Add the challenge text to your Substack about page at ${sub}.substack.com/about.`,
  };
}
