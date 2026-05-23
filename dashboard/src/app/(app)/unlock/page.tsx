"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { keccak256, maxUint256, parseEther, toBytes } from "viem";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectWallet } from "@/components/connect-wallet";
import { addresses, erc20Abi, routerAbi } from "@/lib/contracts";
import { useRequireChain } from "@/lib/use-require-chain";
import { txSuccess, txError } from "@/lib/tx-toast";
import { Loader2, Lock, Unlock, Sparkles } from "lucide-react";

function unlockKey(address: string, assetId: string) {
  return `nih:unlocked:${address.toLowerCase()}:${assetId}`;
}

/**
 * /unlock — pay-to-access content demo.
 *
 * Shows MUSD acting as a normal medium of exchange (not just a tip):
 * the user pays N MUSD to a creator's handle via the tip router; once
 * the Tipped event is observed for that wallet + handle + context, the
 * locked content reveals.
 *
 * The mechanism reuses NihRouter.tip() with a deterministic context
 * (keccak256 of the asset id) so the dashboard can search the
 * subgraph for "did this wallet pay for this asset?". This makes the
 * demo a pure dApp on top of existing primitives — no new contracts.
 *
 * Use case demoed: Supernormal "consumer apps where Bitcoin-backed
 * MUSD is the primary currency" — here MUSD unlocks paywalled
 * content (Substack, paid newsletter, premium tweet, etc).
 */

interface Asset {
  id: string; // human-readable identifier (becomes part of context)
  title: string;
  byline: string;
  platform: "substack" | "twitter" | "github";
  username: string;
  priceMUSD: number;
  preview: string;
  body: string;
}

const ASSETS: Asset[] = [
  {
    id: "ha-thread-bitcoin-2026",
    title: "Why Bitcoin doesn't need staking",
    byline: "a long-form essay",
    platform: "substack",
    username: "hajislamet",
    priceMUSD: 5,
    preview:
      "Most chains pay validators in inflation. Bitcoin pays them in fees. " +
      "That single design choice is what makes Bitcoin the only currency " +
      "where holding does not dilute you, and it's the reason MUSD has the…",
    body:
      "…anchor it does. When you mint MUSD on Mezo you are mathematically " +
      "borrowing against a fixed-supply collateral. Compare that with USDC " +
      "(IOU on Circle), DAI (multi-collateral basket), or USDT (do not even " +
      "ask). Bitcoin is the only stablecoin substrate that doesn't have an " +
      "issuer subject to political pressure.\n\n" +
      "The 1% fixed APR on Mezo Trove is not just a price point — it is a " +
      "promise. It says: the protocol does not gain anything from charging you " +
      "more. The fee exists to keep the system solvent, not to extract rent. " +
      "That's why creators on Nih can borrow against their tip income at the " +
      "same rate as institutions borrow against BTC. There is no whale " +
      "discount, no retail tax. The contract code is the same.\n\n" +
      "The next part of this essay walks through how to model your monthly tip " +
      "income as a credit line. Skip ahead if you've already opened a NihCredit " +
      "position.",
  },
  {
    id: "pu-snippet-typescript-tip-bot",
    title: "TypeScript: a 40-line tip bot for any handle",
    byline: "ready-to-paste snippet",
    platform: "github",
    username: "PugarHuda",
    priceMUSD: 1,
    preview:
      "Throwaway script: pass a handle and an amount, it calls NihRouter.tip() " +
      "with the right approval dance. Useful for scheduling weekly creator " +
      "support without leaving the terminal. Full source below the paywall…",
    body:
      "```ts\n" +
      "import { createWalletClient, http, parseEther, encodeFunctionData } from 'viem';\n" +
      "import { privateKeyToAccount } from 'viem/accounts';\n" +
      "import { matsnet } from './chain';\n\n" +
      "const ROUTER = '0x42245cEef96D432c8DA3918dc66D3663E36bFE72';\n" +
      "const MUSD   = '0xE1a85EA3734c181F3DCFe18b2805a5FEaEd07D46';\n\n" +
      "async function tip(platform: string, username: string, amount: number) {\n" +
      "  const acc = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);\n" +
      "  const wc  = createWalletClient({ account: acc, chain: matsnet, transport: http() });\n" +
      "  // 1. approve\n" +
      "  await wc.writeContract({ address: MUSD, abi: erc20, functionName: 'approve', args: [ROUTER, parseEther(String(amount))] });\n" +
      "  // 2. tip\n" +
      "  return wc.writeContract({ address: ROUTER, abi: routerAbi, functionName: 'tip', args: [platform, username, parseEther(String(amount)), false, '0x'+'0'.repeat(64)] });\n" +
      "}\n\n" +
      "tip('twitter', 'hajislamet', 5).then(console.log);\n" +
      "```\n\n" +
      "Run it as a cron and you have a weekly creator-sponsorship bot — no " +
      "Patreon middleman, no card processor.",
  },
  {
    id: "me-secret-token-economics-2026",
    title: "MEZO supply schedule: a leaked early draft",
    byline: "internal note",
    platform: "twitter",
    username: "MezoNetwork",
    priceMUSD: 25,
    preview:
      "Sneak peek at the issuance curve we're considering for mainnet — " +
      "front-loaded enough to fund veMEZO unlocks but conservative on the " +
      "tail. Includes the cliff dates and the holder-to-validator ratio…",
    body:
      "(This is satire — placeholder body for the demo. Real tokenomics live " +
      "in the Mezo whitepaper. The point of this paywall is to show that MUSD " +
      "can gate pay-per-view content with one tx, the same way Substack gates " +
      "with a credit card subscription.)",
  },
];

