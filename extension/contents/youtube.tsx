import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo";
import { useState } from "react";
import { Storage } from "@plasmohq/storage";
import { tip } from "~lib/tip";
import { TIP_PRESETS } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*"],
  run_at: "document_idle",
};

const storage = new Storage();

/**
 * Anchor strategy:
 *  - Channel pages have a #channel-header-container element with the
 *    subscribe button. We attach below the subscribe row.
 *  - Watch pages have #owner with channel name + subscribe; we attach there.
 */
export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  const candidates = [
    "#channel-header-container",
    "#inner-header-container",
    "ytd-watch-metadata #owner",
  ];
  for (const sel of candidates) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) return { element: el, insertPosition: "afterend" as const };
  }
  return null;
};

function extractHandle(): string | null {
  // /@handle URL form (modern YouTube)
  const path = window.location.pathname;
  const at = path.match(/\/@([\w.-]+)/);
  if (at) return at[1];
  // /c/Name or /channel/UCxxx — extract Name; harder to verify, but we try
  const c = path.match(/\/c\/([\w.-]+)/);
  if (c) return c[1];
  // Watch page — pull from ytd-channel-name link
  const link = document.querySelector('ytd-channel-name a[href^="/@"]') as HTMLAnchorElement | null;
  if (link) {
    const href = link.getAttribute("href") ?? "";
    const m = href.match(/^\/@([\w.-]+)/);
    if (m) return m[1];
  }
  return null;
}

function YouTubeTipButton() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const username = extractHandle();
  if (!username) return null;

  async function send(amt: number) {
    setBusy(true);
    try {
      const payInMezo = (await storage.get<boolean>("payInMezo")) ?? false;
      await tip({ platform: "youtube", username: username!, amount: amt, payFeeInMezo: payInMezo });
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        margin: "12px 0",
        padding: "12px 14px",
        borderRadius: "12px",
        border: "1px solid hsl(20, 10%, 16%)",
        background: "hsl(20, 14%, 8%)",
        color: "hsl(30, 20%, 96%)",
        fontFamily: "Roboto, system-ui, sans-serif",
        maxWidth: "520px",
      }}
    >
      <p style={{ fontSize: "12px", color: "hsl(20, 8%, 60%)", marginBottom: "8px" }}>
        Tip <strong style={{ color: "hsl(30, 20%, 96%)" }}>@{username}</strong> with MUSD — Bitcoin-backed.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
        {TIP_PRESETS.map((amt) => (
          <button
            key={amt}
            disabled={busy}
            onClick={() => send(amt)}
            style={{
              height: "34px",
              background: "hsl(22, 90%, 56%)",
              color: "hsl(20, 14%, 5%)",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            Tip {amt}
          </button>
        ))}
      </div>
      {done && (
        <p style={{ fontSize: "12px", color: "hsl(140, 60%, 50%)", marginTop: "8px" }}>✓ Tip sent</p>
      )}
    </div>
  );
}

export default YouTubeTipButton;
