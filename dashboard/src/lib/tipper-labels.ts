/**
 * Resolve a tipper's wallet address → their registered social handle.
 *
 * The subgraph only stores `Tip.sender.address` (a wallet). To show
 * "twitter:alice tipped 5 MUSD" instead of "0xab…cd" on the leaderboard
 * and live ticker, we need a wallet → handle reverse map.
 *
 * handleId is keccak256("platform:username") — a one-way hash, so we can't
 * invert it. But the on-chain registry maps handleId → owner. We take the
 * small client-side `KNOWN_HANDLES` table (the demo handles), read each
 * one's owner from the registry once, and invert to owner → handle.
 *
 * Reads run through a public viem client (NOT wagmi hooks) so any component
 * — server or client, hook or not — can call this. The result is cached at
 * module scope: ~6 reads on first call, then instant.
 */
import { createPublicClient, http, fallback } from "viem";
import { matsnet } from "./chain";
import { addresses, registryAbi } from "./contracts";
import { KNOWN_HANDLES } from "./goldsky";

export interface HandleLabel {
  platform: string;
  username: string;
}

const ZERO = "0x0000000000000000000000000000000000000000";

let cache: Promise<Record<string, HandleLabel>> | null = null;

function client() {
  const spectrum = process.env.NEXT_PUBLIC_SPECTRUM_RPC_URL;
  const primary = process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.test.mezo.org";
  return createPublicClient({
    chain: matsnet,
    transport: fallback([
      ...(spectrum ? [http(spectrum)] : []),
      http(primary),
      http("https://rpc.test.mezo.org"),
    ]),
  });
}

/**
 * owner address (lowercased) → first registered handle we know about.
 * One wallet can own several handles; for display we keep the first that
 * resolves (deterministic by KNOWN_HANDLES insertion order).
 */
export function resolveOwnerLabels(): Promise<Record<string, HandleLabel>> {
  if (cache) return cache;
  cache = (async () => {
    const out: Record<string, HandleLabel> = {};
    const pub = client();
    await Promise.all(
      Object.entries(KNOWN_HANDLES).map(async ([handleId, meta]) => {
        try {
          const res = (await pub.readContract({
            address: addresses.Registry,
            abi: registryAbi,
            functionName: "resolveById",
            args: [handleId as `0x${string}`],
          })) as readonly [string, number];
          const owner = res[0];
          if (owner && owner.toLowerCase() !== ZERO) {
            const key = owner.toLowerCase();
            if (!out[key]) out[key] = meta; // first handle wins
          }
        } catch {
          /* skip handles that fail to resolve */
        }
      }),
    );
    return out;
  })();
  return cache;
}

/** Sync lookup against a pre-resolved map (from resolveOwnerLabels). */
export function labelFor(
  map: Record<string, HandleLabel>,
  address: string | undefined | null,
): HandleLabel | null {
  if (!address) return null;
  return map[address.toLowerCase()] ?? null;
}
