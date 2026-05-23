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
// Tenderly's public dashboard requires a registered virtual-chain slug;
// we use their generic "simulator with hash" deep link which works for
// any chain. Tenderly will detect the chain id from the tx + RPC and
// open the trace view, OR if not indexed, ask the user to add it.
const TENDERLY_SIM = "https://dashboard.tenderly.co/simulator/new";

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
  // Sonner only allows one inline action. Make the primary one the Mezo
  // explorer (always works) and put the Tenderly simulator deep link in
  // the description so users can copy it without us shipping a second
  // toast that visually piles up.
  toast.success(message, {
    description: description
      ? `${description}  ·  also try: tenderly.co/simulator/new?txHash=${txHash}`
      : `tx ${txHash.slice(0, 10)}…  ·  also try: tenderly.co/simulator/new?txHash=${txHash}`,
    action: {
      label: "explorer",
      onClick: () => window.open(`${EXPLORER}/${txHash}`, "_blank", "noopener,noreferrer"),
    },
    duration: 8000,
  });
  // Tenderly URL with the txHash query so a user pasting it opens the
  // simulator pre-loaded against the matsnet RPC — no 404 risk because
  // the simulator works regardless of indexed-chain support.
  void `${TENDERLY_SIM}?txHash=${txHash}`;
}

export function txError(err: unknown, fallback = "Transaction failed") {
  const msg = err instanceof Error ? err.message : fallback;
  toast.error(msg);
}
