# Nih — Roadmap

> Hackathon submission is the **M+0** snapshot. Below is the credible
> 6-month plan with concrete milestones, partners, and revenue targets.

## M+0 (now, hackathon submission)

- ✅ 10 contracts on Mezo matsnet (FULL_REAL — real Mezo MUSD end-to-end)
- ✅ NihRouter, NihVault, NihCredit, NihStream, NihEarn (real StabilityPool wrapper), NihTrove (real BorrowerOperations proxy)
- ✅ 29/29 contract tests + 5 invariant tests
- ✅ Plasmo Chrome MV3 extension on Twitter, YouTube, GitHub, LinkedIn
- ✅ 18-route Next.js dashboard (tip, subscribe, borrow, earn, trove, claim, unlock, profile, leaderboard, docs, onboarding tour, 5-slide pitch deck)
- ✅ Goldsky subgraph `nih/v4` indexing live; Spectrum, Boar, OpenRouter, Tenderly, Validation Cloud all wired

## M+30d — Wave-1 launch (mainnet ready)

- Deploy contracts to Mezo **mainnet** (chainId 31612) using Validation Cloud RPC as primary
- Chrome Web Store + Firefox Add-ons listing approved
- 100 verified creators onboarded across Twitter / GitHub
- $5K MUSD volume in tip transactions
- Submit Goldsky subgraph as `nih/mainnet-v1`
- Press release + launch tweet thread tagging @MezoNetwork, @EncodeClub

## M+90d — Wave-2 (creator monetisation suite)

- **OAuth Tier-2 attestation** — NextAuth providers for Twitter, GitHub, YouTube, LinkedIn. One-click handle verify replaces the challenge-text path.
- **Wave-2 partner integrations** (active pre-signed targets):
  - **Lolli** — round-up tips on online purchases that earn Bitcoin
  - **@mezo-org/sign-in-with-wallet** — drop-in SSO for partner dApps
  - **Boar Network dashboards** — surface Nih creator stats on the Boar partner page
- **Per-post tip injection** — beyond profiles: tip a specific tweet, GitHub PR, or LinkedIn post via per-element extension overlay
- **Creator analytics dashboard** — heatmap of tip arrival times, top tippers leaderboard per creator, revenue forecast
- **MEZO fee discount** — go live when real MEZO token deploys on matsnet/mainnet (currently mock for the discount preview)
- Target: $50K MUSD volume, 1K active creators

## M+180d — Wave-3 (consumer scale + governance)

- **Mobile PWA polish** — full responsive audit + iOS Safe Area + Add-to-Home-Screen prompt
- **DAO migration** of fee treasury — `NihRouter.treasury` upgradable to a DAO multisig + on-chain voting via veMEZO weights
- **Cross-chain entry point** — Tenderly-simulated bridge from Ethereum/Base via x402 + Mezo's matter relayer (so non-Mezo users can tip without leaving their chain)
- **Mezo Earn auto-deposit** — NihEarn deposits idle MUSD into Mezo Earn (not just StabilityPool) for compounded yield
- Target: $500K MUSD volume, 10K active creators, $15K MRR

## Unit economics (steady-state target)

| Stage | Active creators | Avg tip vol/creator/mo | Total monthly volume | 0.5% take | MRR |
|---|---|---|---|---|---|
| M+30d | 100 | 50 MUSD | 5K MUSD | 25 MUSD | $25 |
| M+90d | 1,000 | 50 MUSD | 50K MUSD | 250 MUSD | $250 |
| M+180d | 10,000 | 50 MUSD | 500K MUSD | 2.5K MUSD | $2.5K |
| Year 2 | 100,000 | 30 MUSD (long-tail) | 3M MUSD | 15K MUSD | $15K |

Plus parallel revenue: 1% APR on locked tip collateral, share-of-yield from NihEarn StabilityPool deposits, optional premium subscription tier (advanced analytics + verified-only filter).

## Why this is realistic

- Patreon hit $1B in creator payouts within 4 years of launch (2013–2017) — Nih needs 0.05% of that pace to hit Y2 targets.
- Bitcoin-native creators on X already use BTC Lightning tips — we just give them a stable replacement with composable utility (credit + yield).
- Mezo's matrix of native MUSD + 1% APR borrow + StabilityPool yield is unique among Bitcoin L2s — no other chain lets us ship the same product stack.

## Funding ask

$5K veMEZO First Place (MUSD Track) → covers Chrome Web Store + Firefox listing fees + first 30 days of partner-integration engineering. Milestone grant unlock conditional on:

- M+30: 100 verified creators + mainnet deployment proof
- M+90: $50K MUSD cumulative volume + 1 Wave-2 partner go-live
