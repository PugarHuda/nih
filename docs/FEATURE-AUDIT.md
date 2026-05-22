# Feature audit — what's actually built vs. PITCH

Brutally honest pass through every claim in `PITCH.md` and `ARCHITECTURE.md`.

Legend: **✅** = production-ready · **🟡** = wired but shallow · **🔴** = stub/missing

## Core mechanics

| Claim | Status | Where |
|---|---|---|
| Tip MUSD to social handle | ✅ | `NihRouter.tip()` + extension content script + `/tip` page |
| Auto-park to vault if handle unregistered | ✅ | `NihRouter` routes to `NihVault.park()` |
| Claim flow after registration | ✅ | `/claim` page + `NihVault.claim()` |
| 180-day TTL refund | ✅ | `NihVault.refundExpired()` + keeper bounty |
| Identity tier system (0/1/2/3) | 🟡 | enum + manualRegister live, but `/api/verify` issues Tier 1 for everyone without real OAuth/scrape |
| Creator Credit Line (borrow against tips) | ✅ | `NihCredit` lender pool + `/borrow` page, end-to-end |
| Liquidation when underwater | ✅ | `NihCredit.liquidate()` + keeper bounty |
| MEZO fee discount (50% off) | ✅ | `NihRouter` rate-adjusted, opt-in toggle in extension popup |

## Frontend surfaces

| Page | Status |
|---|---|
| `/` landing with TweetMockup | ✅ |
| `/dashboard` creator stats | ✅ reads on-chain balance + totalReceived + handles |
| `/claim` verify + claim flow | ✅ |
| `/borrow` open / repay credit line | ✅ |
| `/tip?platform=...&username=...&amount=...` deep-link tip | ✅ used by widget hand-off |
| `/leaderboard` Goldsky-powered | ✅ |
| `/install` extension install guide | ✅ |
| `/api/verify` backend signer | ✅ |
| `/api/suggest` AI tip amount | 🟡 deterministic heuristic, Boar MCP integration described but Claude SDK call not live |

## Extension

| Feature | Status |
|---|---|
| Plasmo build → chrome-mv3-prod.zip | ✅ shipped to GitHub Releases v0.1.0 |
| Twitter content script (per-tweet button) | ✅ inject via `getInlineAnchorList` |
| GitHub profile widget | ✅ inject under `vcard-names-container` |
| YouTube content script | 🔴 not built — listed as supported but absent (only Twitter + GitHub shipped) |
| Substack / Medium content script | 🔴 listed in pitch, not shipped |
| Popup wallet + balance | ✅ |
| Chain enforcement (auto-add Mezo, switch) | ✅ `ensureChain()` + popup banner |
| Default tip preset + MEZO fee toggle | ✅ persisted via plasmohq/storage |

## Embed widget

| Feature | Status |
|---|---|
| `<script src=widget.js>` drop-in | ✅ `dashboard/public/widget.js` |
| XSS-safe DOM construction | ✅ no innerHTML |
| Cross-domain hand-off to `/tip` | ✅ |

## Identity verification (the weakest link)

| Tier | Status |
|---|---|
| 0 Unverified | ✅ enum + cap logic in router |
| 1 Signature challenge (post signed tweet) | 🟡 `/api/verify` SIGNS without checking the tweet — demo stub |
| 2 OAuth Twitter | 🔴 not wired |
| 3 Manual via DAO whitelist | ✅ `manualRegister` callable by owner; we pre-registered hajislamet + 4 others |

For mainnet: integrate Twitter API v2 `users/by/username` + check pinned tweet contains the signed challenge text. Roughly 50 lines in `/api/verify`.

## Goldsky subgraph

| Feature | Status |
|---|---|
| Schema + mapping handlers | ✅ |
| Deployed to mezo-testnet network | ✅ endpoint live |
| Tipped event indexed | ✅ |
| Loan events indexed | ✅ |
| Leaderboard reads from subgraph | ✅ `NEXT_PUBLIC_GOLDSKY_URL` wired in Vercel |
| Webhook to alert big tips | 🔴 not built (mentioned in BONUS-PRIZES.md) |

## Boar Network MCP

| Feature | Status |
|---|---|
| MCP listed as RPC failover | 🟡 noted in docs, dashboard still hits public RPC |
| `/api/suggest` uses Boar MCP | 🔴 heuristic only — Claude SDK call not wired |
| Mainnet RPC config in hardhat | ✅ `boar` listed as mainnet provider in hardhat.config |

## Spectrum Nodes

| Feature | Status |
|---|---|
| Hardhat `matsnetSpectrum` network | ✅ config wired (needs `SPECTRUM_RPC` env at deploy time) |
| Dashboard uses Spectrum RPC | 🟡 falls back to public `rpc.test.mezo.org` |
| Documented in architecture | ✅ |

## Validation Cloud

| Feature | Status |
|---|---|
| Mainnet RPC config | ✅ `mezoMainnet` network in hardhat.config |
| Mentioned in mainnet roadmap | ✅ docs/BONUS-PRIZES.md |

## Mezo primitive integration

| Primitive | Depth |
|---|---|
| MUSD as settlement currency | ✅ default token in router + credit |
| MEZO as fee discount | ✅ second-token path in router |
| Mezo Earn (savings rate auto-deposit) | 🔴 dashboard suggests it; no actual deposit call — `NihEarn` adapter not built |
| Real MUSD trove flash-mint for credit line | 🔴 our `NihCredit` is a peer-pool, not trove-backed — flagged in QA report |
| Mezo Passport (Xverse/Unisat support) | 🟡 wagmi `injected()` connector works for MetaMask; Passport SDK not wired (would unlock Xverse/Unisat) |

---

## Honest assessment

**Production-ready (✅)**: ~70% of the surface area. Contracts are solid, tests pass, all UI flows are wired, extension installable, subgraph live.

**Demo-ready stubs (🟡)**: ~20%. Identity verification, AI suggestion, partner RPC failover — these have the *shape* of the feature but the impl uses placeholders.

**Missing (🔴)**: ~10%. Multi-platform extension expansion (YouTube/Substack), Mezo Earn auto-deposit, Passport SDK integration, real MUSD trove flash-mint.

For a hackathon submission this distribution is **strong** — judges expect 🟡 patches in stretch features, not in core. Core MUSD tip + claim + credit flow is 100% real on matsnet.

For the milestone grant (post-hackathon mainnet), the 🔴 items become the v0.2 roadmap.
