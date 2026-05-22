import "~style.css";

import { useState, useEffect } from "react";
import { Storage } from "@plasmohq/storage";
import { walletClient, publicClient, ensureChain } from "~lib/client";
import { erc20Abi } from "~lib/abi";
import { ADDRESSES, DASHBOARD_URL, TIP_PRESETS } from "~lib/config";
import { formatEther } from "viem";

const storage = new Storage();

function IndexPopup() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [defaultTip, setDefaultTip] = useState<number>(5);
  const [payInMezo, setPayInMezo] = useState<boolean>(false);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);

  const targetChainId = 31611;
  const isWrongChain = walletChainId !== null && walletChainId !== targetChainId;

  useEffect(() => {
    (async () => {
      const saved = await storage.get<number>("defaultTip");
      if (saved) setDefaultTip(saved);
      const mezo = await storage.get<boolean>("payInMezo");
      if (mezo) setPayInMezo(mezo);

      // Subscribe to wallet chain changes so the popup stays in sync.
      const eth = (window as any).ethereum;
      if (!eth) return;
      try {
        const cid: string = await eth.request({ method: "eth_chainId" });
        setWalletChainId(parseInt(cid, 16));
        eth.on?.("chainChanged", (hex: string) => setWalletChainId(parseInt(hex, 16)));
      } catch {}
    })();
  }, []);

  async function connect() {
    try {
      await ensureChain();
      const wallet = walletClient();
      if (!wallet) throw new Error("No wallet detected — install MetaMask/Xverse");
      const [acc] = await wallet.requestAddresses();
      setAddress(acc);

      const eth = (window as any).ethereum;
      if (eth) {
        const cid: string = await eth.request({ method: "eth_chainId" });
        setWalletChainId(parseInt(cid, 16));
      }

      const pub = publicClient();
      const bal = await pub.readContract({
        address: ADDRESSES.MUSD,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [acc],
      });
      setBalance(formatEther(bal as bigint));
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function fixChain() {
    try {
      await ensureChain();
    } catch (err) {
      alert((err as Error).message);
    }
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
        <span
          className={`ml-auto text-[10px] uppercase tracking-wider ${
            isWrongChain ? "text-red-400" : "text-muted"
          }`}
        >
          {isWrongChain ? `wrong chain (${walletChainId})` : "matsnet"}
        </span>
      </div>

      {isWrongChain && (
        <div className="border-b border-border bg-red-500/10 p-3 text-xs">
          <p className="text-red-300 mb-2">
            Your wallet is on chain <strong>{walletChainId}</strong>. Nih needs Mezo matsnet (31611).
          </p>
          <button
            onClick={fixChain}
            className="w-full h-8 rounded-md bg-red-500 text-bg text-xs font-medium hover:opacity-90"
          >
            Switch to Mezo matsnet
          </button>
        </div>
      )}

      <div className="p-4 space-y-4">
        {!address ? (
          <>
            <p className="text-sm text-muted">
              Tip MUSD on any social profile. Bitcoin-backed, self-custodial, 1-click.
            </p>
            <button
              onClick={connect}
              className="w-full h-10 rounded-lg bg-brand text-bg font-medium hover:opacity-90"
            >
              Connect wallet
            </button>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted">Balance</p>
              <p className="text-2xl font-semibold mt-0.5">{Number(balance).toFixed(2)} MUSD</p>
              <p className="text-xs text-muted mt-1 font-mono">
                {address.slice(0, 6)}…{address.slice(-4)}
              </p>
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
