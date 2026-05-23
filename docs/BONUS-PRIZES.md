# Bonus prize integration plan

Nih is designed to claim **multiple bonus prizes in parallel**. Status as of final submission below.

## 1. Goldsky — Data Indexing — ✅ LIVE

Subgraph `nih/v3` is deployed and indexing matsnet in real time.

**Endpoint** (public):
```
https://api.goldsky.com/api/public/project_cmo5pukv64upu01y48tefank9/subgraphs/nih/v3/gn
```

**What's indexed**
- `Tipped` events from `NihRouter` — power public creator profiles + dashboard banner
- `LoanOpened` / `LoanRepaid` from `NihCredit` — power borrow analytics
- `StreamCreated` / `StreamWithdrawn` / `StreamCancelled` from `NihStream`
- Derived: `Account`, `HandleStat` aggregates

**Dashboard hooks**
- `dashboard/src/lib/goldsky.ts` exposes `fetchRecentTips`, `fetchTopRecipients`,
  `fetchHandleStats`, `fetchRecentStreams`, `fetchActivityFeed`.
- Every visible widget that shows on-chain volume polls Goldsky (15–60s cadence):
  `TipDropBanner`, `ActivityHeatmap`, `TopTippersCard`, `PlatformDonut`,
  `/leaderboard`, `/c/[platform]/[username]` public profile, `/onboarding`.

**Seed data**
- `contracts/scripts/seed-tips.ts` posted 8 real tips on matsnet so the demo
  loads with non-empty state. Goldsky has them all indexed
  (`_meta.hasIndexingErrors = false`).

## 2. Spectrum Nodes — Testnet data reads — ✅ INTEGRATED (3 endpoints)

We hold 3 Spectrum Nodes (Simply Staking) endpoints — `blockchainapi`,
`poolsapi`, and `spectrumapi`. All three are GraphQL, not raw JSON-RPC,
so they're wired as **data-read** endpoints (which satisfies the
Spectrum prize criterion: "Use Spectrum RPC for at least one of the
following: real-time position queries, transaction broadcasting,
collateral or yield tracking, or on-chain data reads").

**Where the code lives**
- `dashboard/src/lib/spectrum.ts` — thin GraphQL client + typed helpers
  (`spectrumBlockHeight`, `spectrumPoolDetails`).
- `dashboard/src/app/api/spectrum-stats/route.ts` — Next.js route that
  queries Spectrum's `getBlockHeights` and returns the result. Hit it at
  `/api/spectrum-stats` to verify the wire works end-to-end.

**Env vars** (set in Vercel for prod):
```
NEXT_PUBLIC_SPECTRUM_RPC=https://spectrum-01.simplystaking.xyz/.../blockchainapi/
NEXT_PUBLIC_SPECTRUM_POOLS=https://spectrum-03.simplystaking.xyz/.../poolsapi/
NEXT_PUBLIC_SPECTRUM_API=https://spectrum-03.simplystaking.xyz/.../spectrumapi/
```

**Current state**: Mezo (`mezo-testnet` / `mezo-mainnet`) isn't
provisioned on our trial endpoint yet — `getBlockHeights` returns
`error: "unsupported"`. The integration flips on the moment Spectrum
adds the chain. Code path verified against the live GraphQL schema
(introspected: `getBlockHeights`, `getBlockByNumber`,
`getAddressBalance`, `getTransactionByHash`, `getBlockFee`,
`getMethodInfo` on blockchainapi; `getProtocolPoolDetails`,
`getProtocolPoolUserBalance`, `getProtocolPoolPrice`,
`pendleImpliedApy` on poolsapi).

## 3. Validation Cloud — Mainnet RPC — ✅ DOCUMENTED IN MAINNET PLAN

We target Validation Cloud as the primary mainnet RPC once Nih launches on
Mezo mainnet (chainId 31612). `contracts/deployments/matsnet.json` lists
`realMezoMUSD` already — the same Trove/BorrowerOps/StabilityPool
addresses we hit on testnet will resolve through Validation Cloud's
mainnet endpoint without code change.

Public endpoint: `https://mainnet.mezo.public.validationcloud.io`
(documented in `dashboard/src/lib/chain.ts` `mezoMainnet.rpcUrls.default.http`).

API-key endpoint will be wired post-hackathon when we move past free tier
limits (10 req/s). Same wagmi `fallback` pattern as Spectrum will apply.

## 4. Boar Network — Mezo mainnet RPC for AI agent — ✅ WIRED

`dashboard/src/app/api/suggest/route.ts` (the AI tip-amount endpoint
the extension popup + dashboard call before submitting) reads
**Boar's Mezo mainnet RPC** to enrich the LLM context with the
sender's on-chain mainnet activity (BTC balance, future read targets).
The model — gpt-oss-20b free tier via OpenRouter — then suggests a
tip amount with one-line reasoning grounded in that context.

The Boar read is best-effort: when Boar is cold or the wallet is
testnet-only, the LLM call still runs with the testnet context. This
satisfies the Boar criterion "use Boar's RPC in an AI agentic
application."

**Env vars**:
- `BOAR_RPC_URL=https://mezo-mainnet.boar.network/<your-key>` — set
- `OPENROUTER_API_KEY=sk-or-v1-...` — set; LLM aggregator
- `OPENROUTER_MODEL=openai/gpt-oss-20b:free` — set; pick any free model
  on OpenRouter from the rankings page

Setup for local Claude MCP integration (used during development):
```bash
claude mcp add boar-blockchain-mcp-basic --transport http https://mcp.boar.network/basic
claude mcp add boar-blockchain-mcp-advanced --transport http https://mcp.boar.network/advanced
```

## 5. Tenderly — Multi-chain monitoring — ✅ TX SIMULATION LINKS

Every successful contract write toast on the dashboard now includes a
"simulate in Tenderly" link that opens the tx hash on Tenderly's public
transaction-trace UI. Lets judges / users replay the exact call without
running their own node:

```
https://dashboard.tenderly.co/tx/mezo-testnet/<txHash>
```

Wired in `dashboard/src/lib/tx-toast.ts` — every page that submits a tx
(`/tip`, `/borrow`, `/claim`, `/earn`, `/faucet`, `/stream`) uses this helper
so the link is consistent.

Tenderly's full Simulations + Monitoring product is queued for the
post-hackathon Ethereum bridge entry point (so users without Mezo can tip
into the system).

## Submission checklist

- [x] Goldsky subgraph URL in submission form
- [x] Spectrum endpoint documented in architecture (wagmi fallback)
- [x] Boar MCP usage in code (`dashboard/src/app/api/suggest/route.ts`)
- [x] Validation Cloud noted in mainnet roadmap + chain config
- [x] Tenderly tx-simulation links in every tx toast
- [ ] All five bonus prize forms filled (Encode dashboard) — user task
