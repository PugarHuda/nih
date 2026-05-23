/**
 * Spectrum Nodes — Simply Staking's blockchain GraphQL service.
 *
 * Three endpoints exposed:
 *  - blockchainapi  → block heights, getBlockByNumber, getAddressBalance,
 *                     getTransactionByHash, getBlockFee, getMethodInfo
 *  - poolsapi       → getProtocolPoolDetails, getProtocolPoolUserBalance,
 *                     getProtocolPoolPrice, pendleImpliedApy
 *  - spectrumapi    → (REST surface, used for richer aggregations)
 *
 * Note (2026-05-24): Mezo chain ("mezo-testnet" / "mezo-mainnet" / etc) is
 * not yet provisioned on the trial endpoint we have, so calls succeed
 * but return `error: "unsupported"`. The integration code below is the
 * one that flips on the moment Spectrum adds the chain. Used now for
 * the Spectrum bonus prize qualifier (read of on-chain data via
 * Spectrum infra) and to demonstrate the integration shape.
 */

const SPECTRUM_BLOCKCHAIN = process.env.NEXT_PUBLIC_SPECTRUM_RPC ?? "";
const SPECTRUM_POOLS = process.env.NEXT_PUBLIC_SPECTRUM_POOLS ?? "";

async function gql(endpoint: string, query: string, variables?: Record<string, unknown>) {
  if (!endpoint) return null;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface SpectrumBlockHeight {
  chain: string;
  height: string | null;
  error: string | null;
}

/** Block height across chains; chain name pulled from Spectrum's enum. */
export async function spectrumBlockHeight(chain = "mezo-testnet"): Promise<SpectrumBlockHeight | null> {
  const res = await gql(
    SPECTRUM_BLOCKCHAIN,
    `query($c: [String!]!) { getBlockHeights(chains: $c) { chain height error } }`,
    { c: [chain] },
  );
  const first: SpectrumBlockHeight | undefined = res?.data?.getBlockHeights?.[0];
  return first ?? null;
}

/** Pool details for a given (chain, protocol, poolAddress) triple. */
export async function spectrumPoolDetails(
  chain: string,
  protocol: string,
  poolAddress: string,
): Promise<unknown> {
  const res = await gql(
    SPECTRUM_POOLS,
    `query($i: [ProtocolPoolChainInput!]!) { getProtocolPoolDetails(input: $i) }`,
    { i: [{ chain, protocol, poolAddress }] },
  );
  return res?.data?.getProtocolPoolDetails ?? null;
}
