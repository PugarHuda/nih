# Demo guide — 3-minute video script

> One goal: walk the judges through the magic loop in under 180 seconds.
> Tip → subscribe → borrow against income → real Mezo Stability Pool yield.

## Cast

- **Sender persona** (Alice) — random tipper. MetaMask installed, has matsnet BTC + a few real Mezo MUSD (open a small trove if empty).
- **Creator persona** (Bob) — Twitter user @hajislamet. Already registered to the deployer wallet via `seed-tips.ts`, so tips land straight in his wallet.

## Stage setup (before recording)

1. OBS Studio, 1080p 30fps, hardware encoder.
2. Two browser windows side-by-side.
   - Window A (Sender / Alice): `https://twitter.com/hajislamet` or any tweet you control.
   - Window B (Creator / Bob): `https://nih-seven.vercel.app/dashboard`.
3. Both windows: extension loaded from `extension/build/chrome-mv3-prod/` via `chrome://extensions → Load unpacked`.
4. Pre-fund: `https://faucet.test.mezo.org` for BTC gas (~0.01 BTC).
5. Pre-fund real MUSD via Mezo trove at `https://app.test.mezo.org` (link is in `/faucet`).
6. Confirm `https://nih-seven.vercel.app/api/health` returns the FULL_REAL addresses (MUSD = `0xf9BB…0af`).

## Scene 1 — The hook (0:00 – 0:25)

**On screen:** Window A, Twitter feed scrolling.

**Voiceover:**
> "Tipping someone on Twitter today means a Patreon link, a custodial Lightning wallet, or just giving up. Nih makes it as simple as a like — but the money you're sending is real Bitcoin-backed MUSD on Mezo, end to end."

**Action:** scroll past @hajislamet's tweet. The "N · Tip MUSD" button is visible under each post.

## Scene 2 — Tip flow (0:25 – 1:00)

**Voiceover:**
> "One click — pick an amount, confirm in your wallet — and MUSD lands in Bob's wallet. No Patreon middle-layer. No selling Bitcoin."

**Action:**
1. Click "Tip MUSD 5" under @hajislamet's tweet.
2. Wallet pops up — confirm approve (first time only).
3. Wallet pops up — confirm tip tx. Toast shows "Sent — waiting for confirmation…" then flips to green "Tipped 5 MUSD" with an explorer link.
4. Switch to Window B (Bob's dashboard). The live banner shows the tip arriving within ~15s of indexing.

## Scene 3 — Subscribe (1:00 – 1:25)

**Voiceover:**
> "Patreon-style subscriptions, on Bitcoin rails. Five MUSD a month, streamed by the second. Cancel any time — the unaccrued portion refunds instantly."

**Action:**
1. From Bob's profile page (`/c/twitter/hajislamet`) click "5 MUSD / mo".
2. Lands on `/stream` with the form pre-filled.
3. Submit. Show the live "Outgoing" row updating per-second.

## Scene 4 — Borrow against tips (1:25 – 2:00)

**Voiceover:**
> "Bob's earned a couple hundred MUSD. He needs cash today, but he doesn't want to sell his Bitcoin tomorrow. Click open credit line."

**Action:**
1. `/borrow` page — paste 100 MUSD collateral.
2. Confirm approve + open.
3. Toast confirms. The "Active credit line" card appears with Collateral / Principal / Interest accrued / Total owed boxes + LTV bar.
4. Click "Repay 60 MUSD & close" — full repay shows the collateral release.

## Scene 5 — Compose + unlock (2:00 – 2:30)

**Voiceover:**
> "Bob can park his idle MUSD into Mezo's real Stability Pool through Nih and earn BTC from liquidations. Same MUSD also unlocks paywalled content. Same primitive, three uses."

**Action:**
1. `/earn` — show the "powered by real Mezo StabilityPool" header + deposit.
2. `/unlock` — pay 5 MUSD to reveal a gated essay. Tx broadcast → toast waits for receipt → content reveals.

## Scene 6 — Close (2:30 – 3:00)

**Voiceover:**
> "Bitcoin in. Stablecoin out. Income that doubles as a credit line. Built on real Mezo MUSD, real BorrowerOperations, real Stability Pool. Nih makes Bitcoin spendable, and creators bankable. Tip MUSD anywhere on the web."

**On screen:** Logo + tagline + URL + GitHub.

## Backup B-roll

- `/dashboard` — TipDropBanner rotating real seeded tips, ActivityHeatmap filling in.
- `/leaderboard` — top recipient handles from real subgraph data.
- `/docs` — developer reference page (proof there's a real API).
- `/api/health` — quick curl in a terminal showing the FULL_REAL addresses.
- `/api/spectrum-stats` — partner integration end-to-end.
- `/onboarding` — start the interactive product tour.

## Common gotchas

- **"You hold 0 MUSD"** on `/earn` or `/borrow` — that's real MUSD now. Open a trove via `/faucet → Open Mezo trove`. Mock MUSD is no longer the tip token.
- **Browser extension popup says "Waiting for dashboard…"** — that's the secure flow. Connect on the dashboard tab, click the green "Send to extension" banner.
- **Mobile**: hamburger menu top-right.
