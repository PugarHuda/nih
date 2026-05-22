import { createPublicClient, createWalletClient, custom, http, defineChain, type WalletClient, type PublicClient } from "viem";
import { CHAIN } from "./config";

export const matsnet = defineChain({
  id: CHAIN.id,
  name: CHAIN.name,
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: { default: { http: [CHAIN.rpc] } },
});

export function publicClient(): PublicClient {
  return createPublicClient({
    chain: matsnet,
    transport: http(CHAIN.rpc),
  });
}

export function walletClient(): WalletClient | null {
  if (typeof window === "undefined") return null;
  const provider = (window as any).ethereum;
  if (!provider) return null;
  return createWalletClient({
    chain: matsnet,
    transport: custom(provider),
  });
}

export async function ensureChain() {
  const provider = (window as any).ethereum;
  if (!provider) throw new Error("No injected wallet");
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${CHAIN.id.toString(16)}` }],
    });
  } catch (err: any) {
    if (err.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${CHAIN.id.toString(16)}`,
            chainName: CHAIN.name,
            nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
            rpcUrls: [CHAIN.rpc],
            blockExplorerUrls: [CHAIN.explorer],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}
