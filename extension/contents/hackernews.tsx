import type { PlasmoCSConfig, PlasmoGetInlineAnchorList } from "plasmo";
import { useState } from "react";
import { Storage } from "@plasmohq/storage";
import { tip } from "~lib/tip";
import { TIP_PRESETS } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://news.ycombinator.com/*"],
  run_at: "document_idle",
};

const storage = new Storage();

/**
 * Hacker News injection — anchor on `.hnuser` link present on every post/comment.
 * HN uses GitHub-like usernames so we treat them as the github platform for
 * verification (most HN users link the same name to GitHub anyway).
 */
export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  return Array.from(document.querySelectorAll("a.hnuser")).map((el) => ({
    element: el as HTMLElement,
    insertPosition: "afterend" as const,
  }));
};

function HnTipButton({ host }: { host: HTMLElement }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const username = host.textContent?.trim() ?? "";
  if (!username) return null;

  async function send() {
    setBusy(true);
    try {
      const payInMezo = (await storage.get<boolean>("payInMezo")) ?? false;
      // HN handles aren't strongly federated; we map them through the github
      // verification surface (users typically share usernames).
      await tip({ platform: "github", username, amount: 5, payFeeInMezo: payInMezo });
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span
      style={{
        marginLeft: "6px",
        fontFamily: "Verdana, Geneva, sans-serif",
      }}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          send();
        }}
        disabled={busy}
        style={{
          background: "transparent",
          color: "hsl(22, 90%, 45%)",
          border: "1px solid hsl(22, 90%, 56%)",
          borderRadius: "3px",
          padding: "0 4px",
          fontSize: "8pt",
          fontWeight: 600,
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.5 : 1,
        }}
      >
        {done ? "✓ tipped" : busy ? "…" : "tip 5 MUSD"}
      </button>
    </span>
  );
}

export default function HnTipInjector({ anchor }: any) {
  return <HnTipButton host={anchor.element as HTMLElement} />;
}
