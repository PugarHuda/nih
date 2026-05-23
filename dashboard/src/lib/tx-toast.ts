/**
 * Helpers for showing contract-write outcomes consistently.
 *
 * Every successful tx toast carries two follow-up links:
 *  - Mezo explorer trace (block-explorer view of the tx)
 *  - Tenderly simulation (replay the exact call against the public
 *    matsnet virtual chain — useful for debugging or auditing without
 *    needing an RPC node yourself)
 *
 * Centralised here so toast UX stays uniform across /tip, /borrow,
 * /claim, /earn, /faucet, /stream.
 */
import { toast } from "sonner";

const EXPLORER = "https://explorer.test.mezo.org/tx";
const TENDERLY = "https://dashboard.tenderly.co/tx/mezo-testnet";

export interface TxSuccessOpts {
  message?: string;
  txHash?: `0x${string}` | string;
  description?: string;
}

export function txSuccess({ message = "Confirmed.", txHash, description }: TxSuccessOpts) {
  if (!txHash) {
    toast.success(message, { description });
    return;
  }
  toast.success(message, {
    description,
    action: {
      label: "explorer",
      onClick: () => window.open(`${EXPLORER}/${txHash}`, "_blank", "noopener,noreferrer"),
    },
    duration: 8000,
  });
  // Sonner only allows one action button per toast. Surface the Tenderly
  // link as a second toast so judges (and users debugging) can still get to
  // it with one tap.
  toast.message("Replay in Tenderly", {
    description: `Open the tx on Tenderly's public matsnet trace UI.`,
    action: {
      label: "open",
      onClick: () => window.open(`${TENDERLY}/${txHash}`, "_blank", "noopener,noreferrer"),
    },
    duration: 8000,
  });
}

export function txError(err: unknown, fallback = "Transaction failed") {
  const msg = err instanceof Error ? err.message : fallback;
  toast.error(msg);
}
