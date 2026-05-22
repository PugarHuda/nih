import { keccak256, encodePacked } from "viem";

export type Platform = "twitter" | "youtube" | "github" | "substack" | "medium";

export const PLATFORM_LABELS: Record<Platform, { name: string; icon: string; urlBase: string }> = {
  twitter: { name: "Twitter / X", icon: "𝕏", urlBase: "https://x.com/" },
  youtube: { name: "YouTube", icon: "▶", urlBase: "https://youtube.com/@" },
  github: { name: "GitHub", icon: "⌥", urlBase: "https://github.com/" },
  substack: { name: "Substack", icon: "📰", urlBase: "https://" },
  medium: { name: "Medium", icon: "M", urlBase: "https://medium.com/@" },
};

export function handleIdOf(platform: Platform, username: string) {
  return keccak256(encodePacked(["string", "string", "string"], [platform, ":", username]));
}

export function profileUrl(platform: Platform, username: string) {
  const u = username.replace(/^@/, "");
  switch (platform) {
    case "twitter":
      return `https://x.com/${u}`;
    case "youtube":
      return `https://youtube.com/@${u}`;
    case "github":
      return `https://github.com/${u}`;
    case "substack":
      return `https://${u}.substack.com`;
    case "medium":
      return `https://medium.com/@${u}`;
  }
}

export function avatarUrl(platform: Platform, username: string): string | undefined {
  const u = username.replace(/^@/, "");
  switch (platform) {
    case "github":
      return `https://github.com/${u}.png`;
    case "twitter":
      // unavi unavatar.io proxies popular platforms; works for x.com
      return `https://unavatar.io/twitter/${u}`;
    case "youtube":
      return `https://unavatar.io/youtube/${u}`;
    case "substack":
      return `https://unavatar.io/substack/${u}`;
    case "medium":
      return `https://unavatar.io/medium/${u}`;
  }
}
