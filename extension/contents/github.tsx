import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo";
import { useState } from "react";
import { Storage } from "@plasmohq/storage";
import { tip } from "~lib/tip";
import { TIP_PRESETS } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://github.com/*"],
  run_at: "document_idle",
};

const storage = new Storage();

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  // Profile pages have a section[itemtype*="Person"] container; anchor under the user actions
  const node = document.querySelector('div.vcard-names-container') as HTMLElement | null;
  if (!node) return null;
  return { element: node, insertPosition: "afterend" as const };
};

function GhTipButton() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const username = window.location.pathname.split("/").filter(Boolean)[0] ?? "";
  if (!username || username.startsWith("orgs")) return null;

  async function send(amt: number) {
    setBusy(true);
    try {
      const payInMezo = (await storage.get<boolean>("payInMezo")) ?? false;
      await tip({ platform: "github", username, amount: amt, payFeeInMezo: payInMezo });
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        marginTop: "12px",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid hsl(20, 10%, 16%)",
        background: "hsl(20, 14%, 8%)",
        color: "hsl(30, 20%, 96%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <p style={{ fontSize: "12px", color: "hsl(20, 8%, 60%)", marginBottom: "8px" }}>
        Tip @{username} with MUSD — Bitcoin-backed.
      </p>
      <div style={{ display: "flex", gap: "6px" }}>
        {TIP_PRESETS.map((amt) => (
          <button
            key={amt}
            disabled={busy}
            onClick={() => send(amt)}
            style={{
              flex: 1,
              height: "34px",
              background: "hsl(22, 90%, 56%)",
              color: "hsl(20, 14%, 5%)",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tip {amt}
          </button>
        ))}
      </div>
      {done && (
        <p style={{ fontSize: "12px", color: "hsl(140, 60%, 50%)", marginTop: "8px" }}>✓ Sent</p>
      )}
    </div>
  );
}

export default GhTipButton;
