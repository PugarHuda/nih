import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { DASHBOARD_URL } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*", "https://x.com/*"],
  run_at: "document_idle",
};

/**
 * Twitter/X content script.
 *
 * Two-layer UX:
 *  1. Floating button bottom-right — always visible on any profile,
 *     opens a tiny amount-picker dropdown. Pick a preset or type custom →
 *     opens dashboard /tip in a new tab with prefilled params.
 *  2. Per-tweet inline "Tip" link — re-injected every ~2s onto each
 *     [data-testid="tweet"] in the timeline. Clicking it sends the
 *     wallet to /tip with the tweet's author + the URL's tweet ID as
 *     `context` so the on-chain Tipped event carries a stable hash
 *     pointing back at the original post.
 *
 * Why "open new tab" instead of inline wallet: Plasmo content scripts
 * run in ISOLATED world — no access to window.ethereum. Inline wallet
 * would require a MAIN-world bridge (Wave-2 scope).
 */

const PRESETS = [1, 5, 10, 25] as const;
const TIP_CLASS = "nih-tip-inline";

export default function NihTipFloater() {
  const [username, setUsername] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    function update() {
      setUsername(extractTwitterUsername(window.location.pathname));
      injectPerTweetLinks();
    }
    update();
    const i = setInterval(update, 1500);
    return () => clearInterval(i);
  }, []);

  if (!username) return null;

  function openTip(amount: number) {
    const url = `${DASHBOARD_URL}/tip?platform=twitter&username=${encodeURIComponent(username!)}&amount=${amount}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2147483647 }}>
      {open && (
        <div
          style={{
            marginBottom: 8,
            background: "#FFFEF7",
            color: "#0A0A0A",
            border: "3px solid #0A0A0A",
            boxShadow: "4px 4px 0 0 #0A0A0A",
            padding: 12,
            fontFamily: "system-ui, sans-serif",
            fontSize: 13,
            width: 220,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Tip @{username}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => openTip(p)}
                style={pillStyle}
              >
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
              style={{
                flex: 1,
                padding: "6px 8px",
                border: "2px solid #0A0A0A",
                fontFamily: "system-ui, sans-serif",
                fontSize: 13,
              }}
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
      <button
        onClick={() => setOpen((o) => !o)}
        title={`Tip @${username} MUSD via Nih`}
        style={floaterStyle}
      >
        <NihLogo /> Tip @{username} · MUSD
      </button>
    </div>
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

/**
 * Per-tweet inline link injection. Re-runs every ~1.5s so it survives
 * Twitter's virtualised feed (tweets unmount + remount on scroll).
 * Idempotent: we tag each link with TIP_CLASS so we don't double-inject.
 */
function injectPerTweetLinks() {
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');
  tweets.forEach((article) => {
    if (article.querySelector(`.${TIP_CLASS}`)) return; // already injected

    // Author username — robust: the User-Name container holds a /username link.
    const userLink = article.querySelector(
      'a[role="link"][href^="/"][tabindex="-1"]',
    ) as HTMLAnchorElement | null;
    const author = userLink?.getAttribute("href")?.split("/")[1] ?? "";
    if (!author || /^(home|explore|notifications|messages|i|compose)$/.test(author)) return;

    // Tweet ID — from a /status/<id> link inside the tweet.
    const statusLink = article.querySelector('a[href*="/status/"]') as HTMLAnchorElement | null;
    const tweetId = statusLink?.getAttribute("href")?.match(/\/status\/(\d+)/)?.[1] ?? "";

    // Anchor: place the link before the tweet's reply/retweet bar.
    const actionBar = article.querySelector('[role="group"]');
    if (!actionBar) return;

    const a = document.createElement("a");
    a.className = TIP_CLASS;
    a.href = `${DASHBOARD_URL}/tip?platform=twitter&username=${encodeURIComponent(author)}&amount=5${
      tweetId ? `&context=tweet:${tweetId}` : ""
    }`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.title = `Tip @${author} 5 MUSD for this tweet`;
    a.textContent = "✦ Tip MUSD";
    Object.assign(a.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "4px 8px",
      marginLeft: "12px",
      background: "#FFD32D",
      color: "#0A0A0A",
      border: "2px solid #0A0A0A",
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
      fontWeight: "700",
      textDecoration: "none",
      cursor: "pointer",
    } as Partial<CSSStyleDeclaration>);
    actionBar.appendChild(a);
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
