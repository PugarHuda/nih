"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";

/**
 * Cross-context wallet bridge for the Nih extension popup.
 *
 * SECURITY: a previous version auto-fired the chrome.storage write on
 * every page mount with `?from=extension`. That let any third-party
 * site embed `<iframe src="nih-seven.vercel.app/?from=extension">` and
 * leak the user's connected wallet to the Nih extension without consent.
 *
 * Current design requires BOTH:
 *   1. A `nonce` URL query parameter that the popup generated and
 *      wrote to `chrome.storage.local.bridgeNonce` before opening this
 *      tab. The popup re-checks the nonce before accepting any
 *      `walletAddress` payload — pages without the right nonce can't
 *      pretend to be the legit extension flow.
 *   2. An explicit user-clicked button on this banner. No more silent
 *      auto-forward.
 */
export function ExtensionBridge() {
  const params = useSearchParams();
  const fromExt = params.get("from") === "extension";
  const nonce = params.get("nonce") ?? "";
  const { address, isConnected } = useAccount();
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Defensive: if the URL has `from=extension` but no nonce, refuse to
  // even render the linking UI — that's almost certainly someone trying
  // to phish the legit popup flow.
  const missingNonce = fromExt && !nonce;

  async function linkNow() {
    if (!address || !nonce) return;
    setError(null);
    const c = (window as unknown as {
      chrome?: {
        storage?: {
          local?: { set: (kv: Record<string, unknown>) => void };
        };
        runtime?: {
          sendMessage?: (extId: string, msg: unknown, cb?: () => void) => void;
          lastError?: unknown;
        };
      };
    }).chrome;
    const a = address as `0x${string}`;
    try {
      // Storage payload is BOTH the address AND the nonce the popup
      // expects. The popup only accepts the address if the nonces match.
      c?.storage?.local?.set({
        walletAddress: a,
        bridgeNonceUsed: nonce,
      });
    } catch { /* not in a real extension context */ }
    try {
      c?.runtime?.sendMessage?.(
        "nih@extension",
        { type: "wallet", address: a, nonce },
        () => { void c?.runtime?.lastError; },
      );
    } catch { /* ignore */ }
    setSynced(true);
  }

  // Clear sync state if the connected address changes — re-consent.
  useEffect(() => {
    setSynced(false);
  }, [address]);

  if (!fromExt) return null;

  if (missingNonce) {
    return (
      <div className="comic-card fixed top-4 right-4 max-w-xs z-50 p-4">
        <span className="kicker" style={{ color: "var(--bad)" }}>extension bridge · refused</span>
        <h3 className="h3 mt-1">Suspicious link</h3>
        <p className="text-[12px] mt-1 leading-snug" style={{ color: "var(--ink-3)" }}>
          A page requested wallet-bridge mode without the security nonce
          the Nih extension generates. Ignored. If you opened this from
          the extension popup yourself, click the popup&apos;s
          &quot;Connect via dashboard&quot; button again.
        </p>
      </div>
    );
  }

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
            Wallet sent to the Nih extension popup. Close this tab or
            keep using the dashboard.
          </p>
        </>
      ) : !isConnected ? (
        <>
          <h3 className="h3 mt-1">One step left.</h3>
          <p className="text-[12px] mt-1 leading-snug opacity-85">
            Connect your wallet (top right). After that, click the button
            below to share your address with the extension popup.
          </p>
        </>
      ) : (
        <>
          <h3 className="h3 mt-1">Confirm sharing.</h3>
          <p className="text-[12px] mt-1 leading-snug opacity-85">
            Send <code className="mono text-[11px]">{address?.slice(0, 6)}…{address?.slice(-4)}</code>{" "}
            to the Nih extension popup that opened this tab?
          </p>
          <button
            type="button"
            onClick={linkNow}
            className="comic-btn primary mt-3"
            style={{ fontSize: 13, padding: "6px 12px", width: "100%" }}
          >
            Send to extension
          </button>
          {error && (
            <p className="text-[11px] mt-2" style={{ color: "var(--bad)" }}>
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
