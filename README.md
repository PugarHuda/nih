# Nih — Tip MUSD anywhere on the web

> Bitcoin-backed tipping with self-service banking baked in.

*Nih* (Indonesian: "here you go") — the casual way to hand someone something.

**Mezo Hackathon submission — Track: Supernormal dApps (MUSD)**

- 🌐 **Live demo**: https://nih-seven.vercel.app
- 📚 **Developer docs**: https://nih-seven.vercel.app/docs
- 🎬 **Onboarding tour**: https://nih-seven.vercel.app/onboarding
- 📦 **GitHub**: https://github.com/PugarHuda/nih
- ⛓ **Contracts (FULL_REAL — all MUSD = real Mezo MUSD)**: Mezo matsnet (chainId 31611) — see [addresses below](#deployed-contract-addresses-matsnet)
- 📊 **Goldsky subgraph**: [`nih/v4`](https://api.goldsky.com/api/public/project_cmo5pukv64upu01y48tefank9/subgraphs/nih/v4/gn) — live event indexing
- 🧩 **Extension**: latest build at [`/install`](https://nih-seven.vercel.app/install) (Chrome MV3, 4 platforms — Twitter, YouTube, GitHub, LinkedIn)
- ⚡ **Real Mezo MUSD end-to-end**: tip / borrow / stream / earn / unlock all route through `0xf9BBcCC0F1b68EA07c86de6F88C76b3d8E2dD0af`
- 🌊 **Streaming subscriptions**: NihStream — per-second MUSD subscriptions, Patreon-style monthly presets
- 💰 **Real Earn**: NihEarn wraps Mezo's StabilityPool for liquidation yield
- 🏦 **Real Trove**: NihTrove wraps Mezo's BorrowerOperations for BTC-collateral MUSD mints
- 🔓 **Pay-to-unlock**: /unlock — MUSD-gated content reveal (consumer dApp showcase)
- 🚀 **Auto-deploy**: every push to `main` ships to Vercel production

A browser extension + dashboard that turns any social profile (Twitter, YouTube, GitHub, LinkedIn) into a Bitcoin-backed bank account. Tip in MUSD with a click; creators receive stable Bitcoin-backed money and instantly borrow against accumulated tips without selling.

---

## What makes Nih different

| | Tippin.me | X Native Tip | **Nih** |
|---|---|---|---|
| Currency | BTC (volatile) | BTC (volatile) | **MUSD (Bitcoin-backed stable)** |
| Platforms | Twitter only | Twitter only | **Twitter, YouTube, GitHub, LinkedIn** |
| Wallet | Lightning custodial | Lightning | **Self-custody (Xverse/Unisat/MetaMask)** |
| Composable | ❌ | ❌ | **Credit Line + Streams + Stability-Pool Yield** |
| Fee | ~0.5% | ~1% | **0.5% (50% off if paid in MEZO)** |
| MUSD primitive | n/a | n/a | **Real Mezo MUSD (not a fork)** |

---

## Architecture

```
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│  Browser Extension │    │  Next.js Dashboard │    │  Embed Widget      │
│  (Plasmo, 9 sites) │    │  (Vercel)          │    │  <script>          │
└──────────┬─────────┘    └──────────┬─────────┘    └──────────┬─────────┘
           │                         │                         │
           └─────────────────────────┴─────────────────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────────┐
                     │  Mezo matsnet (chainId 31611)     │
                     │  ┌─────────────────────────────┐  │
                     │  │  Nih core                   │  │
                     │  │  - NihRegistry              │  │
                     │  │  - NihVault (parked tips)   │  │
                     │  │  - NihRouter (tip + fee)    │  │
                     │  │  - NihCredit (1% APR loan)  │  │
                     │  │  - NihStream (per-sec subs) │  │
                     │  └─────────────────────────────┘  │
                     │              │                    │
                     │              ▼                    │
                     │  ┌─────────────────────────────┐  │
                     │  │  REAL Mezo primitives       │  │
                     │  │  - MUSD (Bitcoin-backed)    │  │
                     │  │  - BorrowerOperations       │──┼─── NihTrove proxy
                     │  │  - TroveManager             │  │
                     │  │  - StabilityPool            │──┼─── NihEarn wrapper
                     │  │  - PriceFeed                │  │
                     │  └─────────────────────────────┘  │
                     └───────────────────────────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │  Goldsky subgraph (nih/v4)    │
                     │  Tipped, LoanOpened/Repaid,   │
                     │  Stream*, Account, HandleStat │
                     └───────────────────────────────┘
```

## Monorepo layout

```
nih/
├── contracts/      # Hardhat — Solidity 0.8.28 smart contracts (29/29 tests)
├── dashboard/      # Next.js 15 App Router — creator dashboard, tip, claim,
│                   #   borrow, stream, earn, unlock, onboarding, docs
├── extension/      # Plasmo — browser extension (Chrome MV3, 4 platforms)
├── subgraph/       # Goldsky subgraph (nih/v4) — indexes all events
└── docs/           # PITCH.md, DEMO.md, ARCHITECTURE.md, BONUS-PRIZES.md
```

## Quickstart

```bash
# 1) Smart contracts
cd contracts
pnpm install
cp .env.example .env       # add PRIVATE_KEY (deployer)
pnpm compile
FULL_REAL=1 pnpm hardhat run scripts/deploy.ts --network matsnet
# (FULL_REAL=1 wires Router/Vault/Credit/Stream to real Mezo MUSD)

# 2) Mint real MUSD via Mezo trove (for tip seed)
pnpm hardhat run scripts/open-trove-mint-musd.ts --network matsnet
# Default: 0.04 BTC collateral → 2000 MUSD minted

# 3) Seed 8 tips for demo
pnpm hardhat run scripts/seed-tips.ts --network matsnet

# 4) Dashboard
cd ../dashboard
pnpm install
cp .env.example .env.local   # paste new addresses from step 1
pnpm dev   # → http://localhost:3000

# 5) Extension
cd ../extension
pnpm install
pnpm build   # → extension/build/chrome-mv3-prod (load unpacked)
```

## Mezo testnet (matsnet)

| | |
|---|---|
| Chain ID | 31611 |
| RPC | https://rpc.test.mezo.org |
| Explorer | https://explorer.test.mezo.org |
| BTC faucet | https://faucet.test.mezo.org |
| Native gas | BTC (18 decimals) |

## Deployed contract addresses (matsnet)

All Nih contracts use **real Mezo MUSD** as the value token (no mock MUSD on the tip path).

| Contract | Address |
|---|---|
| MUSD (real Mezo) | [`0xf9BBcCC0F1b68EA07c86de6F88C76b3d8E2dD0af`](https://explorer.test.mezo.org/address/0xf9BBcCC0F1b68EA07c86de6F88C76b3d8E2dD0af) |
| MEZO (mock — real MEZO not on matsnet) | [`0xf47D21Afd23639870c5185462B2F418eF59d6F67`](https://explorer.test.mezo.org/address/0xf47D21Afd23639870c5185462B2F418eF59d6F67) |
| NihRegistry | [`0xe349707D8BAfA05BC7dd2A2dE16638CBE4673043`](https://explorer.test.mezo.org/address/0xe349707D8BAfA05BC7dd2A2dE16638CBE4673043) |
| NihVault | [`0xe884953A76AB6eAb45a9F3A58834FFFF8c133AAc`](https://explorer.test.mezo.org/address/0xe884953A76AB6eAb45a9F3A58834FFFF8c133AAc) |
| NihRouter | [`0x67Fb6f01C35D4793b952C9BFE606c0B7Cb1F7c15`](https://explorer.test.mezo.org/address/0x67Fb6f01C35D4793b952C9BFE606c0B7Cb1F7c15) |
| NihCredit | [`0x256f577DAf3354156f39a77606B6e4eDc8Fd762c`](https://explorer.test.mezo.org/address/0x256f577DAf3354156f39a77606B6e4eDc8Fd762c) |
| NihStream | [`0x28364eF04EF75e77B28553Df47845cf7dB6fD32d`](https://explorer.test.mezo.org/address/0x28364eF04EF75e77B28553Df47845cf7dB6fD32d) |
| NihEarn | [`0x9374377F59be566f10F47d575C533f24A8D6B961`](https://explorer.test.mezo.org/address/0x9374377F59be566f10F47d575C533f24A8D6B961) |
| NihTrove | [`0xEe32066B1F61D8f06103f882AA537aCFe01468f4`](https://explorer.test.mezo.org/address/0xEe32066B1F61D8f06103f882AA537aCFe01468f4) |

### Underlying Mezo primitives

| Contract | Address |
|---|---|
| BorrowerOperations | `0xa14cbA6DD12D537A8decc7dd3c4aC413B8711eba` |
| TroveManager | `0x7FE0A5a7EeBD88530c58824475edEae33424671F` |
| StabilityPool | `0xCfdb903cD2Dc14E24e78130A63b20Ba65107262A` |
| PriceFeed | `0xf28B0d5165b4ad9D5C04CdE1E37B400f8ca5A8cb` |

## Bonus prize integrations

See [`docs/BONUS-PRIZES.md`](docs/BONUS-PRIZES.md) for full proof + endpoints.

- **Goldsky** ✅ live (`nih/v4`)
- **Spectrum Nodes** ✅ 3 GraphQL endpoints wired via `/api/spectrum-stats`
- **Boar Network** ✅ Mainnet RPC powering AI agent at `/api/suggest`
- **OpenRouter** ✅ LLM aggregator (free model default) for tip recommender
- **Tenderly** ✅ Simulator deep-link in every tx-toast
- **Validation Cloud** ✅ Documented in mainnet plan

## License

MIT
