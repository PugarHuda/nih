# CLAUDE.md — Nih project

Project context for Claude Code working on this monorepo.

## What is Nih?

Browser extension + dashboard that lets users tip MUSD (Bitcoin-backed stablecoin on Mezo) on any social profile. Creators can borrow against accumulated tips without selling BTC.

**Hackathon**: Mezo Hack: Building Bitcoin's Future (Encode Club × Mezo × Supernormal Foundation).
**Track**: Supernormal dApps (MUSD).

## Stack

| Layer | Tech | Notes |
|---|---|---|
| Contracts | Solidity 0.8.28 + Hardhat | Target evmVersion `london` |
| Dashboard | Next.js 15 App Router + TypeScript + Tailwind | shadcn-style components, framer-motion |
| Wallet | @mezo-org/passport + RainbowKit + wagmi + viem | Supports Xverse, Unisat, MetaMask |
| Extension | Plasmo + React + TypeScript | Manifest V3, Chrome + Firefox |
| Indexing | Goldsky subgraph (or Turbo Pipeline fallback) | |
| AI | Boar Blockchain MCP + Claude SDK | Tip amount suggestions |

## Mezo network

- **Testnet (matsnet)**: chainId 31611, RPC `https://rpc.test.mezo.org`
- **Mainnet**: chainId 31612, native gas = BTC

## Conventions

- TypeScript strict mode everywhere
- Solidity: GPL-3.0, OpenZeppelin v5 imports
- No emojis in code/comments unless user asks
- All copy, comments, and docs in English (public-facing submission)
- Test on matsnet only for hackathon submission

## Run the dev loop

```bash
# Contracts
pnpm --filter contracts compile
pnpm --filter contracts test
pnpm --filter contracts deploy:matsnet

# Dashboard
pnpm --filter dashboard dev

# Extension
pnpm --filter extension dev
```

## Bonus prizes to claim

- [ ] Goldsky subgraph deployed (`subgraph/`)
- [ ] Spectrum Nodes RPC documented in architecture
- [ ] Boar MCP integrated for tip suggestions
- [ ] Validation Cloud noted in mainnet plan

## Submission checklist

- [ ] Demo video (3 min) under `docs/DEMO.md`
- [ ] Architecture diagram (`docs/ARCHITECTURE.md`)
- [ ] Pitch one-pager (`docs/PITCH.md`)
- [ ] Contract addresses in README
- [ ] All repos public on GitHub
- [ ] Working demo URL (Vercel)
