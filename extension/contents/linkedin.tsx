import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { DASHBOARD_URL } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/in/*"],
  run_at: "document_idle",
};

/**
 * Floating "Tip MUSD" button on LinkedIn profile pages.
 * URL form: linkedin.com/in/{slug}. Slug is the LinkedIn username.
 */
export default function NihTipFloater() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    function update() {
      setUsername(extractLinkedInSlug(window.location.pathname));
    }
    update();
    const i = setInterval(update, 2000);
    return () => clearInterval(i);
  }, []);

  if (!username) return null;
  const url = `${DASHBOARD_URL}/tip?platform=linkedin&username=${encodeURIComponent(username)}&amount=5`;

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

function extractLinkedInSlug(pathname: string): string | null {
  // /in/{slug} or /in/{slug}/details/...
  const m = pathname.match(/^\/in\/([^/]+)/);
  if (!m) return null;
  return decodeURIComponent(m[1]);
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
