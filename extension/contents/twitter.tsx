import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { DASHBOARD_URL } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*", "https://x.com/*"],
  run_at: "document_idle",
};

/**
 * Floating "Tip MUSD" button on Twitter / X profile pages.
 *
 * Why floating instead of per-tweet inject: Twitter rewrites its DOM
 * regularly and runs anti-injection heuristics. A floating button is
 * robust + still in-context (we read the username from the URL path).
 *
 * Click → open dashboard /tip with prefilled params in a new tab.
 * Dashboard already handles wagmi / RainbowKit reliably; content
 * scripts can't see window.ethereum from the page's MAIN world.
 */
export default function NihTipFloater() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    function update() {
      setUsername(extractTwitterUsername(window.location.pathname));
    }
    update();
    const i = setInterval(update, 1500);
    return () => clearInterval(i);
  }, []);

  if (!username) return null;
  const url = `${DASHBOARD_URL}/tip?platform=twitter&username=${encodeURIComponent(username)}&amount=5`;

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

function extractTwitterUsername(pathname: string): string | null {
  const skip = new Set([
    "home", "explore", "notifications", "messages", "search", "settings",
    "i", "compose", "logout", "login", "signup", "tos", "privacy",
  ]);
  const seg = pathname.split("/").filter(Boolean)[0];
  if (!seg || skip.has(seg)) return null;
  if (!/^[A-Za-z0-9_]{1,15}$/.test(seg)) return null;
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
