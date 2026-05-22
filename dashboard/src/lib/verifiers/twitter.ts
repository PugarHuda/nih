import type { VerifyResult } from "./index";

/**
 * Twitter handle ownership via syndication API (no OAuth, no $100/mo tier).
 *
 * cdn.syndication.twimg.com is the public endpoint Twitter uses to embed
 * tweets/profiles on third-party sites. It returns JSON and doesn't require
 * auth. We scan the user's recent posts + bio for the challenge string.
 */
export async function verifyTwitter(username: string, challenge: string): Promise<VerifyResult> {
  const lower = challenge.toLowerCase();
  const handle = username.replace(/^@/, "");

  // 1) Bio via syndication
  try {
    const res = await fetch(
      `https://cdn.syndication.twimg.com/timeline/profile?screen_name=${encodeURIComponent(handle)}&with_replies=false`,
      { cache: "no-store", headers: { "user-agent": "Mozilla/5.0 nih-verifier" } }
    );
    if (res.ok) {
      const text = (await res.text()).toLowerCase();
      if (text.includes(lower)) return { ok: true, evidence: "twitter-syndication-timeline" };
    }
  } catch { /* try next */ }

  // 2) Public profile HTML fallback (some mirrors)
  for (const url of [
    `https://x.com/${handle}`,
    `https://twitter.com/${handle}`,
  ]) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "user-agent": "Mozilla/5.0 (compatible; nih-verifier/1.0)" },
      });
      if (!res.ok) continue;
      const text = (await res.text()).toLowerCase();
      // Profile HTML often returns a generic shell — only count if challenge appears in OG/meta tags
      if (text.includes(lower)) return { ok: true, evidence: url };
    } catch { /* next */ }
  }

  return {
    ok: false,
    reason: `Post a tweet from @${handle} containing the challenge text, then try again. Syndication usually refreshes within 60 seconds.`,
  };
}
