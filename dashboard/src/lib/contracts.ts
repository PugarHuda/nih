import { Address } from "viem";

export const addresses = {
  MUSD: (process.env.NEXT_PUBLIC_MUSD_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  MEZO: (process.env.NEXT_PUBLIC_MEZO_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  Registry: (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  Vault: (process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  Router: (process.env.NEXT_PUBLIC_ROUTER_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  Credit: (process.env.NEXT_PUBLIC_CREDIT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
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
