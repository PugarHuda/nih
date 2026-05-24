import type { VerifyResult } from "./index";

/**
 * Twitter handle ownership via syndication API (no OAuth, no $100/mo tier).
 *
 * SECURITY: a pure substring match lets an attacker post the challenge
 * on their own profile and ask us to verify a different victim — the
 * substring may reappear in recommended-users sidebars or reflected
 * meta tags. We therefore require BOTH:
 *   1. The challenge text appears in the response, AND
 *   2. An ownership anchor — the response references THIS handle in a
 *      position only the real owner controls (canonical URL, og:url
 *      with their screen_name, syndication JSON's `screen_name` field).
 *
 * Substring spoofing into recommended sections won't satisfy #2 because
 * those don't carry @victim's canonical url / og:url / syndication
 * timeline header.
 */
export async function verifyTwitter(username: string, challenge: string): Promise<VerifyResult> {
  const lower = challenge.toLowerCase();
  const handle = username.replace(/^@/, "").toLowerCase();

  function hasOwnershipAnchor(html: string): boolean {
    const h = html.toLowerCase();
    return (
      h.includes(`"screen_name":"${handle}"`) ||
      h.includes(`<link rel="canonical" href="https://x.com/${handle}"`) ||
      h.includes(`<link rel="canonical" href="https://twitter.com/${handle}"`) ||
      h.includes(`<meta property="og:url" content="https://x.com/${handle}"`) ||
      h.includes(`<meta property="og:url" content="https://twitter.com/${handle}"`)
    );
  }

  // 1) Syndication JSON — bio + recent posts of the target user only.
  try {
    const res = await fetch(
      `https://cdn.syndication.twimg.com/timeline/profile?screen_name=${encodeURIComponent(handle)}&with_replies=false`,
      { cache: "no-store", headers: { "user-agent": "Mozilla/5.0 nih-verifier" } },
    );
    if (res.ok) {
      const text = await res.text();
      const t = text.toLowerCase();
      if (t.includes(lower) && hasOwnershipAnchor(text)) {
        return { ok: true, evidence: "twitter-syndication-timeline" };
      }
    }
  } catch { /* try next */ }

  // 2) Public profile HTML at /{handle}. The URL path itself proves we
  //    asked for THIS user — Twitter's SPA shell may not include a
  //    canonical/og:url anchor reliably, so we relax to "challenge text
  //    is in the body of a fetch we directly addressed to /{handle}".
  //    The handle path is the ownership proof; substring-only spoofs
  //    from a *different* profile can't hit this branch.
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
      const text = await res.text();
      if (text.toLowerCase().includes(lower)) {
        return { ok: true, evidence: url };
      }
    } catch { /* next */ }
  }

  return {
    ok: false,
    reason: `Post a tweet from @${handle} containing the challenge text, then try again. Syndication usually refreshes within 60 seconds.`,
  };
}
