import { keccak256, encodePacked } from "viem";

// Cut to 4 platforms for the hackathon demo. The contract + verifier
// accept arbitrary platform strings, so adding more later is a single
// const change here + matching server-side verifier in lib/verifiers.
export type Platform = "twitter" | "youtube" | "github" | "linkedin";

export const PLATFORM_LABELS: Record<Platform, { name: string; icon: string; urlBase: string }> = {
  twitter:  { name: "Twitter / X", icon: "𝕏",  urlBase: "https://x.com/" },
  youtube:  { name: "YouTube",     icon: "▶",  urlBase: "https://youtube.com/@" },
  github:   { name: "GitHub",      icon: "⌥",  urlBase: "https://github.com/" },
  linkedin: { name: "LinkedIn",    icon: "in", urlBase: "https://linkedin.com/in/" },
};

export function handleIdOf(platform: Platform, username: string) {
  return keccak256(encodePacked(["string", "string", "string"], [platform, ":", username]));
}

export function profileUrl(platform: Platform, username: string) {
  const u = username.replace(/^@/, "");
  switch (platform) {
    case "twitter":  return `https://x.com/${u}`;
    case "youtube":  return `https://youtube.com/@${u}`;
    case "github":   return `https://github.com/${u}`;
    case "linkedin": return `https://linkedin.com/in/${u}`;
  }
}

export function avatarUrl(platform: Platform, username: string): string | undefined {
  const u = username.replace(/^@/, "");
  switch (platform) {
    case "github":   return `https://github.com/${u}.png`;
    case "twitter":  return `https://unavatar.io/twitter/${u}`;
    case "youtube":  return `https://unavatar.io/youtube/${u}`;
    case "linkedin":
    default:
      return undefined;
  }
}