export default function UnlockPage() {
  const [selectedId, setSelectedId] = useState(ASSETS[0].id);
  const asset = ASSETS.find((a) => a.id === selectedId) ?? ASSETS[0];

  return (
    <>
      <Header />
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="fade-up">
          <span className="kicker">pay-to-unlock · powered by MUSD</span>
          <h1 className="h1 mt-2 mb-2">Read it for the price of a coffee.</h1>
          <p className="text-base mb-2 max-w-2xl" style={{ color: "var(--ink-3)" }}>
            Creators put a paywall on a piece of content. Readers unlock it
            with a one-shot MUSD payment routed through NihRouter. The
            on-chain Tipped event is the receipt — once it's indexed by
            Goldsky for your wallet + this asset's context, the page reveals
            the full body.
          </p>
          <p className="text-xs mono mb-8" style={{ color: "var(--ink-3)" }}>
            no new contracts · just MUSD + the existing tip router · ~15s reveal latency
          </p>
        </div>

        {/* Asset picker */}
        <div className="comic-card mb-6 p-4">
          <span className="kicker">pick a piece</span>
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            {ASSETS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedId(a.id)}
                className="text-left p-3 border-[3px] transition"
                style={{
                  background: selectedId === a.id ? "var(--accent)" : "var(--paper)",
                  color: "var(--ink)",
                  borderColor: "var(--ink)",
                  boxShadow: selectedId === a.id ? "4px 4px 0 0 var(--ink)" : "2px 2px 0 0 var(--ink)",
                  cursor: "pointer",
                }}
              >
                <div className="mono text-[10px] uppercase tracking-wider opacity-70">
                  {a.platform} · @{a.username}
                </div>
                <div className="text-sm font-semibold mt-1 line-clamp-2">{a.title}</div>
                <div className="mono text-xs mt-2 tabular">{a.priceMUSD} MUSD</div>
              </button>
            ))}
          </div>
        </div>

        {/* key={asset.id} forces a fresh component on asset switch so
            `unlocked` state from the previous asset doesn't leak. */}
        <UnlockableArticle key={asset.id} asset={asset} />

        <p className="text-xs mt-6 mono" style={{ color: "var(--ink-3)" }}>
          built on NihRouter.tip(platform, username, amount, payFeeInMezo, context) ·
          context = keccak256(asset.id)
        </p>
      </main>
    </>
  );
}

