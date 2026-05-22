import type { VerifyResult } from "./index";

/**
 * Medium profile check.
 *
 * Medium serves public bio + recent stories at medium.com/@handle.
 * We grep the public HTML for the challenge string.
 */
export async function verifyMedium(username: string, challenge: string): Promise<VerifyResult> {
  const lower = challenge.toLowerCase();
  const handle = username.replace(/^@/, "");

  for (const url of [
    `https://medium.com/@${handle}`,
    `https://medium.com/@${handle}/about`,
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
    reason: `Add the challenge text to your Medium bio or pinned story at medium.com/@${handle}.`,
  };
}
