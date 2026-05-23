"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";

/**
 * When the Nih browser extension wants to know the user's wallet address
 * (the popup can't see window.ethereum), it opens this dashboard with
 * `?from=extension`. As soon as wagmi reports a connected address, we
 * post it to the extension via chrome.runtime.sendMessage AND mirror it
 * to chrome.storage so the popup can pick it up either way.
 *
 * Renders a small banner so the user understands what just happened —
 * "We sent your address back to the Nih extension. You can close this
 * tab or keep using the dashboard."
 */
export function ExtensionBridge() {
  const params = useSearchParams();
  const fromExt = params.get("from") === "extension";
  const { address, isConnected } = useAccount();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!fromExt || !isConnected || !address) return;
    let cancelled = false;

    async function syncAddress() {
      // Chrome extension types aren't installed in the dashboard project
      // (no @types/chrome) — access via window cast so the regular browser
      // build still type-checks while the extension can still find us.
      const c = (window as unknown as {
        chrome?: {
          storage?: { local?: { set: (kv: Record<string, unknown>) => void } };
          runtime?: {
            sendMessage?: (
              extId: string,
              msg: unknown,
              cb?: () => void,
            ) => void;
            lastError?: unknown;
          };
        };
      }).chrome;
      const a = address as `0x${string}`;
      try {
        c?.storage?.local?.set({ walletAddress: a });
      } catch { /* not in an extension context */ }
      try {
        c?.runtime?.sendMessage?.("nih@extension", { type: "wallet", address: a }, () => {
          void c?.runtime?.lastError;
        });
      } catch { /* ignore */ }
      if (!cancelled) setSynced(true);
    }

    syncAddress();
    return () => {
      cancelled = true;
    };
  }, [fromExt, isConnected, address]);

  if (!fromExt) return null;

  return (
    <div
      className="comic-card accent fixed top-4 right-4 max-w-xs z-50 p-4"
      style={{ animation: "nih-pop .35s cubic-bezier(.2,.7,.2,1)" }}
    >
      <span className="kicker" style={{ opacity: 0.7 }}>extension bridge</span>
      {synced ? (
        <>
          <h3 className="h3 mt-1">Linked.</h3>
          <p className="text-[12px] mt-1 leading-snug opacity-85">
            We sent your wallet address back to the Nih extension popup. You can
            close this tab or keep using the dashboard.
          </p>
        </>
      ) : !isConnected ? (
        <>
          <h3 className="h3 mt-1">One step left.</h3>
          <p className="text-[12px] mt-1 leading-snug opacity-85">
            The extension popup is waiting on us. Connect your wallet (top
            right) and we'll forward the address back automatically.
          </p>
        </>
      ) : (
        <>
          <h3 className="h3 mt-1">Linking…</h3>
          <p className="text-[12px] mt-1 leading-snug opacity-85">
            Sending your address to the extension popup.
          </p>
        </>
      )}
    </div>
  );
}
