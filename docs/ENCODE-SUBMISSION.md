# Encode Club submission form — copy-paste text

> Track: **Supernormal dApps - MUSD Track** (only one — do NOT cross-submit).
> Project name: **Nih**
> Submitter: Pugar Huda Mantoro

Paste each block into the matching Encode dashboard field.

---

## Project Name
```
Nih
```

## Description (Optional / brief summary)
```
Bitcoin-backed tipping on Mezo. A browser extension + dashboard that turns
any social profile (Twitter, YouTube, GitHub, LinkedIn) into a one-click
MUSD tip target. Creators receive real Mezo MUSD, borrow against
accumulated tips at 1% APR, stream monthly subscriptions, and earn BTC
yield via Mezo's real Stability Pool — all without ever selling their
Bitcoin exposure.
```

## Project Readiness
Select: **Ready to deploy on mainnet**

(All contracts pass 34/34 tests on Mezo matsnet with real Mezo MUSD wiring;
mainnet deployment is a single env flip + `vercel deploy --prod`.)

## How it works
```
THE PROBLEM
Tipping creators in Bitcoin today is either custodial (Patreon's 5–10% cut
+ slow payouts) or technical pain (BTC Lightning channels, custodial
wallets, volatile BTC price). None of these solutions give creators stable
income that's composable with the rest of DeFi.

THE SOLUTION
Nih ships three layers on Mezo:

1. BROWSER EXTENSION (Plasmo Chrome MV3, 4 platforms)
   - Floating "Tip MUSD" button on every Twitter / YouTube / GitHub /
     LinkedIn profile
   - Per-tweet, per-PR / issue, per-LinkedIn-post, per-video inline tip
     links with custom-amount dropdown (1/5/10/25 MUSD + custom input)
   - Click → opens nih-seven.vercel.app/tip prefilled → user confirms in
     wallet

2. ON-CHAIN CONTRACTS (Solidity 0.8.28, 34/34 tests, FULL_REAL deploy)
   - NihRegistry — social handle → wallet mapping with verification tiers
   - NihVault — escrow holding tips for unregistered handles, 180-day TTL
   - NihRouter — single entry: tip(platform, username, amount,
     payFeeInMezo, ctx). 0.5% fee in MUSD or 0.25% in MEZO
   - NihCredit — peer-pool loans against tip balance, 60% LTV at 1% APR
   - NihStream — per-second MUSD streams (Patreon-style subscriptions)
   - NihEarn — wraps Mezo's REAL StabilityPool for BTC liquidation yield
   - NihTrove — per-user proxy clones wrapping Mezo's REAL
     BorrowerOperations for BTC-collateralised MUSD mint

   All MUSD flows route through Mezo's real MUSD primitive
   (0xf9BBcCC0F1b68EA07c86de6F88C76b3d8E2dD0af). NihEarn + NihTrove
   wrap three real Mezo primitives directly — no fork, no simulation.

3. CREATOR DASHBOARD (Next.js 15, 18 routes)
   /dashboard - live tip banner + handle stats + LTV monitor
   /tip /stream /borrow /earn /trove /claim /unlock /faucet
   /c/[platform]/[username] - public creator profile
   /onboarding - interactive product tour
   /docs - developer reference with code snippets
   /slides - 5-slide pitch deck
   /leaderboard - top recipients live from Goldsky

MUSD POSITIONING
MUSD is the primary currency for every flow. The extension does not even
offer a non-MUSD option. NihEarn's StabilityPool yield is the production-
grade composability story (deposit MUSD, earn BTC from liquidations
+ MUSD from redemption fees). NihTrove turns idle BTC into spendable
MUSD without selling the BTC.
```

## Target Group
```
PRIMARY: Bitcoin-native social creators — Twitter / YouTube / GitHub /
LinkedIn voices who today either rely on Patreon (custodial, 5–10% fee)
or Lightning tips (volatile BTC, brutal UX). Nih gives them stable
income they can compose into a credit line + yield position.

SECONDARY: BTC holders who want to USE Bitcoin's value without selling.
The "tip" entry point is the gateway; once their MUSD is on Nih it can
back a NihCredit loan or earn via NihEarn StabilityPool.

ALIGNMENT WITH SUPERNORMAL TRACK
Track text: "consumer apps where Bitcoin-backed MUSD is the primary
currency: users play games, pay creators, shop online". We hit the
creator-payment focus area literally and extend it with stream-based
subscriptions, paywalled content (/unlock), and creator credit line —
all three are sub-categories the track called out by name.
```

## Product / Product Category
```
Social & Creator Economy — tipping + content subscriptions + creator
monetization tools (specifically: Bitcoin-stable creator banking).

Sub-categories touched:
- Tipping systems (extension button)
- Content subscriptions (NihStream monthly presets)
- Creator monetization (NihCredit borrow-against-tips)
- Community tools (handle leaderboard, public profile pages with
  share-link copy)
- Pay-per-view (/unlock — MUSD-gated content reveal demo)
```

