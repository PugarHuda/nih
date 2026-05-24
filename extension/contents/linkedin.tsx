import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { DASHBOARD_URL } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/in/*", "https://www.linkedin.com/feed/*", "https://www.linkedin.com/posts/*"],
  run_at: "document_idle",
};

/**
 * LinkedIn content script.
 *
 * Floater appears on profile + post + feed pages.
 * Per-post injection: best-effort — LinkedIn rewrites its DOM
 * aggressively + ships anti-scraping. We target the stable
 * `[data-urn^="urn:li:activity:"]` containers used by their feed,
 * find the author's profile link, and append a "Tip" pill.
 */

const PRESETS = [1, 5, 10, 25] as const;
const TIP_CLASS = "nih-tip-inline";

export default function NihTipFloater() {
  const [username, setUsername] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    function update() {
      setUsername(extractLinkedInSlug(window.location.pathname));
      injectPerPostLinks();
    }
    update();
    const i = setInterval(update, 2000);
    return () => clearInterval(i);
  }, []);

  if (!username) return null;

  function openTip(amount: number) {
    const url = `${DASHBOARD_URL}/tip?platform=linkedin&username=${encodeURIComponent(username!)}&amount=${amount}`;
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

function extractLinkedInSlug(pathname: string): string | null {
  const m = pathname.match(/^\/in\/([^/]+)/);
  if (m) return decodeURIComponent(m[1]);
  // Post URLs: /posts/{slug}_{activityId}
  const p = pathname.match(/^\/posts\/([^_/?]+)/);
  if (p) return decodeURIComponent(p[1]);
  return null;
}

function injectPerPostLinks() {
  // LinkedIn posts in the feed live in [data-urn^="urn:li:activity:"]
  const posts = document.querySelectorAll('[data-urn^="urn:li:activity:"]');
  posts.forEach((post) => {
    if (post.querySelector(`.${TIP_CLASS}`)) return;
    const authorLink = post.querySelector('a[href*="/in/"]') as HTMLAnchorElement | null;
    if (!authorLink) return;
    const m = authorLink.getAttribute("href")?.match(/\/in\/([^/?]+)/);
    if (!m) return;
    const handle = decodeURIComponent(m[1]);

    // Anchor: append to the post's social-actions bar (reactions / comment / repost).
    const actions = post.querySelector(".feed-shared-social-actions, .social-actions-bar");
    if (!actions) return;

    const a = document.createElement("a");
    a.className = TIP_CLASS;
    a.href = `${DASHBOARD_URL}/tip?platform=linkedin&username=${encodeURIComponent(handle)}&amount=5`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.title = `Tip @${handle} 5 MUSD for this post`;
    a.textContent = "✦ Tip MUSD";
    Object.assign(a.style, {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      marginLeft: "8px",
      background: "#FFD32D",
      color: "#0A0A0A",
      border: "2px solid #0A0A0A",
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      fontWeight: "700",
      textDecoration: "none",
      verticalAlign: "middle",
    } as Partial<CSSStyleDeclaration>);
    actions.appendChild(a);
  });
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
