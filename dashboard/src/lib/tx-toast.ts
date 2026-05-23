/**
 * Helpers for showing contract-write outcomes consistently.
 *
 * `writeContractAsync` resolves the instant the wallet *broadcasts*,
 * not when the tx confirms. A toast that says "Confirmed." on broadcast
 * is a lie when the tx reverts on-chain — and worse, it lets a flow
 * like /unlock flip persistent state before knowing the tx succeeded.
 *
 * `txSuccess` therefore polls `eth_getTransactionReceipt` until it can
 * confirm the status, and only emits the success toast (and runs the
 * optional `onConfirmed` side-effect) when status === 1. Reverts go
 * through `txError` with the revert reason if we can decode it.
 */
import { toast } from "sonner";
import { http, createPublicClient } from "viem";
import { matsnet } from "@/lib/chain";

const receiptClient = createPublicClient({
  chain: matsnet,
  transport: http(),
});

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
  /** Run only after the receipt confirms status === 1. */
  onConfirmed?: () => void;
}

/**
 * Awaits the receipt before declaring success.
 *
 * Returns the receipt so callers can chain on it (e.g. /unlock writes
 * its localStorage flag from `.then(r => r && ...)`).
 */
export async function txSuccess({
  message = "Confirmed.",
  txHash,
  description,
  onConfirmed,
}: TxSuccessOpts) {
  if (!txHash) {
    toast.success(message, { description });
    onConfirmed?.();
    return null;
  }

  // Show a pending toast immediately so the user knows we saw the broadcast.
  const pendingId = toast.loading("Sent — waiting for confirmation…", {
    description: `tx ${txHash.slice(0, 12)}…`,
  });

  try {
    const receipt = await receiptClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      timeout: 90_000,
    });
    toast.dismiss(pendingId);
    if (receipt.status !== "success") {
      // Status 0 = on-chain revert. Receipt has the failing tx in block.
      toast.error(`Transaction reverted on-chain`, {
        description: `Block ${receipt.blockNumber}. Inspect on explorer for the revert reason.`,
        action: {
          label: "explorer",
          onClick: () =>
            window.open(`${EXPLORER}/${txHash}`, "_blank", "noopener,noreferrer"),
        },
        duration: 10000,
      });
      return receipt;
    }

    toast.success(message, {
      description: description
        ? `${description}  ·  also: ${TENDERLY_SIM}?txHash=${txHash}`
        : `tx ${txHash.slice(0, 10)}…`,
      action: {
        label: "explorer",
        onClick: () =>
          window.open(`${EXPLORER}/${txHash}`, "_blank", "noopener,noreferrer"),
      },
      duration: 8000,
    });
    onConfirmed?.();
    return receipt;
  } catch (err) {
    toast.dismiss(pendingId);
    toast.error("Couldn't confirm tx", {
      description:
        err instanceof Error ? err.message.slice(0, 140) : "RPC timeout",
    });
    return null;
  }
}

export function txError(err: unknown, fallback = "Transaction failed") {
  // Some wagmi/viem errors stuff RPC payloads into .message — trim to a
  // short, copy-safe top line so we don't leak internal node responses
  // to the UI.
  if (err instanceof Error) {
    const head = err.message.split("\n")[0].slice(0, 200);
    toast.error(head || fallback);
    return;
  }
  toast.error(fallback);
}
