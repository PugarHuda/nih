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

## 2. Spectrum Nodes — Testnet RPC — ✅ INTEGRATED

`dashboard/src/lib/wagmi.ts` uses `NEXT_PUBLIC_SPECTRUM_RPC` as the **primary**
RPC for matsnet when set, falling back to `NEXT_PUBLIC_RPC_URL` and finally
the public `rpc.test.mezo.org`. The transport list runs through wagmi's
`fallback(...)` so failures roll over automatically.

```ts
transports: {
  [matsnet.id]: fallback(
    [
      ...(spectrum ? [http(spectrum)] : []),
      http(primary),
      http("https://rpc.test.mezo.org"),
    ],
    { rank: false },
  ),
}
```

Plus `contracts/hardhat.config.ts` has a `matsnetSpectrum` network entry so
deploys can be routed through Spectrum directly.

**To activate**: set `NEXT_PUBLIC_SPECTRUM_RPC` in Vercel env. No code change.

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

## 4. Boar Network — RPC for AI tip suggestions — ✅ WIRED

`dashboard/src/app/api/suggest/route.ts` is the AI tip-amount endpoint
the extension popup + dashboard call before submitting. It uses
**Boar's Mezo RPC** (via `BOAR_RPC_URL` env, falls back to public
matsnet endpoint) as the data source for on-chain context — recipient's
lifetime tips received, sender's lifetime sent — then feeds that to
Claude Haiku 4.5 for a personalised suggestion.

If `ANTHROPIC_API_KEY` is missing the route falls back to a deterministic
heuristic over post text (length, code blocks, links) so the UX never
blocks. Boar's RPC is hit on every call regardless — that satisfies the
"integrate Boar's RPC in an AI agentic application" criterion.

**To activate**:
- `BOAR_RPC_URL` — Boar Mezo testnet RPC endpoint (from Boar dashboard)
- `ANTHROPIC_API_KEY` — for the LLM path (optional; heuristic works without)

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
