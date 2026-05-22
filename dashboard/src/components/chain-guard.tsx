"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { matsnet } from "@/lib/chain";

/**
 * Sticky comic-style banner — only renders when the wallet is on the
 * wrong network. CSS-driven entrance keeps it light (no framer-motion
 * AnimatePresence which broke on React 19 concurrent renders).
 */
export function ChainGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending } = useSwitchChain();
  const wrong = isConnected && chainId !== matsnet.id;
  if (!wrong) return null;

  return (
    <div
      className="sticky top-0 z-50"
      style={{
        background: "var(--accent-2)",
        color: "var(--paper)",
        borderBottom: "3.5px solid var(--ink)",
        animation: "nih-pop .35s cubic-bezier(.2,.7,.2,1)",
      }}
    >
      <div className="container mx-auto flex items-center justify-between gap-4 px-6 py-2.5 text-sm">
        <div className="flex items-center gap-3">
          <span className="sfx" style={{ background: "var(--accent)", color: "var(--ink)", fontSize: 14 }}>
            POW!
          </span>
          <span className="font-semibold">
            Wrong network — Nih runs on Mezo matsnet (chainId {matsnet.id}).
          </span>
        </div>
        <button
          onClick={() => switchChainAsync({ chainId: matsnet.id })}
          disabled={isPending}
          className="comic-btn"
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            fontSize: 14,
            padding: "6px 14px",
          }}
        >
          {isPending ? "Switching…" : "Switch"}
        </button>
      </div>
    </div>
  );
}
