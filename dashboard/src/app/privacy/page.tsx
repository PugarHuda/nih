import { Header } from "@/components/header";

export const metadata = {
  title: "Privacy Policy — Nih",
  description: "Nih is a fully client-side browser extension. We collect no data.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="container max-w-2xl py-16 prose prose-invert">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-muted text-sm mb-10">Last updated: May 22, 2026</p>

        <Section title="Data we collect">
          <p>
            None. Nih is a client-side browser extension and self-custodial dApp. The
            only data the extension stores is your local settings (default tip amount,
            MEZO-fee toggle) in your browser&apos;s <code>chrome.storage</code>. We never
            see this data.
          </p>
        </Section>

        <Section title="Data we transmit">
          <p>
            Only what you explicitly choose to send. When you click <strong>Tip</strong>,
            your wallet signs a transaction that&apos;s broadcast to the Mezo blockchain
            via the public RPC endpoint configured in your build — same trust model as
            any DeFi dApp.
          </p>
        </Section>

        <Section title="Third parties">
          <p>
            We read on-chain state from public RPC providers — Mezo (rpc.test.mezo.org),
            Spectrum Nodes, Validation Cloud, Boar Network. These are stateless reads;
            the providers do not link the reads to your wallet identity beyond standard
            IP-level web traffic.
          </p>
          <p>
            Handle verification fetches publicly readable pages on Twitter, GitHub,
            YouTube, Substack, and Medium when you opt into the claim flow. We do not
            store any of the response content beyond the boolean &quot;challenge found&quot;.
          </p>
        </Section>

        <Section title="Tracking">
          <p>None. No analytics, no fingerprinting, no telemetry, no cookies.</p>
        </Section>

        <Section title="Open source">
          <p>
            Every line of the extension and the dashboard is open source under the MIT
            license at{" "}
            <a className="text-brand hover:underline" href="https://github.com/PugarHuda/nih">
              github.com/PugarHuda/nih
            </a>
            . Audit it yourself or fork it.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We&apos;ll bump the &quot;Last updated&quot; date if anything material
            changes. Substantive changes will also be announced in the project README.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Open an issue on the GitHub repo, or reach the maintainer at the email
            listed in the project&apos;s <code>package.json</code>.
          </p>
        </Section>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="text-muted leading-relaxed text-sm space-y-3">{children}</div>
    </section>
  );
}
