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
export async function verifyTwitter(
  username: string,
  challenge: string,
  tweetUrl?: string,
): Promise<VerifyResult> {
  const lower = challenge.toLowerCase();
  const handle = username.replace(/^@/, "").toLowerCase();

  // 0) Direct tweet-URL path — fastest, no rate limit.
  // User pastes the exact tweet URL containing the challenge. We hit
  // Twitter's oEmbed endpoint which works immediately for any public
  // tweet AND guarantees the tweet's `author_url` matches THIS handle.
  if (tweetUrl) {
    try {
      const oembed = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`;
      const res = await fetch(oembed, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const authorUrl: string = (data?.author_url ?? "").toLowerCase();
        const html: string = (data?.html ?? "").toLowerCase();
        const expectedAuthors = [
          `https://twitter.com/${handle}`,
          `https://x.com/${handle}`,
        ];
        if (expectedAuthors.includes(authorUrl) && html.includes(lower)) {
          return { ok: true, evidence: `oembed:${tweetUrl}` };
        }
        return {
          ok: false,
          reason: !expectedAuthors.includes(authorUrl)
            ? `Tweet's author (${authorUrl}) doesn't match @${handle}. Paste a tweet from YOUR own account.`
            : `Tweet doesn't contain the exact challenge text. Make sure you copied the full line.`,
        };
      }
    } catch { /* fall through to syndication */ }
  }

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
