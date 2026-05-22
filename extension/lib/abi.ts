export const routerAbi = [
  {
    type: "function",
    name: "tip",
    stateMutability: "nonpayable",
    inputs: [
      { name: "platform", type: "string" },
      { name: "username", type: "string" },
      { name: "amount", type: "uint256" },
      { name: "payFeeInMezo", type: "bool" },
      { name: "context", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

export const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "o", type: "address" }, { name: "s", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "s", type: "address" }, { name: "v", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

export const registryAbi = [
  { type: "function", name: "resolve", stateMutability: "view", inputs: [{ name: "platform", type: "string" }, { name: "username", type: "string" }], outputs: [{ name: "wallet", type: "address" }, { name: "tier", type: "uint8" }] },
] as const;
