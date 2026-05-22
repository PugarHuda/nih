import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo";
import { useState } from "react";
import { Storage } from "@plasmohq/storage";
import { tip } from "~lib/tip";
import { TIP_PRESETS } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://medium.com/*", "https://*.medium.com/*"],
  run_at: "document_idle",
};

const storage = new Storage();

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  // Medium article page: footer with "Follow" button sits under `article footer`
  // Profile page: the user name header is in `header[role=banner]`
  const candidates = [
    "article footer",
    "section[data-test-id='post-actions-footer']",
    "main",
  ];
  for (const sel of candidates) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) return { element: el, insertPosition: "beforeend" as const };
  }
  return null;
};

function extractHandle(): string | null {
  // /@handle pattern
  const path = window.location.pathname;
  const m = path.match(/\/@([\w.-]+)/);
  if (m) return m[1];
  // username.medium.com subdomain
  const host = window.location.hostname;
  const sub = host.match(/^([\w-]+)\.medium\.com$/);
  if (sub && sub[1] !== "www") return sub[1];
  return null;
}

function MediumTipBlock() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const username = extractHandle();
  if (!username) return null;

  async function send(amt: number) {
    setBusy(true);
    try {
      const payInMezo = (await storage.get<boolean>("payInMezo")) ?? false;
      await tip({ platform: "medium", username: username!, amount: amt, payFeeInMezo: payInMezo });
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
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #eaeaea",
        background: "#fafafa",
        color: "#191919",
        fontFamily: "'Source Serif Pro', Georgia, serif",
        maxWidth: "680px",
      }}
    >
      <p style={{ fontSize: "14px", marginBottom: "12px", fontFamily: "system-ui, sans-serif" }}>
        Worth a tip? Send <strong>@{username}</strong> some Bitcoin-backed MUSD.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", fontFamily: "system-ui, sans-serif" }}>
        {TIP_PRESETS.map((amt) => (
          <button
            key={amt}
            disabled={busy}
            onClick={() => send(amt)}
            style={{
              height: "40px",
              background: "hsl(22, 90%, 56%)",
              color: "#191919",
              border: "none",
              borderRadius: "20px",
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
        <p style={{ fontSize: "13px", color: "hsl(140, 60%, 30%)", marginTop: "10px", fontFamily: "system-ui, sans-serif" }}>
          ✓ Tip sent
        </p>
      )}
    </div>
  );
}

export default MediumTipBlock;
