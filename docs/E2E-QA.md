# End-to-end QA report — May 22, 2026

Final round of testing on the live deployment after the v0.3.0 release.

## Smoke tests (all green)

| Endpoint | Status | Latency | Notes |
|---|---|---|---|
| `/` (landing) | 200 | 1.0s | Hero + activity feed + CTAs |
| `/install` | 200 | 0.65s | Interactive 4-step walkthrough |
| `/dashboard` | 200 | 0.66s | Creator stats + action grid |
| `/borrow` | 200 | 0.90s | Open/repay flow |
| `/claim` | 200 | 0.65s | Challenge text + tier 1 verifier |
| `/faucet` | 200 | 0.89s | MUSD/MEZO mint |
| `/leaderboard` | 200 | 0.68s | Goldsky-powered |
| `/privacy` | 200 | 0.62s | Web Store requirement |
| `/c/twitter/hajislamet` | 200 | 1.4s | SSR with on-chain reads |
| `/api/health` | 200 | 0.80s | Latest block + contract map |
| `/api/og?platform=twitter&username=hajislamet` | 200 | 1.4s | Dynamic 1200×630 PNG |
| `/api/suggest` (POST) | 200 | — | Heuristic fallback (Claude not configured) |

## Manual transaction tests (matsnet)

Performed via MetaMask connected to https://nih-seven.vercel.app:

| Flow | Result | Tx hash |
|---|---|---|
| Mint 100 MUSD via /faucet | ✅ | confirmed on explorer.test.mezo.org |
| Approve router | ✅ | one-time, max allowance |
| Tip 5 MUSD to twitter/hajislamet (registered) | ✅ | landed instantly in wallet — totalReceived counter ticked |
| Tip 5 MUSD to twitter/unregistered_user | ✅ | parked in vault, pendingFor returned correct amount |
| Borrow against 50 MUSD collateral | ✅ | received 30 MUSD (60% LTV) |
| Repay loan | ✅ | collateral fully returned, drift < 0.01% |

## Goldsky subgraph indexing

| Query | Result |
|---|---|
| `accounts(orderBy: totalReceived)` | Returns hajislamet wallet at top, populated |
| `tips(orderBy: timestamp)` | Returns the 5 manual tips above, sender + recipient resolved |

Subgraph indexed every tip transaction within ~12s of confirmation — well within the 15s poll interval the activity feed uses.

## Chain enforcement

| Scenario | Behavior |
|---|---|
| Wallet on Ethereum mainnet, hit /tip | Connect button shows "Wrong network", auto-prompts MetaMask switch |
| Mezo chain unknown to wallet | `wallet_addEthereumChain` fires, adds matsnet, then auto-switches |
| User rejects switch | `<ChainGuard>` red banner persists, all write buttons gated by `ensure()` |

## Extension (v0.3.0)

| Surface | Result |
|---|---|
| Popup connect → MetaMask | ✅ auto-switches to matsnet |
| Tip button on tweet | ✅ injected via stable `[data-testid=tweet]` |
| Tip button on YouTube channel | ✅ injected under channel header |
| Tip button on Substack post | ✅ injected after `.subscribe-area` |
| Tip button on Medium article footer | ✅ injected in article footer |
| Tip button on GitHub profile | ✅ injected after `.vcard-names-container` |
| Tip button on Reddit (new) | ✅ injected per-post via `shreddit-post[author]` |
| Tip button on Reddit (old) | ✅ injected next to `.tagline .author` |
| Tip button on Hacker News | ✅ injected after each `a.hnuser` |

## Identity verification

Tested handle proof flow for three platforms:

| Platform | Verification | Result |
|---|---|---|
| GitHub `PugarHuda` | Add challenge to profile README at github.com/PugarHuda/PugarHuda | Pre-registered as Tier 3 Manual — instant pass |
| Twitter `hajislamet` | Post tweet with challenge text | Pre-registered as Tier 3 Manual — instant pass |
| Twitter `fresh_handle` (not pre-registered) | Did not post challenge | `/api/verify` returned 403 with helpful reason text. Posted challenge, retried — passed Tier 1 |

## Rate limits

Verified rate-limit middleware fires:

| Endpoint | Limit | Behavior at limit |
|---|---|---|
| `/api/verify` | 10 / min / IP | 11th request returns 429 with `retry-after` header |
| `/api/suggest` | 30 / min / IP | 31st request returns 429 |

## Known issues & risk assessment

| Issue | Severity | Mitigation |
|---|---|---|
| Heuristic-only AI suggest in production | Low | Optional feature; works without Claude key, returns deterministic recommendation |
| Twitter syndication API caches profile for ~60s | Low | Verifier handles delay — surfaced in error UI |
| Extension review pending on Chrome Web Store | Medium | Install page provides 60-second sideload walkthrough |
| `@metamask/sdk` warning about missing `@react-native-async-storage/async-storage` at build | Cosmetic | Only used by RN bundles; web build ignores it; warning is non-blocking |

## Decisions log

- **React 18 → 19**: Pinned across the monorepo via pnpm overrides after duplicate-React issue caused `useContext` null in Next.js prerender.
- **transpilePackages**: Several Mezo Org packages ship raw TypeScript that webpack can't parse without Next's SWC pass. Listed all six in `next.config.mjs`.
- **Dynamic Providers with ssr:false**: RainbowKit + Mezo Passport touch `window` on import. Server-render of /404 and /500 was failing. Wrapping the provider stack in `next/dynamic(..., { ssr: false })` made all routes build.
- **No custom error.tsx / global-error.tsx**: Removed them after they caused the same prerender issue. Next.js defaults are good enough for now.

## Sign-off

All core flows green. Production deployment matches the spec. Ready for hackathon submission.
