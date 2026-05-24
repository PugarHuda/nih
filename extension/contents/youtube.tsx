import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { DASHBOARD_URL } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*"],
  run_at: "document_idle",
};

/**
 * YouTube content script.
 *
 * Floater (channel + custom amount) + per-video inline pill under
 * the like/dislike row. Per-video target is the channel owning the
 * video; the URL's v=<id> is passed as `context` so the on-chain
 * Tipped event hashes back to the specific video.
 */

const PRESETS = [1, 5, 10, 25] as const;
const TIP_CLASS = "nih-tip-inline";

export default function NihTipFloater() {
  const [username, setUsername] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    function update() {
      setUsername(extractYouTubeHandle());
      injectPerVideoLink();
    }
    update();
    const i = setInterval(update, 2000);
    return () => clearInterval(i);
  }, []);

  if (!username) return null;

  function openTip(amount: number) {
    const url = `${DASHBOARD_URL}/tip?platform=youtube&username=${encodeURIComponent(username!)}&amount=${amount}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2147483647 }}>
      {open && (
        <div style={dropdownStyle}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Tip @{username}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {PRESETS.map((p) => (
              <button key={p} onClick={() => openTip(p)} style={pillStyle}>
                {p} MUSD
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input
              type="number"
              min={0.5}
              step={0.5}
              placeholder="custom"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              style={inputStyle}
            />
            <button
              disabled={!Number(custom)}
              onClick={() => openTip(Number(custom))}
              style={{
                ...pillStyle,
                background: Number(custom) ? "#FFD32D" : "#E8E8E8",
                cursor: Number(custom) ? "pointer" : "not-allowed",
              }}
            >
              Tip
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} style={floaterStyle}>
        <NihLogo /> Tip @{username} · MUSD
      </button>
    </div>
  );
}

function injectPerVideoLink() {
  // Only on watch pages (URL /watch?v=…)
  if (!window.location.pathname.startsWith("/watch")) return;
  if (document.querySelector(`.${TIP_CLASS}`)) return;
  const channelLink = document.querySelector(
    'ytd-video-owner-renderer a[href^="/@"]',
  ) as HTMLAnchorElement | null;
  if (!channelLink) return;
  const channel = channelLink.getAttribute("href")?.match(/^\/@([^/]+)/)?.[1];
  if (!channel) return;
  const videoId = new URLSearchParams(window.location.search).get("v") ?? "";

  // Anchor — the menu container next to like / share / save buttons.
  const anchor = document.querySelector(
    "ytd-watch-metadata #actions, ytd-menu-renderer.ytd-watch-metadata",
  );
  if (!anchor) return;

  const a = document.createElement("a");
  a.className = TIP_CLASS;
  a.href = `${DASHBOARD_URL}/tip?platform=youtube&username=${encodeURIComponent(channel)}&amount=5${
    videoId ? `&context=video:${videoId}` : ""
  }`;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.title = `Tip @${channel} 5 MUSD for this video`;
  a.textContent = "✦ Tip 5 MUSD";
  Object.assign(a.style, {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 16px",
    marginLeft: "8px",
    background: "#FFD32D",
    color: "#0A0A0A",
    border: "2px solid #0A0A0A",
    borderRadius: "20px",
    fontFamily: "Roboto, system-ui, sans-serif",
    fontSize: "13px",
    fontWeight: "700",
    textDecoration: "none",
    verticalAlign: "middle",
  } as Partial<CSSStyleDeclaration>);
  anchor.appendChild(a);
}

function extractYouTubeHandle(): string | null {
  const path = window.location.pathname;
  const at = path.match(/^\/@([^/]+)/);
  if (at) return at[1];
  const cName = path.match(/^\/c\/([^/]+)/);
  if (cName) return cName[1];
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
  cursor: "pointer",
};
const dropdownStyle: React.CSSProperties = {
  marginBottom: 8,
  background: "#FFFEF7",
  color: "#0A0A0A",
  border: "3px solid #0A0A0A",
  boxShadow: "4px 4px 0 0 #0A0A0A",
  padding: 12,
  fontFamily: "system-ui, sans-serif",
  fontSize: 13,
  width: 220,
};
const pillStyle: React.CSSProperties = {
  padding: "6px 10px",
  background: "#FFD32D",
  color: "#0A0A0A",
  border: "2px solid #0A0A0A",
  fontFamily: "system-ui, sans-serif",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};
const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "6px 8px",
  border: "2px solid #0A0A0A",
  fontFamily: "system-ui, sans-serif",
  fontSize: 13,
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
