import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nih · Developer docs",
  description:
    "Contract addresses, ABI surface, on-chain entry points, subgraph endpoint, and REST routes for building on Nih.",
};

const CONTRACTS = {
  MUSD: "0xf9BBcCC0F1b68EA07c86de6F88C76b3d8E2dD0af",
  MEZO: "0xf47D21Afd23639870c5185462B2F418eF59d6F67",
  NihRegistry: "0xe349707D8BAfA05BC7dd2A2dE16638CBE4673043",
  NihVault: "0xe884953A76AB6eAb45a9F3A58834FFFF8c133AAc",
  NihRouter: "0x67Fb6f01C35D4793b952C9BFE606c0B7Cb1F7c15",
  NihCredit: "0x256f577DAf3354156f39a77606B6e4eDc8Fd762c",
  NihStream: "0x28364eF04EF75e77B28553Df47845cf7dB6fD32d",
  NihEarn: "0x9374377F59be566f10F47d575C533f24A8D6B961",
  NihTrove: "0xEe32066B1F61D8f06103f882AA537aCFe01468f4",
} as const;

const MEZO_PRIMITIVES = {
  "Mezo MUSD (real)": "0xf9BBcCC0F1b68EA07c86de6F88C76b3d8E2dD0af",
  BorrowerOperations: "0xa14cbA6DD12D537A8decc7dd3c4aC413B8711eba",
  TroveManager: "0x7FE0A5a7EeBD88530c58824475edEae33424671F",
  StabilityPool: "0xCfdb903cD2Dc14E24e78130A63b20Ba65107262A",
  PriceFeed: "0xf28B0d5165b4ad9D5C04CdE1E37B400f8ca5A8cb",
} as const;

const SUBGRAPH_URL =
  "https://api.goldsky.com/api/public/project_cmo5pukv64upu01y48tefank9/subgraphs/nih/v4/gn";

