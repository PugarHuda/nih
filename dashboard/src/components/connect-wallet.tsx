"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { matsnet } from "@/lib/chain";
import { AlertTriangle } from "lucide-react";

const REQUIRED_CHAIN_ID = matsnet.id;

export function ConnectWallet() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const isWrongChain = isConnected && chainId !== REQUIRED_CHAIN_ID;

  // Auto-prompt switch when connected on wrong chain.
  useEffect(() => {
    if (!isWrongChain) return;
    switchChainAsync({ chainId: REQUIRED_CHAIN_ID }).catch((err) => {
      toast.error(`Switch to Mezo matsnet: ${err.message ?? "rejected"}`);
    });
  }, [isWrongChain, switchChainAsync]);

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!ready) return null;

        if (!connected) {
          return (
            <Button onClick={openConnectModal}>
              Connect Wallet
            </Button>
          );
        }

        if (chain.unsupported || chain.id !== REQUIRED_CHAIN_ID) {
          return (
            <Button variant="danger" size="sm" onClick={openChainModal}>
              <AlertTriangle className="h-4 w-4" />
              Wrong network
            </Button>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <span
              className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase mono"
              style={{ color: "var(--good)", letterSpacing: ".12em" }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  background: "var(--good)",
                  border: "2px solid var(--ink)",
                }}
              />
              matsnet
            </span>
            <button
              onClick={openAccountModal}
              className="mono text-xs"
              style={{
                background: "var(--paper)",
                color: "var(--ink)",
                border: "3px solid var(--ink)",
                boxShadow: "3px 3px 0 0 var(--ink)",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              {account.displayName}
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
