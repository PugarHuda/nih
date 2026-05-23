import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo";
import { useState } from "react";
import { Storage } from "@plasmohq/storage";
import { tip } from "~lib/tip";
import { TIP_PRESETS } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://*.substack.com/*"],
  run_at: "document_idle",
};

const storage = new Storage({ area: "local" });

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  // Substack post page: subscribe prompt sits at top of `.post-content`
  // Newsletter home: `.subscribe-area` near the masthead
  const candidates = [
    ".subscribe-area",
    ".post-end-cta-block",
    "main .single-post",
  ];
  for (const sel of candidates) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) return { element: el, insertPosition: "afterend" as const };
  }
  return null;
};

function extractSubdomain(): string | null {
  // newsletter lives at {sub}.substack.com — use hostname's first label
  const host = window.location.hostname;
  const m = host.match(/^([\w-]+)\.substack\.com$/);
  return m ? m[1] : null;
}

function SubstackTipBlock() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const username = extractSubdomain();
  if (!username) return null;

  async function send(amt: number) {
    setBusy(true);
    try {
      const payInMezo = (await storage.get<boolean>("payInMezo")) ?? false;
      await tip({ platform: "substack", username: username!, amount: amt, payFeeInMezo: payInMezo });
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
        margin: "24px 0",
        padding: "16px",
        borderRadius: "12px",
        border: "1px solid #e2e2e2",
        background: "#fefefe",
        color: "#1a1a1a",
        fontFamily: "Georgia, serif",
        maxWidth: "640px",
      }}
    >
      <p style={{ fontSize: "13px", marginBottom: "10px", fontFamily: "system-ui, sans-serif" }}>
        Like this writing? Tip <strong>{username}</strong> with Bitcoin-backed MUSD.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", fontFamily: "system-ui, sans-serif" }}>
        {TIP_PRESETS.map((amt) => (
          <button
            key={amt}
            disabled={busy}
            onClick={() => send(amt)}
            style={{
              height: "38px",
              background: "hsl(22, 90%, 56%)",
              color: "#1a1a1a",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {amt} MUSD
          </button>
        ))}
      </div>
      {done && (
        <p style={{ fontSize: "13px", color: "hsl(140, 60%, 30%)", marginTop: "8px", fontFamily: "system-ui, sans-serif" }}>
          ✓ Tip sent
        </p>
      )}
    </div>
  );
}

export default SubstackTipBlock;
