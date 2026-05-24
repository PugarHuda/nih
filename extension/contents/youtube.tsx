import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { DASHBOARD_URL } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*"],
  run_at: "document_idle",
};

/**
 * Floating "Tip MUSD" button on YouTube channel pages.
 * Extracts the @handle from the URL path or canonical link.
 * Clicking opens the dashboard /tip flow in a new tab.
 */
export default function NihTipFloater() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    function update() {
      setUsername(extractYouTubeHandle());
    }
    update();
    const i = setInterval(update, 2000);
    return () => clearInterval(i);
  }, []);

  if (!username) return null;
  const url = `${DASHBOARD_URL}/tip?platform=youtube&username=${encodeURIComponent(username)}&amount=5`;

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

function extractYouTubeHandle(): string | null {
  // URL forms:
  //   /@handle, /@handle/featured, /@handle/videos, /c/Name, /user/Name
  const path = window.location.pathname;
  const at = path.match(/^\/@([^/]+)/);
  if (at) return at[1];
  const cName = path.match(/^\/c\/([^/]+)/);
  if (cName) return cName[1];
  // Watch page — try to read the channel link.
  const channelLink = document.querySelector(
    'ytd-channel-name a[href^="/@"], ytd-video-owner-renderer a[href^="/@"]',
  ) as HTMLAnchorElement | null;
  if (channelLink) {
    const href = channelLink.getAttribute("href") ?? "";
    const m = href.match(/^\/@([^/]+)/);
    if (m) return m[1];
  }
  return null;
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
