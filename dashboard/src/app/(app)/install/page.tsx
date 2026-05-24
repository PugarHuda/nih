"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Chrome,
  Download,
  ExternalLink,
  CheckCircle2,
  Copy,
  ArrowRight,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";

// Self-hosted in dashboard/public so the latest build is always live with
// each Vercel deploy — no GitHub release roundtrip.
const ZIP_URL = "/nih-extension-latest.zip";
const WEB_STORE_URL: string | null = null; // set after Chrome Web Store listing is live

export default function InstallPage() {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  function handleDownload() {
    downloadRef.current?.click();
    setStep(1);
    toast.success("Downloading nih-extension.zip…", { duration: 4000 });
  }

  return (
    <>
      <Header />
      <main className="container max-w-3xl py-16">
        {/* Hidden anchor for programmatic download */}
        <a ref={downloadRef} href={ZIP_URL} download className="hidden" aria-hidden="true" />

        <div className="fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs text-brand mb-4">
            <Chrome className="h-3.5 w-3.5" /> Browser extension · v0.4.0
          </div>
          <h1 className="h1 mb-2" style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}>
            Install Nih
          </h1>
          <p className="text-muted mb-2 max-w-xl">
            Three clicks. About 60 seconds. Works on Chrome, Brave, Edge, and Arc.
          </p>
          {!WEB_STORE_URL && (
            <p className="text-xs text-muted mb-10">
              Chrome Web Store submission in review — until then, sideload the build.
              Same code, same signing key, just no &quot;Add to Chrome&quot; button yet.
            </p>
          )}
        </div>

        {/* Big primary CTA */}
        <Card className="mb-8 border-brand/40 bg-gradient-to-br from-brand/5 to-transparent">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Download & install</CardTitle>
                <CardDescription>2.1 MB · MV3 · open source · nine platforms</CardDescription>
              </CardHeader>
            </div>
            <Button size="lg" onClick={handleDownload} className="text-base">
              <Download className="h-5 w-5" />
              Download extension
            </Button>
          </div>
        </Card>

        {/* Animated step-by-step */}
        <div className="space-y-3 mb-12">
          <StepRow
            number={1}
            active={step >= 1}
            title="Open Chrome's extensions page"
            body={
              <>
                <p className="text-sm text-muted mb-3">
                  Copy this URL — Chrome blocks JavaScript from opening{" "}
                  <code className="text-fg">chrome://</code> links directly.
                </p>
                <CopyChip text="chrome://extensions" />
              </>
            }
            cta="I opened it"
            onComplete={() => setStep(2)}
          />

          <StepRow
            number={2}
            active={step >= 2}
            title="Turn on Developer mode"
            body={
              <p className="text-sm text-muted">
                Top-right corner of the extensions page. Toggle it on — three new
                buttons appear: <strong className="text-fg">Load unpacked</strong>,{" "}
                <strong className="text-fg">Pack extension</strong>,{" "}
                <strong className="text-fg">Update</strong>.
              </p>
            }
            cta="Developer mode is on"
            onComplete={() => setStep(3)}
          />

          <StepRow
            number={3}
            active={step >= 3}
            title="Unzip the download, then drag the folder into Chrome"
            body={
              <p className="text-sm text-muted">
                Unzip <code className="text-fg">nih-extension-latest.zip</code> on your
                desktop, then literally drag the unzipped folder onto the extensions page.
                Chrome installs it instantly. (Or click{" "}
                <strong className="text-fg">Load unpacked</strong> and pick the folder.)
              </p>
            }
            cta="Extension is loaded"
            onComplete={() => setStep(4)}
          />

          <StepRow
            number={4}
            active={step >= 4}
            title="Pin Nih to your toolbar"
            body={
              <p className="text-sm text-muted">
                Click the puzzle-piece icon next to the URL bar, find Nih in the list,
                click the pin. Done — open the popup and connect your wallet.
              </p>
            }
            cta="All set"
            onComplete={() => {
              toast.success("Welcome to Nih ✦");
              setStep(0);
            }}
            isLast
          />
        </div>

        {/* Visual cheat sheet — own section so it doesn't blend with the
            install steps above. Bumped contrast + size for legibility. */}
        <div className="mt-12 mb-8">
          <div className="mb-4">
            <span className="kicker">visual cheat sheet</span>
            <h2 className="h2 mt-1.5">What you should see</h2>
            <p className="text-sm mt-1" style={{ color: "var(--ink-3)" }}>
              The Chrome extensions page with developer mode on, after the unpacked Nih
              folder has been loaded.
            </p>
          </div>
          <pre
            className="overflow-x-auto p-5 mono"
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--ink)",
              background: "var(--paper)",
              border: "3.5px solid var(--ink)",
              boxShadow: "4px 4px 0 0 var(--ink)",
            }}
          >
{`┌─────────────────────────────────────────────────────────────────────┐
│  Extensions                                       🔘 Developer mode │
│                                                                     │
│  [ Load unpacked ]  [ Pack extension ]  [ Update ]                  │
│                                                                     │
│  ╭─────────────────────────────────────────────────────────╮       │
│  │  N  Nih — Tip MUSD anywhere                  ◐ enabled  │       │
│  │     v0.1.0 · ID: efnaaaa…                               │       │
│  │     Details · Remove · Errors                           │       │
│  ╰─────────────────────────────────────────────────────────╯       │
└─────────────────────────────────────────────────────────────────────┘`}
          </pre>
        </div>

        {/* Troubleshooting */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Common gotchas</CardTitle>
          </CardHeader>
          <ul className="space-y-3 text-sm text-muted">
            <Gotcha
              q="Chrome shows an error: &quot;Manifest file is missing or unreadable&quot;"
              a="You probably pointed Chrome at the .zip file. You must unzip it first, then point at the unzipped folder."
            />
            <Gotcha
              q="I clicked Load unpacked and nothing happened"
              a="Developer mode toggle (top-right) needs to be on. Page won't auto-refresh after toggling — it just appears."
            />
            <Gotcha
              q="Tip button doesn't appear on tweets"
              a="Twitter sometimes A/B tests their DOM. Right-click the extension, Errors — if the content script shows InjectionFailure, refresh the tab."
            />
            <Gotcha
              q="Wallet says wrong network"
              a="The popup auto-prompts to switch. If MetaMask blocked it, click the Switch button in the red banner."
            />
          </ul>
        </Card>

        {/* Next steps */}
        <div className="grid sm:grid-cols-3 gap-3">
          <Button variant="outline" asChild>
            <Link href="/faucet">
              Get test MUSD <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              Open dashboard <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://github.com/PugarHuda/nih" target="_blank" rel="noopener noreferrer">
              GitHub source <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <p className="text-xs text-muted text-center mt-10">
          Privacy: Nih runs entirely client-side. Your wallet, your keys. We never
          touch the tip flow or read your tabs beyond the four supported sites.
        </p>
      </main>
    </>
  );
}

