"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Chrome, ExternalLink, Github } from "lucide-react";

const ZIP_URL = "https://github.com/PugarHuda/nih/releases/download/v0.1.0/nih-extension-v0.1.0.zip";

export default function InstallPage() {
  return (
    <>
      <Header />
      <main className="container max-w-3xl py-16">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs text-brand mb-4">
            <Chrome className="h-3.5 w-3.5" /> Browser extension · v0.1.0
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            Install Nih
          </h1>
          <p className="text-muted mb-10 max-w-xl">
            Chrome Web Store review is pending. Until then, sideload the unpacked
            build — takes under a minute.
          </p>
        </motion.div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Download the extension</CardTitle>
            <CardDescription>v0.1.0 · 586 KB · last build today</CardDescription>
          </CardHeader>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" asChild>
              <a href={ZIP_URL} download>
                <Download className="h-4 w-4" />
                Download .zip
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://github.com/PugarHuda/nih/releases/tag/v0.1.0" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                View release on GitHub
              </a>
            </Button>
          </div>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. Load it into Chrome</CardTitle>
            <CardDescription>Works in Chrome, Brave, Arc, and Edge.</CardDescription>
          </CardHeader>
          <ol className="space-y-3 pt-2 text-sm text-muted">
            <Step n="a">
              Unzip the archive somewhere stable (e.g. <code className="text-fg">~/extensions/nih</code>).
              Don&apos;t delete the folder afterwards — Chrome keeps a live reference.
            </Step>
            <Step n="b">
              Open <code className="text-fg">chrome://extensions</code> in a new tab.
            </Step>
            <Step n="c">
              Toggle <strong className="text-fg">Developer mode</strong> in the top-right.
            </Step>
            <Step n="d">
              Click <strong className="text-fg">Load unpacked</strong> and select the unzipped folder.
            </Step>
            <Step n="e">
              Pin Nih to your toolbar (the puzzle-piece icon → pin).
            </Step>
          </ol>
        </Card>

        <Card className="mb-10">
          <CardHeader>
            <CardTitle>3. Connect your wallet</CardTitle>
            <CardDescription>The extension auto-switches you to Mezo matsnet.</CardDescription>
          </CardHeader>
          <ol className="space-y-3 pt-2 text-sm text-muted">
            <Step n="a">
              Open the extension popup, click <strong className="text-fg">Connect wallet</strong>.
            </Step>
            <Step n="b">
              MetaMask will prompt to add <strong className="text-fg">Mezo Matsnet</strong> (chainId 31611, RPC{" "}
              <code className="text-fg">rpc.test.mezo.org</code>, native gas BTC). Approve.
            </Step>
            <Step n="c">
              Grab testnet BTC from{" "}
              <a className="text-brand hover:underline" href="https://faucet.test.mezo.org" target="_blank" rel="noopener noreferrer">
                faucet.test.mezo.org
              </a>{" "}
              for gas. <br />
              Need MUSD for tipping? Open the{" "}
              <Link className="text-brand hover:underline" href="/faucet">
                in-app MUSD faucet
              </Link>{" "}
              after connecting.
            </Step>
            <Step n="d">
              Scroll any Twitter feed — every tweet now has a <span className="text-brand font-semibold">N Tip MUSD</span> button.
            </Step>
          </ol>
        </Card>

        <div className="grid sm:grid-cols-2 gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              Open dashboard <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://github.com/PugarHuda/nih" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" /> GitHub source
            </a>
          </Button>
        </div>
      </main>
    </>
  );
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex-none h-6 w-6 rounded-md bg-surface border border-border text-fg text-xs font-semibold flex items-center justify-center">
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
