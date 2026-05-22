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

  const targetHex = `0x${CHAIN.id.toString(16)}`;
  const currentHex: string = await provider.request({ method: "eth_chainId" });
  if (currentHex.toLowerCase() === targetHex.toLowerCase()) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetHex }],
    });
  } catch (err: any) {
    // 4902 = chain unknown to wallet; add then retry switch
    if (err?.code === 4902 || /Unrecognized chain ID/i.test(err?.message ?? "")) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: targetHex,
            chainName: CHAIN.name,
            nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
            rpcUrls: [CHAIN.rpc],
            blockExplorerUrls: [CHAIN.explorer],
          },
        ],
      });
      // Some wallets don't auto-select the freshly added chain — force-switch.
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetHex }],
      });
    } else {
      throw err;
    }
  }
}
