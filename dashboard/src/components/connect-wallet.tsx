"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { truncateAddress } from "@/lib/utils";
import { matsnet } from "@/lib/chain";
import { Wallet, LogOut, AlertTriangle } from "lucide-react";

const REQUIRED_CHAIN_ID = matsnet.id;

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const isWrongChain = isConnected && chainId !== REQUIRED_CHAIN_ID;

  // Auto-prompt switch when a wallet is connected on the wrong chain.
  // MetaMask falls through to wallet_addEthereumChain if Mezo isn't known yet.
  useEffect(() => {
    if (!isWrongChain) return;
    switchChainAsync({ chainId: REQUIRED_CHAIN_ID }).catch((err) => {
      toast.error(`Switch to Mezo matsnet to continue: ${err.message ?? "rejected"}`);
    });
  }, [isWrongChain, switchChainAsync]);

  async function handleConnect() {
    const injected = connectors.find((c) => c.id === "injected");
    if (!injected) return;
    try {
      await connect({ connector: injected, chainId: REQUIRED_CHAIN_ID });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (isConnected && address) {
    if (isWrongChain) {
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => switchChainAsync({ chainId: REQUIRED_CHAIN_ID })}
            disabled={isSwitching}
          >
            <AlertTriangle className="h-4 w-4" />
            {isSwitching ? "Switching…" : "Switch to Mezo"}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => disconnect()} aria-label="Disconnect">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          matsnet
        </span>
        <code className="text-xs text-muted px-3 py-2 bg-surface rounded-lg border border-border font-mono">
          {truncateAddress(address)}
        </code>
        <Button variant="ghost" size="icon" onClick={() => disconnect()} aria-label="Disconnect">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} disabled={isPending}>
      <Wallet className="h-4 w-4" />
      {isPending ? "Connecting…" : "Connect Wallet"}
    </Button>
  );
}
