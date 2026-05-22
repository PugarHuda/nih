import { parseEther, keccak256, toBytes, maxUint256 } from "viem";
import { ADDRESSES } from "./config";
import { publicClient, walletClient, ensureChain } from "./client";
import { erc20Abi, registryAbi, routerAbi } from "./abi";

export type Platform = "twitter" | "youtube" | "github" | "substack" | "medium";

export async function tip(opts: {
  platform: Platform;
  username: string;
  amount: number;
  payFeeInMezo?: boolean;
  context?: string;
}) {
  await ensureChain();
  const wallet = walletClient();
  if (!wallet) throw new Error("No injected wallet");

  const [account] = await wallet.requestAddresses();
  const amountWei = parseEther(opts.amount.toString());
  const pub = publicClient();

  // Check allowance, approve if needed
  const allowance = await pub.readContract({
    address: ADDRESSES.MUSD,
    abi: erc20Abi,
    functionName: "allowance",
    args: [account, ADDRESSES.Router],
  });

  if (allowance < amountWei) {
    const approveTx = await wallet.writeContract({
      account,
      chain: undefined,
      address: ADDRESSES.MUSD,
      abi: erc20Abi,
      functionName: "approve",
      args: [ADDRESSES.Router, maxUint256],
    });
    await pub.waitForTransactionReceipt({ hash: approveTx });
  }

  const contextHash = opts.context
    ? keccak256(toBytes(opts.context))
    : ("0x" + "0".repeat(64)) as `0x${string}`;

  const tipTx = await wallet.writeContract({
    account,
    chain: undefined,
    address: ADDRESSES.Router,
    abi: routerAbi,
    functionName: "tip",
    args: [opts.platform, opts.username, amountWei, !!opts.payFeeInMezo, contextHash],
  });

  await pub.waitForTransactionReceipt({ hash: tipTx });
  return tipTx;
}

export async function resolveHandle(platform: Platform, username: string) {
  const pub = publicClient();
  const [wallet, tier] = (await pub.readContract({
    address: ADDRESSES.Registry,
    abi: registryAbi,
    functionName: "resolve",
    args: [platform, username],
  })) as [`0x${string}`, number];
  return { wallet, tier };
}