function StepRow({
  number,
  active,
  title,
  body,
  cta,
  onComplete,
  isLast,
}: {
  number: number;
  active: boolean;
  title: string;
  body: React.ReactNode;
  cta: string;
  onComplete: () => void;
  isLast?: boolean;
}) {
  return (
    <div
      className={`fade-up rounded-xl border p-5 ${
        active ? "border-brand/40 bg-surface" : "border-border bg-bg/40"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex-none h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold ${
            active ? "bg-brand text-bg" : "bg-surface text-muted border border-border"
          }`}
        >
          {active ? number : <PlayCircle className="h-4 w-4" />}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">{title}</h3>
          {active && (
            <div className="fade-up">
              {body}
              <Button size="sm" variant="default" onClick={onComplete} className="mt-3">
                <CheckCircle2 className="h-4 w-4" />
                {cta}
                {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CopyChip({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-bg/50 px-3 py-2.5 group">
      <code className="font-mono text-sm flex-1 text-fg">{text}</code>
      <button
        onClick={() => {
          navigator.clipboard.writeText(text);
          toast.success("Copied");
        }}
        className="p-1.5 rounded hover:bg-surface transition"
        aria-label="Copy"
      >
        <Copy className="h-3.5 w-3.5 text-muted group-hover:text-fg" />
      </button>
    </div>
  );
}

function Gotcha({ q, a }: { q: string; a: string }) {
  return (
    <li>
      <p className="text-fg font-medium mb-1">{q}</p>
      <p>{a}</p>
    </li>
  );
}