function UnlockableArticle({ asset }: { asset: Asset }) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { ensure } = useRequireChain();
  const [pending, setPending] = useState<"none" | "approve" | "pay">("none");
  const [unlocked, setUnlocked] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // The context bytes32 lets us search the subgraph for prior unlocks
  // by this wallet for this asset.
  const context = useMemo(
    () => keccak256(toBytes(`unlock:${asset.id}`)),
    [asset.id],
  );
  const priceWei = parseEther(String(asset.priceMUSD));

  // Allowance check so we can skip the approve step on subsequent unlocks.
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: addresses.MUSD,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, addresses.Router] : undefined,
    query: { enabled: !!address },
  });
  const needsApproval = ((allowance as bigint | undefined) ?? 0n) < priceWei;

  // Restore unlocked state across refreshes. The subgraph doesn't index
  // the `context` field, so we can't query "did this wallet pay for THIS
  // asset?" directly. Cheapest reliable signal: a localStorage receipt
  // we write on a successful pay below.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!address) {
      setUnlocked(false);
      return;
    }
    const flag = window.localStorage.getItem(unlockKey(address, asset.id));
    if (flag) setUnlocked(true);
  }, [address, asset.id, refreshKey]);

  async function unlock() {
    if (!isConnected) return;
    if (!(await ensure())) return;
    try {
      if (needsApproval) {
        setPending("approve");
        const txHash = await writeContractAsync({
          address: addresses.MUSD,
          abi: erc20Abi,
          functionName: "approve",
          args: [addresses.Router, maxUint256],
        });
        txSuccess({ message: "Approved MUSD spending", txHash });
        await refetchAllowance();
      }
      setPending("pay");
      const txHash = await writeContractAsync({
        address: addresses.Router,
        abi: routerAbi,
        functionName: "tip",
        args: [asset.platform, asset.username, priceWei, false, context],
      });
      // Gate the unlock reveal on the actual on-chain receipt — broadcast
      // alone is not proof of payment.
      await txSuccess({
        message: `Unlocked: ${asset.title}`,
        description: `Paid ${asset.priceMUSD} MUSD to @${asset.username}`,
        txHash,
        onConfirmed: () => {
          if (typeof window !== "undefined" && address) {
            window.localStorage.setItem(unlockKey(address, asset.id), txHash);
          }
          setUnlocked(true);
          setRefreshKey((k) => k + 1);
        },
      });
    } catch (err) {
      txError(err);
    } finally {
      setPending("none");
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-start gap-3 mb-3">
        <span className="mono text-[10px] uppercase tracking-wider muted">
          {asset.platform} · @{asset.username}
        </span>
        <span className="ml-auto mono text-[10px] uppercase tracking-wider muted">
          {asset.byline}
        </span>
      </div>
      <CardHeader className="p-0">
        <CardTitle className="text-2xl">{asset.title}</CardTitle>
        <CardDescription>
          Preview is public. The rest is gated behind a {asset.priceMUSD} MUSD payment.
        </CardDescription>
      </CardHeader>

      <p className="text-[15px] leading-relaxed mt-4" style={{ color: "var(--ink-2)" }}>
        {asset.preview}
      </p>

      {unlocked ? (
        <div className="mt-6 pt-6 border-t-2 border-dashed" style={{ borderColor: "var(--line-2)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Unlock className="h-4 w-4" style={{ color: "var(--good)" }} />
            <span className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--good)" }}>
              unlocked · receipt on-chain
            </span>
          </div>
          <div
            className="text-[15px] leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--ink)" }}
          >
            {asset.body}
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <div
            className="p-5 text-center"
            style={{
              border: "3.5px dashed var(--line-2)",
              background: "var(--bg-2)",
            }}
          >
            <Lock className="h-6 w-6 mx-auto mb-2 opacity-60" />
            <p className="text-sm mb-4" style={{ color: "var(--ink-2)" }}>
              The rest of this piece is paywalled at {asset.priceMUSD} MUSD.
            </p>
            {!isConnected ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm" style={{ color: "var(--ink-2)" }}>
                  Connect a wallet to pay {asset.priceMUSD} MUSD and unlock.
                </p>
                <ConnectWallet />
              </div>
            ) : (
              <Button
                size="lg"
                onClick={unlock}
                disabled={pending !== "none"}
                className="min-w-[260px]"
              >
                {pending === "approve" ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Approving MUSD…</>
                ) : pending === "pay" ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Unlocking…</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-1.5" /> Pay {asset.priceMUSD} MUSD to unlock</>
                )}
              </Button>
            )}
            <p className="text-[10px] mt-3 mono opacity-60">
              receipt context: {context.slice(0, 18)}…
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
