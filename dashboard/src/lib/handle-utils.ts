import { keccak256, encodePacked } from "viem";

export type Platform =
  | "twitter"
  | "youtube"
  | "github"
  | "substack"
  | "medium"
  | "reddit"
  | "hackernews"
  | "twitch"
  | "linkedin";

export const PLATFORM_LABELS: Record<Platform, { name: string; icon: string; urlBase: string }> = {
  twitter:    { name: "Twitter / X",  icon: "𝕏",  urlBase: "https://x.com/" },
  youtube:    { name: "YouTube",      icon: "▶",  urlBase: "https://youtube.com/@" },
  github:     { name: "GitHub",       icon: "⌥",  urlBase: "https://github.com/" },
  substack:   { name: "Substack",     icon: "📰", urlBase: "https://" },
  medium:     { name: "Medium",       icon: "M",  urlBase: "https://medium.com/@" },
  reddit:     { name: "Reddit",       icon: "👽", urlBase: "https://reddit.com/u/" },
  hackernews: { name: "Hacker News",  icon: "Y",  urlBase: "https://news.ycombinator.com/user?id=" },
  twitch:     { name: "Twitch",       icon: "🎮", urlBase: "https://twitch.tv/" },
  linkedin:   { name: "LinkedIn",     icon: "in", urlBase: "https://linkedin.com/in/" },
};

export function handleIdOf(platform: Platform, username: string) {
  return keccak256(encodePacked(["string", "string", "string"], [platform, ":", username]));
}

export function profileUrl(platform: Platform, username: string) {
  const u = username.replace(/^@/, "");
  switch (platform) {
    case "twitter":    return `https://x.com/${u}`;
    case "youtube":    return `https://youtube.com/@${u}`;
    case "github":     return `https://github.com/${u}`;
    case "substack":   return `https://${u}.substack.com`;
    case "medium":     return `https://medium.com/@${u}`;
    case "reddit":     return `https://reddit.com/u/${u}`;
    case "hackernews": return `https://news.ycombinator.com/user?id=${u}`;
    case "twitch":     return `https://twitch.tv/${u}`;
    case "linkedin":   return `https://linkedin.com/in/${u}`;
  }
}

export function avatarUrl(platform: Platform, username: string): string | undefined {
  const u = username.replace(/^@/, "");
  switch (platform) {
    case "github":     return `https://github.com/${u}.png`;
    // unavatar.io proxies most platforms; falls back to a default avatar
    // if the upstream doesn't have a public picture for this handle.
    case "twitter":    return `https://unavatar.io/twitter/${u}`;
    case "youtube":    return `https://unavatar.io/youtube/${u}`;
    case "substack":   return `https://unavatar.io/substack/${u}`;
    case "medium":     return `https://unavatar.io/medium/${u}`;
    case "twitch":     return `https://unavatar.io/twitch/${u}`;
    case "reddit":     return `https://unavatar.io/reddit/${u}`;
    case "hackernews":
    case "linkedin":
    default:
      return undefined;
  }
}
