import "~style.css";

import { useState, useEffect } from "react";
import { Storage } from "@plasmohq/storage";
import { publicClient } from "~lib/client";
import { erc20Abi } from "~lib/abi";
import { ADDRESSES, DASHBOARD_URL, TIP_PRESETS } from "~lib/config";
import { formatEther } from "viem";

const storage = new Storage();

/**
 * Popup wallet flow.
 *
 * MetaMask / Xverse / Unisat do NOT inject `window.ethereum` into the
 * extension popup window (browser security model — extension contexts
 * are isolated from the wallet's content-script provider). So the
 * popup cannot connect a wallet directly.
 *
 * Workaround: tell the user to connect on the dashboard, then we read
 * the address back from `chrome.storage` (the dashboard writes it
 * there when it sees `?from=extension`). The popup polls storage every
 * 1.5s while waiting, then loads the balance via the public Mezo RPC.
 */
function IndexPopup() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [defaultTip, setDefaultTip] = useState<number>(5);
  const [payInMezo, setPayInMezo] = useState<boolean>(false);
  const [waitingForConnect, setWaitingForConnect] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.get<number>("defaultTip");
      if (saved) setDefaultTip(saved);
      const mezo = await storage.get<boolean>("payInMezo");
      if (mezo) setPayInMezo(mezo);
      const persistedAddr = await storage.get<string>("walletAddress");
      if (persistedAddr) {
        setAddress(persistedAddr);
        loadBalance(persistedAddr);
      }
    })();

    // Watch storage for the dashboard writing the address back after the
    // user connects from the "?from=extension" tab we opened.
    const onChange: Parameters<typeof storage.watch>[0] = {
      walletAddress: (c) => {
        const v = c.newValue as string | undefined;
        if (v) {
          setAddress(v);
          setWaitingForConnect(false);
          loadBalance(v);
        }
      },
    };
    storage.watch(onChange);
    return () => storage.unwatch(onChange);
  }, []);

  async function loadBalance(addr: string) {
    try {
      const pub = publicClient();
      const bal = await pub.readContract({
        address: ADDRESSES.MUSD,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [addr as `0x${string}`],
      });
      setBalance(formatEther(bal as bigint));
    } catch {
      // Network hiccup — leave balance at last value.
    }
  }

  function connectViaDashboard() {
    setWaitingForConnect(true);
    // Open dashboard with a hint so it auto-prompts the wallet and writes
    // the resolved address to chrome.storage.
    chrome.tabs.create({ url: `${DASHBOARD_URL}/dashboard?from=extension` });
  }

  async function disconnect() {
    setAddress(null);
    setBalance("0");
    await storage.remove("walletAddress");
  }

  async function saveSettings(value: number, mezo: boolean) {
    setDefaultTip(value);
    setPayInMezo(mezo);
    await storage.set("defaultTip", value);
    await storage.set("payInMezo", mezo);
  }

  return (
    <div className="w-[340px] bg-bg text-fg font-sans">
      <div className="border-b border-border p-4 flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-brand flex items-center justify-center text-bg font-bold">
          N
        </div>
        <span className="font-semibold text-lg">Nih</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted">matsnet</span>
      </div>

      <div className="p-4 space-y-4">
        {!address ? (
          <>
            <p className="text-sm text-muted">
              Tip MUSD on any social profile. Bitcoin-backed, self-custodial, 1-click.
            </p>
            <button
              onClick={connectViaDashboard}
              className="w-full h-10 rounded-lg bg-brand text-bg font-medium hover:opacity-90"
            >
              {waitingForConnect ? "Waiting for dashboard…" : "Connect via dashboard"}
            </button>
            <p className="text-[11px] text-muted leading-snug">
              Wallet extensions like MetaMask don't inject into popups. Click the
              button above, connect on the dashboard, and the popup will pick up
              your address automatically.
            </p>
            {waitingForConnect && (
              <button
                onClick={() => setWaitingForConnect(false)}
                className="w-full h-8 rounded-md text-xs text-muted hover:text-fg"
              >
                Cancel
              </button>
            )}
          </>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted">Balance</p>
                  <p className="text-2xl font-semibold mt-0.5">{Number(balance).toFixed(2)} MUSD</p>
                  <p className="text-xs text-muted mt-1 font-mono">
                    {address.slice(0, 6)}…{address.slice(-4)}
                  </p>
                </div>
                <button
                  onClick={disconnect}
                  className="text-[10px] text-muted hover:text-fg uppercase tracking-wider"
                >
                  unlink
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted mb-2">
                Default tip
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {TIP_PRESETS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => saveSettings(amt, payInMezo)}
                    className={`h-9 rounded-md text-xs font-medium border transition ${
                      defaultTip === amt
                        ? "bg-brand text-bg border-brand"
                        : "bg-surface border-border hover:border-brand/50"
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 cursor-pointer">
              <div>
                <p className="text-sm font-medium">Pay fee in MEZO</p>
                <p className="text-[11px] text-muted">50% off protocol fee</p>
              </div>
              <input
                type="checkbox"
                checked={payInMezo}
                onChange={(e) => saveSettings(defaultTip, e.target.checked)}
                className="h-4 w-4 accent-brand"
              />
            </label>

            <a
              href={DASHBOARD_URL + "/dashboard"}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-10 leading-10 rounded-lg border border-border text-center text-sm font-medium hover:bg-surface"
            >
              Open dashboard ↗
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default IndexPopup;
