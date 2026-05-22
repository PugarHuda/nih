import type { PlasmoCSConfig, PlasmoGetInlineAnchorList } from "plasmo";
import { useState } from "react";
import { Storage } from "@plasmohq/storage";
import { tip } from "~lib/tip";
import { TIP_PRESETS } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://www.reddit.com/*", "https://old.reddit.com/*"],
  run_at: "document_idle",
};

const storage = new Storage();

/**
 * Reddit injection — works for both new (shreddit) and old reddit.
 * We anchor on the author byline of each post/comment so the button sits
 * next to the username.
 */
export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  // Modern reddit: shreddit-post / shreddit-comment with [author] attr
  // Old reddit: .author class
  const nodes = [
    ...Array.from(document.querySelectorAll("shreddit-post, shreddit-comment")),
    ...Array.from(document.querySelectorAll(".tagline .author")),
  ];
  return nodes.map((el) => ({ element: el as HTMLElement, insertPosition: "beforeend" as const }));
};

function extractAuthor(host: HTMLElement): string | null {
  // shreddit elements expose author= attribute on the custom element
  const attr = host.getAttribute("author");
  if (attr) return attr.replace(/^u\//, "").replace(/^u_/, "");
  // old reddit anchor
  if (host.classList.contains("author")) {
    return host.textContent?.trim() ?? null;
  }
  return null;
}

function RedditTipButton({ host }: { host: HTMLElement }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const username = extractAuthor(host);
  if (!username || username.includes("[deleted]") || username === "AutoModerator") return null;

  async function send(amt: number) {
    setBusy(true);
    try {
      const payInMezo = (await storage.get<boolean>("payInMezo")) ?? false;
      await tip({ platform: "reddit" as any, username, amount: amt, payFeeInMezo: payInMezo });
      setOpen(false);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        marginLeft: "8px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((o) => !o);
        }}
        style={{
          background: "rgba(247, 147, 26, 0.15)",
          color: "hsl(22, 90%, 56%)",
          border: "1px solid rgba(247, 147, 26, 0.3)",
          borderRadius: "999px",
          padding: "2px 8px",
          fontSize: "11px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        N Tip
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 999,
            display: "flex",
            gap: "4px",
            background: "hsl(20, 14%, 8%)",
            border: "1px solid hsl(20, 10%, 16%)",
            borderRadius: "8px",
            padding: "6px",
            boxShadow: "0 6px 20px rgba(0,0,0,.4)",
          }}
        >
          {TIP_PRESETS.map((amt) => (
            <button
              key={amt}
              disabled={busy}
              onClick={() => send(amt)}
              style={{
                background: "hsl(22, 90%, 56%)",
                color: "hsl(20, 14%, 5%)",
                border: "none",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                opacity: busy ? 0.5 : 1,
              }}
            >
              {amt}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

export default function RedditTipInjector({ anchor }: any) {
  return <RedditTipButton host={anchor.element as HTMLElement} />;
}
