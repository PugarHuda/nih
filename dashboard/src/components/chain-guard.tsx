"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { matsnet } from "@/lib/chain";
import { Button } from "./ui/button";

/**
 * Sticky top-of-page banner that nags the user when their wallet is on the
 * wrong network. Auto-prompt to switch (and Add chain if unknown) lives in
 * <ConnectWallet />; this is the visual fallback when the user rejects.
 */
export function ChainGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending } = useSwitchChain();

  const wrong = isConnected && chainId !== matsnet.id;

  return (
    <AnimatePresence>
      {wrong && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="sticky top-0 z-50 bg-danger text-fg shadow-lg"
        >
          <div className="container flex items-center justify-between gap-4 py-2.5 text-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4" />
              <span>
                Wrong network — Nih only works on <strong>Mezo matsnet (chainId {matsnet.id})</strong>.
                Switch your wallet to continue.
              </span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => switchChainAsync({ chainId: matsnet.id })}
              disabled={isPending}
            >
              {isPending ? "Switching…" : "Switch network"}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
