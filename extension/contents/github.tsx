import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { DASHBOARD_URL } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://github.com/*"],
  run_at: "document_idle",
};

/**
 * Floating "Tip MUSD" button on GitHub user pages.
 * URL form: github.com/{username} or github.com/{username}/{repo}.
 * Repo pages: tip routes to the OWNER (the {username} segment).
 */
export default function NihTipFloater() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    function update() {
      setUsername(extractGitHubUsername(window.location.pathname));
    }
    update();
    const i = setInterval(update, 2000);
    return () => clearInterval(i);
  }, []);

  if (!username) return null;
  const url = `${DASHBOARD_URL}/tip?platform=github&username=${encodeURIComponent(username)}&amount=5`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Tip @${username} MUSD via Nih`}
      style={floaterStyle}
    >
      <NihLogo /> Tip @{username} · MUSD
    </a>
  );
}

function extractGitHubUsername(pathname: string): string | null {
  const skip = new Set([
    "settings", "notifications", "explore", "marketplace", "topics", "trending",
    "pulls", "issues", "discussions", "codespaces", "sponsors", "search",
    "logout", "login", "join", "new", "organizations", "features", "site",
    "about", "pricing", "enterprise", "team", "customer-stories", "security",
  ]);
  const seg = pathname.split("/").filter(Boolean)[0];
  if (!seg || skip.has(seg)) return null;
  // GitHub usernames: 1-39 chars alphanum + hyphens (no leading hyphen)
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(seg)) return null;
  return seg;
}

const floaterStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 24,
  right: 24,
  zIndex: 2147483647,
  background: "#FFD32D",
  color: "#0A0A0A",
  border: "3px solid #0A0A0A",
  boxShadow: "4px 4px 0 0 #0A0A0A",
  padding: "10px 16px",
  fontFamily: "system-ui, sans-serif",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

function NihLogo() {
  return (
    <span
      style={{
        display: "inline-flex",
        width: 22,
        height: 22,
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0A0A",
        color: "#FFD32D",
        fontFamily: "system-ui",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      N
    </span>
  );
}
