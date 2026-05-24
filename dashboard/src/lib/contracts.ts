import { Address } from "viem";

export const addresses = {
  MUSD: (process.env.NEXT_PUBLIC_MUSD_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  // RealMUSD is Mezo's actual on-chain MUSD primitive. NihEarn + NihTrove
  // are wired to it (they wrap real Mezo BorrowerOperations / StabilityPool),
  // so any approve/balance call against those wrappers must use RealMUSD,
  // not Mock MUSD (which is only good for tip flows).
  RealMUSD: (process.env.NEXT_PUBLIC_REAL_MUSD_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  MEZO: (process.env.NEXT_PUBLIC_MEZO_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  Registry: (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  Vault: (process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  Router: (process.env.NEXT_PUBLIC_ROUTER_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  Credit: (process.env.NEXT_PUBLIC_CREDIT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  Stream: (process.env.NEXT_PUBLIC_STREAM_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  Earn: (process.env.NEXT_PUBLIC_EARN_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  Trove: (process.env.NEXT_PUBLIC_TROVE_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
} as const;

/// Real Mezo MUSD primitives (live on matsnet). Used for direct interaction
/// when our wrapper proxies aren't strictly needed.
export const mezoPrimitives = {
  BorrowerOperations: (process.env.NEXT_PUBLIC_MEZO_BORROWER_OPS ?? "0x0000000000000000000000000000000000000000") as Address,
  TroveManager: (process.env.NEXT_PUBLIC_MEZO_TROVE_MANAGER ?? "0x0000000000000000000000000000000000000000") as Address,
  StabilityPool: (process.env.NEXT_PUBLIC_MEZO_STABILITY_POOL ?? "0x0000000000000000000000000000000000000000") as Address,
  PriceFeed: (process.env.NEXT_PUBLIC_MEZO_PRICE_FEED ?? "0x0000000000000000000000000000000000000000") as Address,
} as const;

export const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

export const registryAbi = [
  { type: "function", name: "handleId", stateMutability: "pure", inputs: [{ name: "platform", type: "string" }, { name: "username", type: "string" }], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "resolve", stateMutability: "view", inputs: [{ name: "platform", type: "string" }, { name: "username", type: "string" }], outputs: [{ name: "wallet", type: "address" }, { name: "tier", type: "uint8" }] },
  { type: "function", name: "resolveById", stateMutability: "view", inputs: [{ name: "handleId", type: "bytes32" }], outputs: [{ name: "wallet", type: "address" }, { name: "tier", type: "uint8" }] },
  { type: "function", name: "handlesOf", stateMutability: "view", inputs: [{ name: "wallet", type: "address" }], outputs: [{ type: "bytes32[]" }] },
  { type: "function", name: "registerWithSignature", stateMutability: "nonpayable", inputs: [
    { name: "handleId", type: "bytes32" },
    { name: "tier", type: "uint8" },
    { name: "deadline", type: "uint256" },
    { name: "signature", type: "bytes" },
  ], outputs: [] },
] as const;

export const routerAbi = [
  { type: "function", name: "tip", stateMutability: "nonpayable", inputs: [
    { name: "platform", type: "string" },
    { name: "username", type: "string" },
    { name: "amount", type: "uint256" },
    { name: "payFeeInMezo", type: "bool" },
    { name: "context", type: "bytes32" },
  ], outputs: [] },
  { type: "function", name: "totalSent", stateMutability: "view", inputs: [{ name: "sender", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalReceived", stateMutability: "view", inputs: [{ name: "recipient", type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

export const vaultAbi = [
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [{ name: "handleId", type: "bytes32" }], outputs: [] },
  { type: "function", name: "pendingFor", stateMutability: "view", inputs: [{ name: "handleId", type: "bytes32" }], outputs: [{ type: "uint256" }] },
] as const;

export const creditAbi = [
  { type: "function", name: "open", stateMutability: "nonpayable", inputs: [{ name: "collateral", type: "uint256" }], outputs: [] },
  { type: "function", name: "repay", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "owedAmount", stateMutability: "view", inputs: [{ name: "borrower", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "loans", stateMutability: "view", inputs: [{ name: "borrower", type: "address" }], outputs: [
    { name: "principal", type: "uint128" },
    { name: "collateral", type: "uint128" },
    { name: "openedAt", type: "uint64" },
  ] },
  { type: "function", name: "maxBorrowable", stateMutability: "pure", inputs: [{ name: "tipBalance", type: "uint256" }], outputs: [{ type: "uint256" }] },
] as const;

export const streamAbi = [
  { type: "function", name: "create", stateMutability: "nonpayable", inputs: [
    { name: "recipient", type: "address" },
    { name: "deposit", type: "uint256" },
    { name: "duration", type: "uint64" },
  ], outputs: [{ type: "uint256" }] },
  { type: "function", name: "withdraw", stateMutability: "nonpayable", inputs: [{ name: "streamId", type: "uint256" }], outputs: [] },
  { type: "function", name: "cancel", stateMutability: "nonpayable", inputs: [{ name: "streamId", type: "uint256" }], outputs: [] },
  { type: "function", name: "withdrawable", stateMutability: "view", inputs: [{ name: "streamId", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "streams", stateMutability: "view", inputs: [{ name: "streamId", type: "uint256" }], outputs: [
    { name: "sender", type: "address" },
    { name: "recipient", type: "address" },
    { name: "deposit", type: "uint128" },
    { name: "ratePerSecond", type: "uint128" },
    { name: "startTime", type: "uint64" },
    { name: "stopTime", type: "uint64" },
    { name: "withdrawn", type: "uint128" },
    { name: "cancelled", type: "bool" },
  ] },
  { type: "function", name: "outgoingOf", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256[]" }] },
  { type: "function", name: "incomingOf", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256[]" }] },
] as const;

export const earnAbi = [
  { type: "function", name: "deposit", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "withdraw", stateMutability: "nonpayable", inputs: [{ name: "shares", type: "uint256" }], outputs: [] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "userShares", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalAssets", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "depositedPrincipal", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "pendingBTCYield", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

export const troveAbi = [
  { type: "function", name: "openTroveFor", stateMutability: "payable", inputs: [{ name: "debt", type: "uint256" }], outputs: [] },
  { type: "function", name: "closeTroveFor", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "snapshotOf", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [
    { name: "debt", type: "uint256" },
    { name: "coll", type: "uint256" },
    { name: "status", type: "uint256" },
  ] },
  { type: "function", name: "proxyOf", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "address" }] },
] as const;
