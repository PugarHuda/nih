import { defineChain } from "viem";

export const matsnet = defineChain({
  id: 31611,
  name: "Mezo Matsnet",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.test.mezo.org"], webSocket: ["wss://rpc-ws.test.mezo.org"] },
  },
  blockExplorers: {
    default: { name: "Mezo Explorer", url: "https://explorer.test.mezo.org" },
  },
  testnet: true,
});

export const mezoMainnet = defineChain({
  id: 31612,
  name: "Mezo",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mainnet.mezo.public.validationcloud.io"] },
  },
  blockExplorers: {
    default: { name: "Mezo Explorer", url: "https://explorer.mezo.org" },
  },
});
