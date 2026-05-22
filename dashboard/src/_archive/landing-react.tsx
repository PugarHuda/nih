"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Chrome, Coins, Banknote, Sparkles, ShieldCheck, Zap, Activity } from "lucide-react";
import { ActivityFeed } from "@/components/activity-feed";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <>
      <Header />
      <main className="container py-16 md:py-24">
        {/* Hero */}
        <section className="grid md:grid-cols-2 gap-10 items-center mb-32">
          <div className="flex flex-col gap-7">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Live on Mezo matsnet
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-4xl md:text-6xl font-semibold tracking-tighter leading-[1.05]"
            >
              Here, have a tip.<br />
              <span className="text-brand text-glow">Bitcoin-backed.</span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg text-muted max-w-md"
            >
              Tip MUSD on Twitter, YouTube, Substack, GitHub — anywhere. Stable
              Bitcoin-backed money, sent in one click. Creators borrow against their
              tips without ever selling BTC.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex flex-wrap gap-3"
            >
              <Button size="lg" asChild>
                <Link href="/install">
                  <Chrome className="h-4 w-4" />
                  Install extension
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">
                  Creator dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-3 gap-6 pt-6 max-w-md text-sm"
            >
              <Stat label="Tipped" value="$0" />
              <Stat label="Creators" value="0" />
              <Stat label="Platforms" value="5" />
            </motion.div>
          </div>

          {/* Hero visual — tip mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            <TweetMockup />
          </motion.div>
        </section>

        {/* How it works */}
        <section className="mb-32">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            How it works
          </h2>
          <p className="text-muted mb-10 max-w-xl">
            Three primitives glued together: identity, escrow, credit. All on Mezo.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            <StepCard
              icon={<Coins className="h-5 w-5" />}
              step="01"
              title="Tip with a click"
              desc="Browser extension injects a Tip button on every social profile. Sender confirms in their wallet — done in 3 seconds."
            />
            <StepCard
              icon={<ShieldCheck className="h-5 w-5" />}
              step="02"
              title="Auto-routed"
              desc="If recipient is registered, MUSD lands instantly. If not, it waits in an on-chain vault for them to claim later."
            />
            <StepCard
              icon={<Banknote className="h-5 w-5" />}
              step="03"
              title="Borrow against tips"
              desc="Creators lock accumulated tips as collateral — get up to 60% as a MUSD credit line. BTC exposure untouched."
            />
          </div>
        </section>

        {/* Why Mezo */}
        <section className="mb-32">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            Why on Mezo
          </h2>
          <p className="text-muted mb-10 max-w-xl">
            Tipping with Bitcoin used to mean Lightning channels and BTC volatility.
            Nih flips that: stable money on Bitcoin rails.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            <Card>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand/10 p-2 text-brand">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">MUSD doesn&apos;t bounce around</h3>
                  <p className="text-muted text-sm">
                    Creators receive a stable USD-pegged token, backed 1:1 by Bitcoin
                    reserves. No need to convert before spending.
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-accent/10 p-2 text-accent">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Composable with Mezo primitives</h3>
                  <p className="text-muted text-sm">
                    Tips → savings rate → trove collateral. Income literally turns into
                    a credit line. Not possible on any other chain.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Live activity */}
        <section className="mb-32">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-1">
                Live activity
              </h2>
              <p className="text-muted text-sm">
                Tips landing right now. Indexed by Goldsky from Mezo matsnet.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs text-accent">
              <Activity className="h-3.5 w-3.5" />
              real-time
            </span>
          </div>
          <ActivityFeed limit={6} />
        </section>

        {/* Install CTA */}
        <section id="install" className="mb-24">
          <Card className="text-center py-14">
            <h2 className="text-3xl font-semibold tracking-tight mb-3">
              Ready to tip the supernormal way?
            </h2>
            <p className="text-muted mb-7 max-w-md mx-auto">
              Chrome & Firefox extension. Free, self-custodial, takes 30 seconds.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" asChild>
                <Link href="/install">
                  <Chrome className="h-4 w-4" />
                  Add to Chrome
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            </div>
          </Card>
        </section>

        <footer className="border-t border-border/60 pt-8 text-sm text-muted flex flex-wrap items-center justify-between gap-4">
          <p>
            Built for the{" "}
            <a
              href="https://www.encodeclub.com/programmes/mezo-hackathon-building-bitcoins-future"
              className="text-brand hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mezo Hackathon 2026
            </a>{" "}
            — Supernormal dApps track.
          </p>
          <p>MUSD ⨯ MEZO ⨯ Mezo Earn</p>
        </footer>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-semibold text-fg">{value}</span>
      <span className="text-xs text-muted uppercase tracking-wider">{label}</span>
    </div>
  );
}

function StepCard({
  step,
  title,
  desc,
  icon,
}: {
  step: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="relative">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-brand/10 p-2.5 text-brand">{icon}</div>
        <div>
          <div className="text-xs text-muted uppercase tracking-widest mb-1">
            {step}
          </div>
          <h3 className="font-semibold mb-1.5">{title}</h3>
          <p className="text-sm text-muted leading-relaxed">{desc}</p>
        </div>
      </div>
    </Card>
  );
}

function TweetMockup() {
  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand to-brandSoft" />
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">huda</span>
            <span className="text-muted text-sm">@hajislamet</span>
          </div>
          <p className="text-sm mt-1 leading-relaxed">
            Just shipped Nih — tip MUSD on any social profile. Bitcoin-backed
            money, one-click, self-custodial. Try it on this tweet 👇
          </p>
          <div className="mt-3.5 flex items-center gap-4 text-muted text-xs">
            <span>💬 12</span>
            <span>♻ 47</span>
            <span>♥ 284</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 text-brand font-medium hover:bg-brand/20 transition-colors"
            >
              <Coins className="h-3.5 w-3.5" />
              Nih · 5 MUSD
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
