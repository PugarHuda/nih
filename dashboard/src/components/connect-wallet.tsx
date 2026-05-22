"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "./ui/button";
import { truncateAddress } from "@/lib/utils";
import { Wallet, LogOut } from "lucide-react";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <code className="text-xs text-muted px-3 py-2 bg-surface rounded-lg border border-border font-mono">
          {truncateAddress(address)}
        </code>
        <Button variant="ghost" size="icon" onClick={() => disconnect()} aria-label="Disconnect">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const injected = connectors.find((c) => c.id === "injected");

  return (
    <Button onClick={() => injected && connect({ connector: injected })} disabled={isPending}>
      <Wallet className="h-4 w-4" />
      {isPending ? "Connecting…" : "Connect Wallet"}
    </Button>
  );
}
