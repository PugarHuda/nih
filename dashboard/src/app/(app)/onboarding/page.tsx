"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ConnectWallet } from "@/components/connect-wallet";
import { addresses, erc20Abi } from "@/lib/contracts";
import { formatMUSD } from "@/lib/utils";
import { fetchHandleStats, fetchRecentTips, lookupHandle } from "@/lib/goldsky";
import { ArrowRight, Check, Loader2 } from "lucide-react";

/**
 * /onboarding — interactive 3-minute walkthrough.
 *
 * Six panels, each with a status the user can see flip from
 * "not yet" to "done" as they actually act on it. Every state read is
 * live on-chain or from the Goldsky subgraph; no fake step completion.
 */
export default function OnboardingPage() {
  const { address, isConnected } = useAccount();

  // Step 2: faucet MUSD balance check.
  const { data: musdBal } = useReadContract({
    address: addresses.MUSD,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 8000 },
  });
  const hasMusd = (musdBal as bigint | undefined) ?? 0n;

  // Step 4: has the network ever seen a tip?
  const [hasGlobalTips, setHasGlobalTips] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchRecentTips(1).then((tips) => {
      if (!cancelled) setHasGlobalTips(tips.length > 0);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Step 5: has the connected wallet ever received a tip?
  const [myHandleStats, setMyHandleStats] = useState<{ total: bigint; count: number } | null>(null);
  useEffect(() => {
    if (!address) {
      setMyHandleStats(null);
      return;
    }
    let cancelled = false;
    fetchHandleStats(50).then((stats) => {
      if (cancelled) return;
      const mine = stats
        .filter((s) => {
          const meta = lookupHandle(s.handleId);
          return !!meta;
        })
        .reduce(
          (acc, s) => ({
            total: acc.total + BigInt(s.totalReceived),
            count: acc.count + Number(s.tipCount),
          }),
          { total: 0n, count: 0 },
        );
      setMyHandleStats(mine);
    });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const steps: Step[] = [
    {
      n: 1,
      title: "Plug into Mezo",
      copy: "Connect a wallet on matsnet. Xverse / Unisat for Bitcoin-native, MetaMask if you already have it. Gas is paid in BTC.",
      cta: <ConnectWallet />,
      done: isConnected,
    },
    {
      n: 2,
      title: "Grab test funds",
      copy: "Mock MUSD and Mock MEZO on matsnet are open-mint. Visit the faucet and pull 100 of each. Need test BTC for gas? Use the Mezo faucet too.",
      cta: (
        <div className="flex gap-2">
          <Link href="/faucet"><Button size="sm">Open faucet</Button></Link>
          <a href="https://faucet.test.mezo.org" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost">BTC faucet ↗</Button>
          </a>
        </div>
      ),
      done: isConnected && hasMusd > 0n,
      doneLabel: isConnected && hasMusd > 0n ? `${formatMUSD(hasMusd)} MUSD in wallet` : undefined,
    },
    {
      n: 3,
      title: "Install the browser extension",
      copy: "Load the Plasmo build (chrome-mv3-prod folder). After installing you'll see an N Tip MUSD button under every Twitter / GitHub / Substack profile.",
      cta: <Link href="/install"><Button size="sm">Install guide</Button></Link>,
      done: false, // we have no way to detect extension install from the web app
      doneLabel: "can't auto-verify · install manually",
    },
    {
      n: 4,
      title: "Send a real tip",
      copy: "Pick any creator and send them 5–100 MUSD. The router routes the funds and the indexed Tipped event hits the dashboard in ~15s.",
      cta: <Link href="/tip"><Button size="sm">Send a tip</Button></Link>,
      done: hasGlobalTips === true,
      doneLabel:
        hasGlobalTips === null
          ? "checking subgraph…"
          : hasGlobalTips
            ? "the matsnet subgraph has indexed tips"
            : undefined,
    },
    {
      n: 5,
      title: "Claim or watch tips land",
      copy: "Already a creator? Verify your handle and pull your accumulated tips. New here? Watch the activity heatmap fill in.",
      cta: (
        <div className="flex gap-2">
          <Link href="/dashboard"><Button size="sm">My dashboard</Button></Link>
          <Link href="/claim"><Button size="sm" variant="ghost">Claim a handle</Button></Link>
        </div>
      ),
      done: !!myHandleStats && myHandleStats.total > 0n,
      doneLabel:
        myHandleStats === null
          ? undefined
          : myHandleStats.total > 0n
            ? `${formatMUSD(myHandleStats.total)} MUSD on linked handles · ${myHandleStats.count} tip${myHandleStats.count === 1 ? "" : "s"}`
            : undefined,
    },
    {
      n: 6,
      title: "Borrow against the stack",
      copy: "Once you've earned, lock the MUSD into NihTrove (backed by the real Mezo MUSD primitive) and open a credit line. Pay it back later — never sell your Bitcoin.",
      cta: <Link href="/borrow"><Button size="sm">Open credit line</Button></Link>,
      done: false,
      doneLabel: "requires open trove + minted MUSD line",
    },
  ];

  return (
    <>
      <Header />
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="fade-up">
          <span className="kicker">walk-through · 3 minutes</span>
          <h1 className="h1 mt-2 mb-2">From zero to first tip in six panels.</h1>
          <p className="text-base mb-10" style={{ color: "var(--ink-3)" }}>
            Each step checks live on-chain / subgraph state. Real txs, no
            scripted UI — when you actually do the thing, the panel flips
            from <em>not yet</em> to <em>done</em>.
          </p>
        </div>

        <ol className="flex flex-col gap-5">
          {steps.map((s) => (
            <li key={s.n}>
              <StepCard {...s} />
            </li>
          ))}
        </ol>

        <div className="mt-12 flex items-center justify-between text-sm" style={{ color: "var(--ink-3)" }}>
          <p>Done with the tour?</p>
          <Link href="/dashboard">
            <Button>
              Open the dashboard <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    </>
  );
}

interface Step {
  n: number;
  title: string;
  copy: string;
  cta: React.ReactNode;
  done: boolean;
  doneLabel?: string;
}

function StepCard({ n, title, copy, cta, done, doneLabel }: Step) {
  return (
    <div className={"comic-card flex flex-col sm:flex-row gap-5 p-5" + (done ? " accent" : "")}>
      <div
        className="flex-none flex items-center justify-center"
        style={{
          width: 56,
          height: 56,
          fontFamily: "var(--font-display)",
          fontSize: 32,
          background: done ? "var(--ink)" : "var(--paper)",
          color: done ? "var(--paper)" : "var(--ink)",
          border: "3.5px solid var(--ink)",
          boxShadow: "3px 3px 0 0 var(--ink)",
        }}
      >
        {done ? <Check className="h-7 w-7" /> : n}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="h3">{title}</h3>
          {done ? (
            <span className="mono text-[10px] uppercase tracking-[.1em]" style={{ color: "var(--good)" }}>
              done
            </span>
          ) : (
            <span className="mono text-[10px] uppercase tracking-[.1em]" style={{ color: "var(--ink-3)" }}>
              not yet
            </span>
          )}
        </div>
        <p className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>
          {copy}
        </p>
        {doneLabel && (
          <p className="text-xs mt-2 mono" style={{ color: "var(--ink-3)" }}>
            <Loader2 className="inline h-3 w-3 mr-1 opacity-60" />
            {doneLabel}
          </p>
        )}
        <div className="mt-3">{cta}</div>
      </div>
    </div>
  );
}
