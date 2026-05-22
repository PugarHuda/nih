"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useCallback } from "react";
import { toast } from "sonner";
import { matsnet } from "./chain";

/**
 * Gate any tx-write action on being on the right chain.
 *
 * Usage:
 *   const { ensure, isReady, isWrongChain } = useRequireChain();
 *   async function send() {
 *     if (!(await ensure())) return;            // pops MetaMask switch dialog
 *     await writeContractAsync({ ... });
 *   }
 */
export function useRequireChain() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending } = useSwitchChain();

  const isWrongChain = isConnected && chainId !== matsnet.id;
  const isReady = isConnected && chainId === matsnet.id;

  const ensure = useCallback(async (): Promise<boolean> => {
    if (!isConnected) {
      toast.error("Connect your wallet first");
      return false;
    }
    if (chainId === matsnet.id) return true;
    try {
      await switchChainAsync({ chainId: matsnet.id });
      return true;
    } catch (err) {
      toast.error(`Switch to Mezo matsnet to continue: ${(err as Error).message ?? "rejected"}`);
      return false;
    }
  }, [isConnected, chainId, switchChainAsync]);

  return { ensure, isReady, isWrongChain, isSwitching: isPending };
}