export default function DocsPage() {
  return (
    <main className="container mx-auto px-6 py-12 max-w-4xl" style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <header className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/assets/logo.svg" alt="Nih" style={{ height: 32, width: "auto" }} />
          </Link>
          <Link href="/dashboard" className="comic-btn primary" style={{ fontSize: 13, padding: "6px 14px" }}>
            Open the app →
          </Link>
        </div>
        <span className="kicker">developer docs · v0.5 · matsnet</span>
        <h1 className="h1 mt-2 mb-2">Build on Nih.</h1>
        <p className="text-base max-w-2xl" style={{ color: "var(--ink-3)" }}>
          Tip, borrow, stream, and unlock content using MUSD on Mezo matsnet.
          Everything below is the production wire — same surface the dashboard
          + extension hit. No SDK required; standard wagmi / viem / ethers calls.
        </p>
      </header>

      {/* Network */}
      <Section title="1. Network">
        <Table
          rows={[
            ["chainId", "31611"],
            ["network", "Mezo matsnet"],
            ["RPC (public)", "https://rpc.test.mezo.org"],
            ["Explorer", "https://explorer.test.mezo.org"],
            ["BTC faucet", "https://faucet.test.mezo.org"],
            ["Native gas token", "BTC (18 decimals)"],
          ]}
        />
      </Section>

      {/* Nih contracts */}
      <Section title="2. Nih contracts (matsnet)">
        <AddrTable addresses={CONTRACTS} />
        <p className="text-xs mt-3" style={{ color: "var(--ink-3)" }}>
          All Nih contracts wire MUSD to Mezo&apos;s real MUSD primitive
          (0xf9BB…0af). Open a Mezo trove (via the deposit BTC → mint MUSD
          flow at <code>app.test.mezo.org</code>) to obtain MUSD for tipping.
        </p>
      </Section>

      <Section title="3. Underlying Mezo primitives">
        <AddrTable addresses={MEZO_PRIMITIVES} />
      </Section>

      {/* Tip */}
      <Section title="4. Sending a tip">
        <p className="text-sm mb-3" style={{ color: "var(--ink-2)" }}>
          Approve MUSD to the router, then call <code>tip(...)</code>.
        </p>
        <Code lang="ts">{`// viem
import { createWalletClient, http, parseEther, keccak256, toBytes } from "viem";
import { matsnet } from "./chain"; // chainId 31611

const ROUTER = "${CONTRACTS.NihRouter}";
const MUSD   = "${CONTRACTS.MUSD}";

await wallet.writeContract({
  address: MUSD,
  abi: erc20,
  functionName: "approve",
  args: [ROUTER, parseEther("10")],
});

await wallet.writeContract({
  address: ROUTER,
  abi: routerAbi,
  functionName: "tip",
  args: [
    "twitter",                                    // platform
    "hajislamet",                                 // username
    parseEther("10"),                             // 10 MUSD
    false,                                        // payFeeInMezo
    keccak256(toBytes("anything you want here")), // bytes32 context
  ],
});`}</Code>
        <Table
          rows={[
            ["Function", "tip(string,string,uint256,bool,bytes32)"],
            ["Fee", "0.5% in MUSD, or 0.25% in MEZO if payFeeInMezo=true"],
            ["Min tip", "0.5 MUSD"],
            ["Unregistered tier cap", "10 MUSD lifetime (parks in vault)"],
            ["Event", "Tipped(sender, handleId, recipient, amount, fee, paidInMezo, context)"],
          ]}
        />
      </Section>

      {/* Borrow + read */}
      <Section title="5. Borrow / repay / monitor a credit line">
        <p className="text-sm mb-3" style={{ color: "var(--ink-2)" }}>
          NihCredit lets a wallet borrow up to 60% of its tip income as a 1%
          APR loan, with their tip balance as collateral. One open loan per wallet.
        </p>
        <Code lang="ts">{`// Open (mint MUSD against tip collateral)
await wallet.writeContract({
  address: "${CONTRACTS.NihCredit}",
  abi: creditAbi,
  functionName: "open",
  args: [parseEther("100")], // collateral in MUSD (gets 60 MUSD minted)
});

// Inspect the loan
const [principal, collateral, openedAt] = await client.readContract({
  address: "${CONTRACTS.NihCredit}",
  abi: creditAbi,
  functionName: "loans",
  args: [walletAddress],
});
const owed = await client.readContract({
  address: "${CONTRACTS.NihCredit}",
  abi: creditAbi,
  functionName: "owedAmount",
  args: [walletAddress],
});

// Repay in full (no partial repay; close + reopen smaller if needed)
await wallet.writeContract({
  address: "${CONTRACTS.NihCredit}",
  abi: creditAbi,
  functionName: "repay",
});`}</Code>
        <Table
          rows={[
            ["loans(borrower)", "returns (uint128 principal, uint128 collateral, uint64 openedAt)"],
            ["owedAmount(borrower)", "returns principal + accrued interest (1% APR)"],
            ["LTV liquidation", "80% (LTV = owed / collateral)"],
            ["Partial repay", "not supported — close + reopen"],
          ]}
        />
      </Section>

      {/* Stream */}
      <Section title="6. Streaming MUSD (subscriptions / payroll)">
        <Code lang="ts">{`// Start a 1-month, 5 MUSD subscription
await wallet.writeContract({
  address: MUSD,
  abi: erc20,
  functionName: "approve",
  args: ["${CONTRACTS.NihStream}", parseEther("5")],
});
await wallet.writeContract({
  address: "${CONTRACTS.NihStream}",
  abi: streamAbi,
  functionName: "create",
  args: [recipientAddress, parseEther("5"), 30n * 86400n], // 30 days
});

// Recipient withdraws accrued amount
await wallet.writeContract({
  address: "${CONTRACTS.NihStream}",
  abi: streamAbi,
  functionName: "withdraw",
  args: [streamId],
});

// Either party cancels — unaccrued refunds to sender
await wallet.writeContract({
  address: "${CONTRACTS.NihStream}",
  abi: streamAbi,
  functionName: "cancel",
  args: [streamId],
});`}</Code>
      </Section>

      {/* Claim */}
      <Section title="7. Claim a parked handle">
        <p className="text-sm mb-3" style={{ color: "var(--ink-2)" }}>
          Tips routed to an unregistered handle park in NihVault. Verify
          ownership via the attestation endpoint then redeem on-chain.
        </p>
        <Code lang="bash">{`# 1. Get a Tier-1 attestation (verifier reads your public profile for the challenge)
curl -X POST https://nih-seven.vercel.app/api/verify \\
  -H "content-type: application/json" \\
  -d '{
    "platform": "twitter",
    "username": "your_handle",
    "wallet":   "0xYourWallet",
    "deadline": 1779999999
  }'

# 2. Submit attestation to NihRegistry
# 3. Call NihVault.claim(handleId)`}</Code>
      </Section>

      {/* Subgraph */}
      <Section title="8. Goldsky subgraph (nih/v4)">
        <p className="text-sm mb-3" style={{ color: "var(--ink-2)" }}>
          Indexes Tipped, LoanOpened/Repaid, StreamCreated/Withdrawn/Cancelled
          events. GraphQL endpoint:
        </p>
        <Code lang="text">{SUBGRAPH_URL}</Code>
        <Code lang="graphql">{`{
  tips(first: 10, orderBy: timestamp, orderDirection: desc) {
    id amount handleId timestamp
    sender { address }
    recipient { address }
  }
  handleStats(first: 5, orderBy: totalReceived, orderDirection: desc) {
    handleId totalReceived tipCount
  }
  loans(first: 5) {
    borrower { address }
    principal collateral openedAt closedAt
  }
  streamRecords(first: 5, orderBy: startTime, orderDirection: desc) {
    streamId sender recipient deposit startTime stopTime cancelled
  }
}`}</Code>
      </Section>

      {/* REST */}
      <Section title="9. Hosted REST routes">
        <Table
          rows={[
            ["GET /api/health", "Network + contract address dump (env mirror)"],
            ["POST /api/verify", "Verifier-signed Tier-1 attestation"],
            ["POST /api/suggest", "AI tip-amount recommender (OpenRouter + Boar RPC)"],
            ["GET /api/spectrum-stats", "Spectrum Nodes blockchainapi read-through"],
            ["GET /api/og", "OpenGraph card renderer for /c/[platform]/[username]"],
          ]}
        />
      </Section>

      {/* Partners */}
      <Section title="10. Partner integrations">
        <ul className="text-sm space-y-2 mt-2" style={{ color: "var(--ink-2)" }}>
          <li>
            <b>Goldsky</b> — subgraph indexing all Nih events
            (<code>nih/v4</code>).
          </li>
          <li>
            <b>Spectrum Nodes</b> — blockchain GraphQL data reads via
            <code> /api/spectrum-stats</code>.
          </li>
          <li>
            <b>Boar Network</b> — Mezo mainnet RPC read inside the AI agent
            context loader at <code>/api/suggest</code>.
          </li>
          <li>
            <b>OpenRouter</b> — LLM aggregator powering the AI tip
            recommender (default model: <code>openai/gpt-oss-20b:free</code>).
          </li>
          <li>
            <b>Tenderly</b> — every tx-toast carries a Tenderly simulator
            deep-link for replay.
          </li>
          <li>
            <b>Validation Cloud</b> — mainnet RPC documented in the chain
            config for the post-hackathon launch.
          </li>
        </ul>
      </Section>

      <footer className="mt-16 pb-6 text-xs" style={{ color: "var(--ink-3)" }}>
        <p>
          Source:{" "}
          <a
            href="https://github.com/PugarHuda/nih"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            github.com/PugarHuda/nih
          </a>
          {" · "}
          Built for <b>Mezo Hack: Building Bitcoin&apos;s Future</b> (Supernormal dApps - MUSD track).
        </p>
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="h2 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <table
      className="w-full text-sm mono"
      style={{ border: "3px solid var(--ink)", background: "var(--paper)" }}
    >
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} style={{ borderBottom: "1.5px solid var(--line-2)" }}>
            <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--ink)", verticalAlign: "top" }}>
              {k}
            </td>
            <td style={{ padding: "8px 12px", color: "var(--ink-2)", wordBreak: "break-all" }}>
              {v}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AddrTable({ addresses }: { addresses: Record<string, string> }) {
  const rows: [string, string][] = Object.entries(addresses).map(([k, v]) => [k, v]);
  return <Table rows={rows} />;
}

function Code({ lang = "ts", children }: { lang?: string; children: string }) {
  return (
    <pre
      className="overflow-x-auto p-4 mono text-xs"
      style={{
        background: "var(--ink)",
        color: "var(--paper)",
        border: "3px solid var(--ink)",
        boxShadow: "3px 3px 0 0 var(--ink)",
        lineHeight: 1.55,
      }}
    >
      <span style={{ color: "var(--accent)", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase" }}>
        {lang}
      </span>
      {"\n"}
      {children}
    </pre>
  );
}
