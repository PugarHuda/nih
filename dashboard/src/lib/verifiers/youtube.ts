import type { VerifyResult } from "./index";

/**
 * YouTube channel ownership.
 *
 * We hit youtube.com/@handle and youtube.com/@handle/about — both serve
 * the channel description in the HTML payload (server-rendered for SEO).
 */
export async function verifyYouTube(username: string, challenge: string): Promise<VerifyResult> {
  const lower = challenge.toLowerCase();
  const handle = username.replace(/^@/, "");

  for (const url of [
    `https://www.youtube.com/@${handle}/about`,
    `https://www.youtube.com/@${handle}`,
    `https://www.youtube.com/c/${handle}/about`,
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
    reason: `Add the challenge text to your YouTube channel description (youtube.com/@${handle}/about).`,
  };
}
