import type { VerifyResult } from "./index";

/**
 * GitHub profile README check.
 *
 * Strategy: GitHub treats `github.com/{user}/{user}` as a "profile README"
 * convention. We fetch the raw README from main + master, plus pinned-gist
 * fallback via the public REST API. If the challenge string appears anywhere,
 * the handle is verified.
 *
 * Why this is strong:
 *   - Posting in your own profile README requires owning the GitHub account.
 *   - Even if an attacker forks your repo, they can't push to the original.
 *   - GitHub raw endpoints serve directly from origin — no CDN lag worse than ~30s.
 */
export async function verifyGithub(username: string, challenge: string): Promise<VerifyResult> {
  const lower = challenge.toLowerCase();
  const candidates = [
    `https://raw.githubusercontent.com/${username}/${username}/main/README.md`,
    `https://raw.githubusercontent.com/${username}/${username}/master/README.md`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const text = (await res.text()).toLowerCase();
      if (text.includes(lower)) {
        return { ok: true, evidence: url };
      }
    } catch {
      /* keep trying */
    }
  }

  // Pinned-gist fallback: scan gist list, fetch each and search.
  try {
    const res = await fetch(`https://api.github.com/users/${username}/gists?per_page=10`, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" },
    });
    if (res.ok) {
      const gists = (await res.json()) as Array<{ url: string; files: Record<string, { raw_url: string }> }>;
      for (const gist of gists.slice(0, 5)) {
        for (const file of Object.values(gist.files)) {
          try {
            const r = await fetch(file.raw_url, { cache: "no-store" });
            if (!r.ok) continue;
            const t = (await r.text()).toLowerCase();
            if (t.includes(lower)) return { ok: true, evidence: file.raw_url };
          } catch { /* next file */ }
        }
      }
    }
  } catch { /* fall through */ }

  return {
    ok: false,
    reason: `Add the challenge text to your profile README (github.com/${username}/${username}) or a public gist.`,
  };
}
