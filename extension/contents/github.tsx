import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { Storage } from "@plasmohq/storage";
import { DASHBOARD_URL } from "~lib/config";
import { TipPanel } from "~components/TipPanel";

const storage = new Storage({ area: "local" });

export const config: PlasmoCSConfig = {
  matches: ["https://github.com/*"],
  run_at: "document_idle",
};

/**
 * GitHub content script.
 *
 * Floater: tip the {owner} of any /{owner}* path.
 * Per-element injection:
 *  - On a PR or issue page (github.com/{owner}/{repo}/pull/{n} or /issues/{n}),
 *    add a "Tip OP X MUSD" button to the author meta line of every comment.
 *  - The OP (issue/PR opener) is the natural tip target; threaded
 *    commenters are detected via their .author link.
 */

const TIP_CLASS = "nih-tip-inline";

export default function NihTipFloater() {
  const [username, setUsername] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [defaultTip, setDefaultTip] = useState(5);
  const [payInMezo, setPayInMezo] = useState(false);

  useEffect(() => {
    storage.get<number>("defaultTip").then((v) => { if (v && Number(v) > 0) setDefaultTip(Number(v)); });
    storage.get<boolean>("payInMezo").then((v) => setPayInMezo(!!v));
    function update() {
      setUsername(extractGitHubUsername(window.location.pathname));
      injectPerCommentLinks(defaultTip);
    }
    update();
    const i = setInterval(update, 2000);
    return () => clearInterval(i);
  }, [defaultTip]);

  if (!username) return null;

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2147483647 }}>
      {open && (
        <TipPanel
          username={username}
          platform="github"
          payInMezo={payInMezo}
          returnUrl={window.location.href}
          onClose={() => setOpen(false)}
        />
      )}
      <button onClick={() => setOpen((o) => !o)} style={floaterStyle}>
        <NihLogo /> Tip @{username} · MUSD
      </button>
    </div>
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
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(seg)) return null;
  return seg;
}

/**
 * Per-comment tip link inside PR / issue / discussion threads.
 * Selector: `.timeline-comment-header .author` is GitHub's stable
 * comment-author link. Injected once per comment.
 */
function injectPerCommentLinks(defaultTip = 5) {
  const headers = document.querySelectorAll(".timeline-comment-header");
  headers.forEach((h) => {
    if (h.querySelector(`.${TIP_CLASS}`)) return;
    const author = h.querySelector(".author") as HTMLAnchorElement | null;
    if (!author) return;
    const handle = author.textContent?.trim().replace(/^@/, "") ?? "";
    if (!handle) return;

    const a = document.createElement("a");
    a.className = TIP_CLASS;
    a.href = `${DASHBOARD_URL}/tip?platform=github&username=${encodeURIComponent(handle)}&amount=${defaultTip}&return=${encodeURIComponent(window.location.href)}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.title = `Tip @${handle} ${defaultTip} MUSD for this comment`;
    a.textContent = `✦ Tip ${defaultTip} MUSD`;
    Object.assign(a.style, {
      display: "inline-block",
      padding: "2px 8px",
      marginLeft: "8px",
      background: "#FFD32D",
      color: "#0A0A0A",
      border: "1.5px solid #0A0A0A",
      borderRadius: "3px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      fontWeight: "700",
      textDecoration: "none",
    } as Partial<CSSStyleDeclaration>);
    h.appendChild(a);
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
