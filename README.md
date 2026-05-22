# Nih — Tip MUSD anywhere on the web

> Bitcoin-backed tipping with self-service banking baked in.

*Nih* (Indonesian: "here you go") — the casual way to hand someone something.

**Mezo Hackathon submission — Track: Supernormal dApps (MUSD)**

- 🌐 **Live demo**: https://nih-seven.vercel.app
- 📦 **GitHub**: https://github.com/PugarHuda/nih
- ⛓ **Contracts deployed**: Mezo matsnet (chainId 31611) — see [addresses below](#deployed-contract-addresses-matsnet)
- 📊 **Goldsky subgraph**: [`nih/v1`](https://api.goldsky.com/api/public/project_cmo5pukv64upu01y48tefank9/subgraphs/nih/v1/gn) — live event indexing
- 🧩 **Extension**: `extension/build/chrome-mv3-prod.zip` (load unpacked to test)
- 🚀 **Auto-deploy**: every push to `main` ships to Vercel production

A browser extension + dashboard that turns any social profile (Twitter, YouTube, Substack, Medium, GitHub) into a Bitcoin-backed bank account. Tip in MUSD with a click; creators receive stable Bitcoin-backed money and instantly borrow against accumulated tips without selling.

---

## What makes Nih different

| | Tippin.me | X Native Tip | **Nih** |
|---|---|---|---|
| Currency | BTC (volatile) | BTC (volatile) | **MUSD (Bitcoin-backed stable)** |
| Platforms | Twitter only | Twitter only | **Twitter, YT, Substack, Medium, GitHub** |
| Wallet | Lightning custodial | Lightning | **Self-custody (Xverse/Unisat/MetaMask)** |
| Composable | ❌ | ❌ | **Credit Line: borrow against tips** |
| Fee | ~0.5% | ~1% | **0.5% (50% off if paid in MEZO)** |

---

## Architecture

```
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│  Browser Extension │    │  Next.js Dashboard │    │  Embed Widget      │
│  (Plasmo)          │    │  (Vercel)          │    │  <script>          │
└──────────┬─────────┘    └──────────┬─────────┘    └──────────┬─────────┘
           │                         │                         │
           └─────────────────────────┴─────────────────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │  Mezo matsnet (chainId 31611) │
                     │  ┌─────────────────────────┐  │
                     │  │  NihCore                │  │
                     │  │  - registry             │  │
                     │  │  - vault (escrow)       │  │
                     │  │  - router (tip + fee)   │  │
                     │  └─────────────────────────┘  │
                     │  ┌─────────────────────────┐  │
                     │  │  NihCredit              │  │
                     │  │  - borrow against tips  │  │
                     │  └─────────────────────────┘  │
                     │  ┌─────────────────────────┐  │
                     │  │  MUSD ERC-20 / MEZO     │  │
                     │  └─────────────────────────┘  │
                     └───────────────────────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │  Goldsky Subgraph             │
                     │  (events indexer)             │
                     └───────────────────────────────┘
```

## Monorepo layout

```
nih/
├── contracts/      # Hardhat — Solidity smart contracts
├── dashboard/      # Next.js — creator dashboard & claim page
├── extension/      # Plasmo — browser extension
├── subgraph/       # Goldsky subgraph definition
└── docs/           # PITCH.md, DEMO.md, ARCHITECTURE.md
```

## Quickstart

```bash
# 1) Smart contracts
cd contracts
pnpm install
cp .env.example .env   # add PRIVATE_KEY
pnpm hardhat compile
pnpm hardhat run scripts/deploy.ts --network matsnet

# 2) Dashboard
cd ../dashboard
pnpm install
cp .env.example .env.local   # add CONTRACT_ADDRESSES from step 1
pnpm dev   # → http://localhost:3000

# 3) Extension
cd ../extension
pnpm install
pnpm dev   # loads at chrome://extensions (load unpacked from build/chrome-mv3-dev)
```

## Mezo testnet (matsnet)

| | |
|---|---|
| Chain ID | 31611 |
| RPC | https://rpc.test.mezo.org |
| Explorer | https://explorer.test.mezo.org |
| Faucet | https://faucet.test.mezo.org |
| Native gas | BTC (18 decimals) |

## Deployed contract addresses (matsnet)

| Contract | Address |
|---|---|
| MockMUSD | [`0x77Bb4E31FFb4a0d2fF8cDd50958ACE20b275caa5`](https://explorer.test.mezo.org/address/0x77Bb4E31FFb4a0d2fF8cDd50958ACE20b275caa5) |
| MockMEZO | [`0x67Beea65318fa87390eb9f809a5a77708BCad698`](https://explorer.test.mezo.org/address/0x67Beea65318fa87390eb9f809a5a77708BCad698) |
| NihRegistry | [`0x91A841E29bD86e921A269d7360632dDc6175B9c5`](https://explorer.test.mezo.org/address/0x91A841E29bD86e921A269d7360632dDc6175B9c5) |
| NihVault | [`0x7e02327D9e6097DA2a30C588A9BA62C923ad8AD6`](https://explorer.test.mezo.org/address/0x7e02327D9e6097DA2a30C588A9BA62C923ad8AD6) |
| NihRouter | [`0x68437B812419B8EEE240eC6528f43d111Dd348D3`](https://explorer.test.mezo.org/address/0x68437B812419B8EEE240eC6528f43d111Dd348D3) |
| NihCredit | [`0x913E736B1dba8a4f3bF5953800248Ac89C18ec82`](https://explorer.test.mezo.org/address/0x913E736B1dba8a4f3bF5953800248Ac89C18ec82) |

## Bonus prize integrations

- **Goldsky** — subgraph indexing tip events
- **Spectrum Nodes** — testnet RPC failover
- **Boar Network MCP** — AI tip suggestion engine
- **Validation Cloud** — mainnet RPC (future)

## License

MIT
