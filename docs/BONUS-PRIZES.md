# Bonus prize integration plan

Nih is designed to claim **multiple bonus prizes in parallel**. Here's how each integration plugs in.

## 1. Goldsky — Data Indexing

**Status**: subgraph definition scaffolded under `/subgraph`.

**Integration points**:
- Index `Tipped` events from `NihRouter` → power public creator profile pages
- Index `LoanOpened` / `LoanRepaid` → power borrow analytics
- Index `Registered` → power handle leaderboards

**Deployment**:
```bash
cd subgraph
goldsky subgraph deploy nih/v1
```

**Hooks into dashboard**: `dashboard/src/lib/goldsky.ts` (TODO) queries the GraphQL endpoint for tip feeds.

## 2. Spectrum Nodes — Testnet RPC

**Status**: configured as failover RPC in `hardhat.config.ts` (`matsnetSpectrum` network).

**Integration points**:
- Primary RPC for production extension build via `SPECTRUM_RPC` env var
- Documented as failover in architecture diagram
- Used for higher rate limits than public `rpc.test.mezo.org`

**Signup**: `dashboard.spectrumnodes.com` → create endpoint for Mezo Testnet → drop URL into `.env`.

## 3. Validation Cloud — Mainnet RPC

**Status**: configured as `mezoMainnet` network in `hardhat.config.ts`.

**Integration points**:
- Primary mainnet RPC when Nih launches post-hackathon
- Free tier (10 req/s) covers MVP usage
- Public endpoint used until volume warrants API key

## 4. Boar Network — Blockchain MCP

**Status**: documented integration in `ARCHITECTURE.md` and `dashboard/src/lib/ai-suggest.ts` (TODO).

**Integration points**:
- AI tip-amount suggestion calls Boar MCP for context data (balance, tx history)
- No API key needed (Boar's MCP is keyless)
- Powered via Claude SDK tool calls

**Setup** (in `dashboard/`):
```bash
claude mcp add boar-blockchain-mcp-basic --transport http https://mcp.boar.network/basic
claude mcp add boar-blockchain-mcp-advanced --transport http https://mcp.boar.network/advanced
```

**Bonus**: also unlocks **doubled hackathon rate limits** on Boar's RPC for Mezo + Ethereum.

## 5. Tenderly — Multi-chain (future)

**Status**: deferred to post-hackathon (Tenderly doesn't natively support Mezo per docs).

**Future integration**:
- When Nih adds Ethereum/Base bridge entry points (so non-Mezo users can tip), use Tenderly for cross-chain simulation + monitoring
- Virtual TestNet of Ethereum side for QA

## Submission checklist

- [ ] Goldsky subgraph URL in submission form
- [ ] Spectrum endpoint URL documented in architecture
- [ ] Boar MCP usage in code (search for `// boar-mcp` markers)
- [ ] Validation Cloud noted in mainnet roadmap
- [ ] All five bonus prize forms filled (Encode dashboard)
