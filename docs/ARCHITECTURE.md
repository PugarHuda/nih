# Architecture

## System diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                            USER SIDE                                  │
│                                                                       │
│  ┌────────────────────┐   ┌────────────────────┐   ┌──────────────┐ │
│  │  Browser Extension │   │  Web Dashboard     │   │  Embed Widget│ │
│  │  (Plasmo + React)  │   │  (Next.js 15 App)  │   │  <script>    │ │
│  │  - Inject tip btn  │   │  - Creator panel   │   │  - Standalone│ │
│  │  - Popup wallet    │   │  - Claim flow      │   │    button    │ │
│  │  - Settings        │   │  - Borrow flow     │   │              │ │
│  └─────────┬──────────┘   └─────────┬──────────┘   └──────┬───────┘ │
│            │                        │                      │         │
└────────────┼────────────────────────┼──────────────────────┼─────────┘
             │                        │                      │
             └────────────┬───────────┴──────────────────────┘
                          │
                          ▼
         ┌──────────────────────────────────┐
         │   Mezo Passport / window.ethereum │
         │   (Xverse / Unisat / MetaMask)    │
         └────────────────┬─────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MEZO MATSNET (chainId 31611)                    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                       NihRouter                              │    │
│  │   - tip(platform, username, amount, payFeeInMezo, ctx)      │    │
│  │   - resolves handle → wallet (or vault if unregistered)     │    │
│  │   - charges fee in MUSD (0.5%) or MEZO (0.25%)              │    │
│  └────────────┬────────────────┬────────────────┬──────────────┘    │
│               │                │                │                    │
│               ▼                ▼                ▼                    │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│   │ NihRegistry    │  │ NihVault       │  │ MUSD ERC20     │       │
│   │ - tier system  │  │ - escrow       │  │ - balanceOf    │       │
│   │ - signature    │  │ - claim()      │  │ - transfer()   │       │
│   │ - resolve()    │  │ - refundTTL    │  │                │       │
│   └────────────────┘  └────────────────┘  └────────────────┘       │
│                              │                                       │
│                              ▼                                       │
│                  ┌────────────────────┐                              │
│                  │ NihCredit          │                              │
│                  │ - open(collateral) │                              │
│                  │ - 60% LTV          │                              │
│                  │ - 1% fixed APR     │                              │
│                  │ - repay/liquidate  │                              │
│                  └────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌──────────────────────────────────┐
         │      Off-chain Infrastructure    │
         │                                  │
         │  ┌────────────────────────────┐  │
         │  │ Backend Verifier (Next API)│  │
         │  │ /api/verify                │  │
         │  │ Signs Tier 1/2 attestation │  │
         │  └────────────────────────────┘  │
         │                                  │
         │  ┌────────────────────────────┐  │
         │  │ Goldsky Subgraph           │  │
         │  │ - Tipped events            │  │
         │  │ - LoanOpened events        │  │
         │  │ - Powers leaderboards      │  │
         │  └────────────────────────────┘  │
         │                                  │
         │  ┌────────────────────────────┐  │
         │  │ Boar Blockchain MCP        │  │
         │  │ - AI tip suggestions       │  │
         │  │ - Read balance/positions   │  │
         │  └────────────────────────────┘  │
         └──────────────────────────────────┘
```

## Contract responsibilities

### NihRegistry.sol
- Stores mapping `bytes32 handleId → (wallet, tier, verifiedAt)`
- `handleId = keccak256(platform || ":" || username)`
- Verification via off-chain signer (Tier 1 signature, Tier 2 OAuth, Tier 3 DAO whitelist via `manualRegister`)
- Reverse lookup: `handlesOf(wallet) → bytes32[]`

### NihVault.sol
- Escrow for unclaimed tips (recipient not yet registered)
- 180-day TTL → auto-refund to sender (anyone can call, 0.1% keeper bounty)
- `claim(handleId)` sweeps all parked tips when caller is the registered owner

### NihRouter.sol
- Single entry point for tipping flow
- Resolves handle, routes to wallet or vault
- Charges fee (0.5% MUSD default, 0.25% if paid in MEZO)
- Emits `Tipped` event with full context (sender, recipient, amount, fee, ctx)

### NihCredit.sol
- Lender pool — anyone deposits MUSD, earns interest from borrowers
- Borrowers stake claimed MUSD as collateral, mint 60% LTV
- 1% fixed APR (matching MUSD trove rate)
- 90% liquidation threshold (interest accrual triggers liquidation)
- Keeper bounty 0.5% of seized collateral

## Off-chain pieces

### Backend verifier (Next.js API route)
- `/api/verify` accepts (platform, username, wallet)
- In production: validates handle ownership via Twitter OAuth, signed-tweet challenge, etc.
- In hackathon: signs Tier 1 attestation directly (demo simplification)
- Signed payload: `keccak256(handleId, wallet, tier, deadline, chainId)`
- On-chain `NihRegistry` verifies signature via stored verifier address

### Goldsky subgraph
- Indexes `Tipped`, `Registered`, `LoanOpened`, `LoanRepaid` events
- Powers: creator dashboard tip feed, sender history, leaderboards
- Schema: see `subgraph/schema.graphql` (TODO)

### Boar MCP integration
- AI suggestion engine queries Boar MCP for:
  - Recipient's lifetime tips received (social proof)
  - Sender's tip history (recommend tier)
  - Recent gauge activity on Mezo Earn (savings APY estimate)
- LLM call (Claude SDK) wraps with reasoning prompt → returns suggested tip amount

## Security model

| Threat | Mitigation |
|---|---|
| Handle impersonation | Tier system caps unverified claims at 10 MUSD lifetime |
| Verifier key compromise | Verifier address swappable by owner; planned: rotate to ZK or DAO-multisig |
| Reentrancy | All state-modifying functions use ReentrancyGuard |
| Sender tx replay | tx-level deduplication via tx-hash storage in extension UI |
| Vault honeypot | Contract immutable, no admin upgrade, refund mechanism after TTL |
| Liquidation grief | Keeper bounty incentivizes timely liquidation, but threshold high (90%) so honest borrowers rarely affected |

## Why this stack (decisions log)

- **Plasmo over raw extension scaffolding** — `getInlineAnchorList` handles infinite scroll DOM injection automatically.
- **viem + wagmi** instead of ethers.js — better TypeScript inference, lighter bundle, Mezo Passport plays nice.
- **Next.js App Router** — server components for SEO, edge-friendly API routes for the verifier.
- **Solidity 0.8.28** with `evmVersion: london` — matches Mezo's recommended config in docs.
- **OpenZeppelin v5** — battle-tested, latest with custom errors and updated Ownable signature.
- **Separate contracts, not one monolith** — clean separation of concerns aids auditability.

## Network details

| | Testnet (matsnet) | Mainnet |
|---|---|---|
| Chain ID | 31611 | 31612 |
| RPC | `https://rpc.test.mezo.org` | `https://mainnet.mezo.public.validationcloud.io` |
| Explorer | `https://explorer.test.mezo.org` | `https://explorer.mezo.org` |
| Faucet | `https://faucet.test.mezo.org` | n/a |
| Gas token | BTC (18 decimals) | BTC (18 decimals) |
