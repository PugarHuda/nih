export const CHAIN = {
  id: 31611,
  name: "Mezo Matsnet",
  rpc: "https://rpc.test.mezo.org",
  explorer: "https://explorer.test.mezo.org",
} as const;

export const ADDRESSES = {
  MUSD: (process.env.PLASMO_PUBLIC_MUSD_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  MEZO: (process.env.PLASMO_PUBLIC_MEZO_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  Registry: (process.env.PLASMO_PUBLIC_REGISTRY_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  Router: (process.env.PLASMO_PUBLIC_ROUTER_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
};

export const DASHBOARD_URL = process.env.PLASMO_PUBLIC_DASHBOARD_URL ?? "http://localhost:3000";

export const TIP_PRESETS = [1, 5, 10, 25] as const;
