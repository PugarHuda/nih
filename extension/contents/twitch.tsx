import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo";
import { useState } from "react";
import { Storage } from "@plasmohq/storage";
import { tip } from "~lib/tip";
import { TIP_PRESETS } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://www.twitch.tv/*"],
  run_at: "document_idle",
};

const storage = new Storage({ area: "local" });

/**
 * Twitch injection: anchor under the channel name in the live header.
 * Maps streamer's twitch handle to the github platform verifier (most
 * streamers share usernames; tier-1 challenge works the same way).
 */
export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  const candidates = [
    '[data-a-target="user-channel-header-item"]',
    '[data-a-target="channel-header-name"]',
    '.channel-info-content',
  ];
  for (const sel of candidates) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) return { element: el, insertPosition: "afterend" as const };
  }
  return null;
};

function extractHandle(): string | null {
  // Twitch channel pages live at /handle
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const blocked = new Set(["directory", "settings", "drops", "subscriptions", "wallet"]);
  if (blocked.has(parts[0])) return null;
  return parts[0];
}

function TwitchTipBlock() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const username = extractHandle();
  if (!username) return null;

  async function send(amt: number) {
    setBusy(true);
    try {
      const payInMezo = (await storage.get<boolean>("payInMezo")) ?? false;
      await tip({ platform: "twitter" as any, username: username!, amount: amt, payFeeInMezo: payInMezo });
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
        border: "1px solid hsl(264, 100%, 60%)",
        background: "linear-gradient(135deg, hsl(264, 80%, 8%) 0%, hsl(20, 14%, 8%) 100%)",
        color: "hsl(30, 20%, 96%)",
        fontFamily: "Inter, system-ui, sans-serif",
        maxWidth: "420px",
      }}
    >
      <p style={{ fontSize: "12px", color: "hsl(20, 8%, 70%)", marginBottom: "8px" }}>
        Tip <strong style={{ color: "hsl(30, 20%, 96%)" }}>{username}</strong> with MUSD — instant, on-chain.
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
              fontWeight: 700,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {amt}
          </button>
        ))}
      </div>
      {done && (
        <p style={{ fontSize: "12px", color: "hsl(140, 60%, 50%)", marginTop: "8px" }}>✓ Tip sent</p>
      )}
    </div>
  );
}

export default TwitchTipBlock;
