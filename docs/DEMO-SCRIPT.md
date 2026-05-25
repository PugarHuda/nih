# Nih — Pitch & Live Demo Script

Everything you need to record the submission video and present the deck.
Two self-contained scripts (use either, or stitch them): a **pitch-deck
voiceover** (~3 min, slide by slide) and a **live product demo** (~3 min,
click by click). All numbers below match what's live; read them off-screen.

- **Live app:** https://nih-seven.vercel.app
- **Deck:** https://nih-seven.vercel.app/slides (←/→ or Space, `?n=N` to jump)
- **Repo:** https://github.com/PugarHuda/nih
- **Track:** Supernormal dApps — MUSD
- **Demo wallet:** `0xdbE1…9e09` (holds ~1,300 real MUSD, owns the demo handles incl. `@BangDropID`)

---

## Pre-flight checklist (do this before hitting record)

1. Wallet (MetaMask/Xverse) on **Mezo matsnet (31611)**, connected once on the dashboard so it's warm.
2. Have ~50+ MUSD and a little test BTC for gas (`/faucet` → open a Mezo trove; BTC from faucet.test.mezo.org).
3. Open tabs in order: a real tweet (e.g. `x.com/BangDropID`), `nih-seven.vercel.app/dashboard`, `/slides`.
4. Extension installed + pinned (see `/install`); popup connected via "Connect via dashboard".
5. Do one warm-up tip so the subgraph already shows activity (no empty states on camera).
6. Screen at 1280×720+; hide bookmarks bar; close noisy extensions.

---

## SCRIPT A — Pitch deck voiceover (~3:00)

> Open `/slides`. ~30s per slide. Speak the **bold** line first, then the supporting beat.

### Slide 1 · The problem (0:00–0:30)
> "**Tipping a creator in Bitcoin today is painful.** BTC is volatile, fees
> eat small amounts, and you have to know someone's wallet address. So the
> most natural thing on the social web — handing someone a few bucks for a
> great post — basically doesn't happen on-chain."

### Slide 2 · The solution (0:30–1:00)
> "**Nih lets you tip MUSD — Bitcoin-backed, stable — anywhere on the web.**
> A browser extension drops a tip button on Twitter, YouTube, GitHub, and
> LinkedIn. You tip a *username*, not a hex address. If the creator hasn't
> joined yet, the tip parks safely in a vault until they claim it. And it's
> not just tips: creators can borrow against their tip income without ever
> selling their Bitcoin."

### Slide 3 · Demo / live data (1:00–1:30)
> "**This is live on Mezo matsnet right now, with real data.**" (point at the
> numbers) "These tip counts and volumes are pulled live from our Goldsky
> subgraph — every number on this slide is a real on-chain event, not a
> mockup. I'll show the actual flow in a second."

### Slide 4 · Tech (1:30–2:05)
> "**It's built on real Mezo primitives.** Seven Nih contracts, all wired to
> Mezo's real MUSD token — no mock on the money path. We wrap Mezo's
> StabilityPool, BorrowerOperations, and TroveManager directly. 34 of 34
> tests green. Plus an AI tip-amount suggestion powered by Claude, reading
> on-chain reputation through Boar's RPC."

### Slide 5 · Market & economics (2:05–2:35)
> "**The model is a thin take on real volume.** A 0.5% protocol fee — or
> 0.25% if you pay in MEZO. At ten thousand active tippers that's already
> recurring revenue, and the borrow flow adds 1% APR on locked tips as a
> parallel line. Unit economics scale linearly with users."

### Slide 6 · Closing (2:35–3:00)
> "**Bitcoin, spendable. Creators, bankable.** Nih is a complete, shipped
> answer to the MUSD brief — live dApp, browser extension, subgraph, real
> contracts. 'Nih' is Indonesian for 'here you go' — the casual hand-off,
> made on-chain. Try it at nih-seven.vercel.app."

---

## SCRIPT B — Live product demo (~3:00)