## Tech Stack
```
SMART CONTRACTS
- Solidity 0.8.28 (evm: cancun) + Hardhat + Mocha/Chai
- OpenZeppelin v5 (Ownable, ReentrancyGuard, ECDSA, MessageHashUtils,
  SafeERC20)
- 34/34 tests passing (29 functional + 5 property-style invariants)

DASHBOARD
- Next.js 15 App Router + TypeScript strict + Tailwind 3
- wagmi 2 + viem 2 + RainbowKit (via @mezo-org/passport getConfig)
- Mezo Passport SDK for wallet connectors (Xverse, Unisat, MetaMask)
- Sonner (toasts gated by tx receipt — survives RPC blip via fallback
  transport)
- View Transitions API for cross-route fade
- Goldsky GraphQL client for live indexing
- OpenRouter LLM (free model) for AI tip suggestions

BROWSER EXTENSION
- Plasmo (Chrome MV3) on Twitter, YouTube, GitHub, LinkedIn
- Floating button + per-element inline tip pills with custom amount
- URL-hash bridge for popup ↔ dashboard wallet sync (nonce + consent)

SUBGRAPH
- Goldsky `nih/v4` — Tip / Account / HandleStat / Loan / StreamRecord
  entities

PARTNER INTEGRATIONS (all live)
- Goldsky — subgraph indexing
- Spectrum Nodes — 3 GraphQL endpoints (/api/spectrum-stats wire)
- Boar Network — Mezo mainnet RPC powering the /api/suggest AI agent
- OpenRouter — LLM aggregator (default openai/gpt-oss-20b:free)
- Tenderly — simulator deep-link in every tx-toast
- Validation Cloud — mainnet RPC plan (chain.ts mainnet endpoint)

DEPLOYED
- Mezo matsnet (chainId 31611), FULL_REAL mode — every Nih contract
  wires to real Mezo MUSD (0xf9BBcCC0F1b68EA07c86de6F88C76b3d8E2dD0af).
- Vercel auto-deploy from `main` → https://nih-seven.vercel.app
```

## Unique Value Proposition (UVP)
```
Nih is the only Bitcoin-tipping product that ships REAL Mezo MUSD end-to-end
(not a fork, not a mock), wraps THREE Mezo primitives (StabilityPool,
BorrowerOperations, TroveManager) so creator income is instantly composable
with Mezo's native borrow + yield rails, and reaches FOUR consumer
platforms via a browser extension that ships custom-amount per-post tip
buttons today (not vapor-roadmap).

Versus Patreon: self-custody, 0.5% vs 5–10% fee, Bitcoin-backed stable.
Versus Twitter native BTC tip / Tippin.me: stable MUSD instead of volatile
BTC, 4 platforms instead of 1, composable credit line / yield / subscriptions
on top of tips.
```

## Future milestones (3 next, post-hackathon)
```
M+30 days — MAINNET CUTOVER
- Deploy contracts to Mezo mainnet (chainId 31612) via Validation Cloud
  RPC primary
- Chrome Web Store + Firefox Add-ons listing approved (zip artifact
  already submission-ready in dashboard/public/nih-extension-latest.zip)
- 100 verified creators onboarded across Twitter + GitHub
- Goldsky mainnet subgraph published as nih/mainnet-v1
- Press release tagging @MezoNetwork + @EncodeClub

M+90 days — OAUTH TIER-2 + WAVE-2 PARTNERS
- NextAuth Twitter/GitHub/YouTube/LinkedIn providers for one-click handle
  verification (current challenge-text Tier-1 remains as fallback)
- Wave-2 partner integrations live: Lolli round-up tips, Mezo
  sign-in-with-wallet SSO, Boar Network creator-stats dashboard
- Per-post tip injection beyond profiles: per-tweet, per-PR/issue,
  per-LinkedIn-post all gain context-aware tip routing
- Target: $50K cumulative MUSD volume, 1,000 verified creators
- Creator analytics dashboard with heatmap + revenue forecast

M+180 days — CONSUMER SCALE + DAO
- Mobile PWA polish + iOS Add-to-Home-Screen
- Cross-chain entry: Tenderly-simulated x402 bridge from Ethereum / Base
  so non-Mezo users can tip without leaving their home chain
- Mezo Earn auto-deposit adapter — NihEarn can compound into Mezo Earn
  beyond just StabilityPool
- Fee treasury migrated from deployer address to veMEZO-weighted DAO
  multisig with on-chain voting
- Target: $500K MUSD volume, 10K verified creators, $2.5K MRR from
  0.5% take rate alone (excluding parallel borrow/yield revenue)
```

## Team Info
```
Pugar Huda Mantoro — solo builder + product / engineering
X: @hajislamet
LinkedIn: pugarhuda
GitHub: PugarHuda
Email: pugarhudam@gmail.com
Indonesian builder, AI + workflow automation background. Built Nih
solo across the hackathon window with Claude Code pair-programming.
```

## Link to testnet staging environment
```
https://nih-seven.vercel.app
```

Supporting URLs the form may ask for separately:
- Live dashboard: https://nih-seven.vercel.app
- 5-slide pitch deck: https://nih-seven.vercel.app/slides
- Developer docs: https://nih-seven.vercel.app/docs
- Interactive walk-through: https://nih-seven.vercel.app/onboarding
- Source code: https://github.com/PugarHuda/nih
- Goldsky subgraph (live data): https://api.goldsky.com/api/public/project_cmo5pukv64upu01y48tefank9/subgraphs/nih/v4/gn
- Health endpoint: https://nih-seven.vercel.app/api/health

---

## Bonus prize forms (submit each separately on Encode dashboard)

- **Goldsky** — subgraph `nih/v4`, indexing Tipped / LoanOpened/Repaid /
  StreamCreated/Withdrawn/Cancelled events. Live endpoint URL above.
- **Spectrum Nodes** — 3 endpoints wired (blockchainapi, poolsapi,
  spectrumapi) in `dashboard/src/lib/spectrum.ts`. Live route at
  `/api/spectrum-stats`.
- **Boar Network** — Mezo mainnet RPC powers the AI tip-amount agent
  at `/api/suggest`. Code in `dashboard/src/app/api/suggest/route.ts`.
- **Validation Cloud** — Mainnet RPC documented in `lib/chain.ts`
  (`mezoMainnet.rpcUrls.default.http`); used in the Wave-1 mainnet
  deployment plan.
- **Tenderly** — Every successful tx-toast surfaces a Tenderly
  simulator deep-link via `lib/tx-toast.ts`.
