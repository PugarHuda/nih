import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo";
import { useState } from "react";
import { Storage } from "@plasmohq/storage";
import { tip } from "~lib/tip";
import { TIP_PRESETS } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/in/*"],
  run_at: "document_idle",
};

const storage = new Storage();

/**
 * LinkedIn injection. LinkedIn aggressively rewrites the DOM, so the
 * anchor strategy needs to be resilient — we target a few stable
 * containers in the profile top card and fall back to the action bar.
 */
export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  const candidates = [
    "main .pv-top-card-v2-ctas",
    "main .pv-top-card",
    "main section.artdeco-card",
  ];
  for (const sel of candidates) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) return { element: el, insertPosition: "afterend" as const };
  }
  return null;
};

function extractHandle(): string | null {
  // /in/handle/ — vanity URL or numeric
  const match = window.location.pathname.match(/^\/in\/([^/]+)/);
  return match ? match[1] : null;
}

function LinkedInTipBlock() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const username = extractHandle();
  if (!username) return null;

  async function send(amt: number) {
    setBusy(true);
    try {
      const payInMezo = (await storage.get<boolean>("payInMezo")) ?? false;
      await tip({ platform: "medium" as any, username: username!, amount: amt, payFeeInMezo: payInMezo });
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      style={{
        margin: "16px 0",
        padding: "16px 20px",
        borderRadius: "8px",
        border: "1px solid #d4d4d4",
        background: "#ffffff",
        color: "#1a1a1a",
        fontFamily: "system-ui, sans-serif",
        maxWidth: "640px",
        boxShadow: "0 1px 3px rgba(0,0,0,.08)",
      }}
    >
      <p style={{ fontSize: "13px", marginBottom: "10px" }}>
        Tip <strong>{username}</strong> on the spot — Bitcoin-backed MUSD, no platform fee.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        {TIP_PRESETS.map((amt) => (
          <button
            key={amt}
            disabled={busy}
            onClick={() => send(amt)}
            style={{
              height: "36px",
              background: "hsl(22, 90%, 56%)",
              color: "#1a1a1a",
              border: "none",
              borderRadius: "16px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {amt} MUSD
          </button>
        ))}
      </div>
      {done && <p style={{ fontSize: "13px", color: "hsl(140, 60%, 30%)", marginTop: "8px" }}>✓ Tip sent</p>}
    </section>
  );
}

export default LinkedInTipBlock;