> Screen recording. Each step: **[ACTION]** what you click, then the line you say.

### 0:00 — Hook on a real tweet
- **[ACTION]** Show a tweet on `x.com/BangDropID` with the Nih floating button + the per-tweet "✦ Tip MUSD" pill visible.
- "Here's a normal tweet. Nih's extension adds a tip button right where I'm already reading."

### 0:15 — Tip from the page
- **[ACTION]** Click the per-tweet "✦ Tip MUSD" pill. A new tab opens at `/tip` prefilled with the handle + amount.
- "I click tip — it opens Nih prefilled with @BangDropID. Notice **Claude suggests** an amount, reading their on-chain reputation through Boar's RPC."
- **[ACTION]** Point at the "Pay fee in MEZO" toggle. "I can pay the fee in MEZO so the creator keeps 100% of my MUSD."
- **[ACTION]** Click **Send** → approve (if first time) → wait for the receipt-gated success screen.
- "It waits for the actual transaction receipt — then bounces me back to the tweet I came from."

### 0:55 — It landed (dashboard)
- **[ACTION]** Switch to `/dashboard`. Point at the **rotating tip banner** + the **tip activity** card.
- "Within ~15 seconds the Goldsky subgraph indexes it, and it shows up here — live. The tipper resolves to a real handle, not just an address."
- **[ACTION]** Click the **You** tab on the activity card; point at the **Supporter tier** badge.
- "And because I tip, I earn a Supporter tier — recognition that compounds with how much I've sent."

### 1:30 — Claim a handle (the trust primitive)
- **[ACTION]** Go to `/claim`. Platform: twitter, username: `BangDropID`. Paste a tweet URL containing the challenge.
- "Ownership is proven cryptographically — I post a wallet-bound challenge from the account, and our verifier checks it. Once verified, tips route straight to my wallet instead of the vault."

### 2:00 — Subscribe (streaming) + borrow
- **[ACTION]** Go to `/stream`. Recipient mode **By handle** → twitter → type a creator → preview resolves the avatar + wallet → pick a monthly amount.
- "Subscriptions stream MUSD per second. Cancel anytime and the unspent part refunds — no prepaid month lost."
- **[ACTION]** Go to `/borrow`. Show the NihCredit panel.
- "And the killer feature: lock your earned MUSD as collateral and draw a credit line at 1% APR, up to 60% LTV — spend today, never sell your Bitcoin."

### 2:40 — Proof it's real
- **[ACTION]** Open `/leaderboard` (Top recipients + Top supporters) and optionally `/api/health`.
- "Everything you saw is on real Mezo MUSD — leaderboard, supporter tiers, every tip is a real on-chain transaction. That's Nih."

---

## Timing cheat-sheet

| Segment | A (deck) | B (live) |
|---|---|---|
| Problem / hook | 0:30 | 0:15 |
| Solution / tip flow | 0:30 | 0:40 |
| Live proof | 0:30 | 0:35 |
| Claim / trust | — | 0:30 |
| Subscribe + borrow | 0:35 | 0:40 |
| Close | 0:25 | 0:20 |

## If something breaks on camera (fallbacks)
- **Extension button missing on a tweet** (Twitter A/B-tests its DOM): use the floating bottom-right button, or go straight to `/tip?platform=twitter&username=BangDropID&amount=5`.
- **RPC blip on a write**: tx-toast retries via fallback transports; if a tip stalls, the dashboard + `/leaderboard` still show prior real tips.
- **AI suggest shows "Heuristic"**: that's the honest offline fallback — still a real suggestion; don't claim Claude if the badge says heuristic.
- **Empty states**: do the warm-up tip from the checklist first.

## One-liners (for the written submission)
- "Tip MUSD anywhere on the web — Bitcoin-backed, self-custodial, one click."
- "Tip a username, not a wallet. Borrow against your tips, never sell your Bitcoin."
- "Live on Mezo matsnet: 7 real contracts, real MUSD end-to-end, 34/34 tests."
