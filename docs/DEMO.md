# Demo guide — 3-minute video script

> Goal: show juri the full magic loop in under 180 seconds. Tip → claim → borrow.

## Scene 1 (0:00–0:25) — The hook

**[Screen: Twitter feed. Cursor scrolls past a tweet from @hajislamet]**

> "Tipping someone on Twitter today either means a Patreon link, or messing with Bitcoin Lightning, or just giving up. Nih makes it as simple as a like — but with Bitcoin-backed money."

**[Click the "Tip MUSD" button injected on the tweet]**
**[Modal opens: 1 / 5 / 10 / 25 MUSD presets]**
**[Click 5 MUSD → wallet popup → confirm]**
**[Toast appears: "Tip sent"]**

## Scene 2 (0:25–0:55) — The other side

**[Switch persona: now the creator. Open dashboard.nih.xyz]**

> "Meanwhile, the creator opens their Nih dashboard."

**[Dashboard shows: 5 MUSD just received, total lifetime tips = $147]**

> "They got 5 MUSD instantly. No conversion, no platform cut beyond a tiny 0.5% protocol fee. Stable money."

## Scene 3 (0:55–1:30) — The killer feature

**[Click "Borrow against your tips"]**

> "But here's where Nih stops being a tipping app and starts being a bank."

**[Borrow page. Creator inputs 100 MUSD collateral.]**
**[UI shows: "You receive 60 MUSD instantly at 1% APR fixed"]**
**[Click Borrow → wallet confirm → 60 MUSD lands in wallet]**

> "60 MUSD cash flow today. The other 40 MUSD stays as collateral, still earning. No BTC sold. No collateral liquidated. Future tips keep flowing in."

## Scene 4 (1:30–2:10) — The claim flow

**[Switch persona again: a creator who got tipped before they registered]**
**[Open dashboard.nih.xyz/claim → input "twitter" + "newcreator"]**

> "What if someone tips a creator who's not registered yet? The tips wait in an on-chain escrow vault."

**[UI shows: "Pending in vault: 23.5 MUSD"]**
**[Click "Verify handle" → signature flow → registered → "Claim 23.5 MUSD"]**

> "Verify ownership via signed challenge, then claim. Done."

## Scene 5 (2:10–2:50) — The composition

**[Show architecture diagram on screen]**

> "Nih touches all three Mezo primitives — MUSD for settlement, MEZO for fee discounts, Mezo Earn for idle yield. It's the only submission this hackathon that integrates all three."

**[Show partner stack: Goldsky for indexing, Spectrum for RPC, Boar MCP for AI suggestions]**

> "Indexed by Goldsky. RPC powered by Spectrum. AI tip suggestions through Boar's blockchain MCP."

## Scene 6 (2:50–3:00) — The close

**[Logo + tagline on screen]**

> "Nih. Tip MUSD anywhere on the web. Bitcoin-backed banking, one click at a time."

---

## Recording tips

- Use OBS Studio. 1080p, 30fps minimum.
- Two browser windows pre-arranged: sender (Twitter) + creator (dashboard).
- Pre-fund both wallets with matsnet BTC + mint mock MUSD.
- Practice run-through 3× before recording — pacing kills the flow.
- Background music: low-volume ambient, drop out during voice.
- Last 5 seconds: pure logo with tagline — sticky in juror's head.

## Backup demo URLs

- Live dashboard: `https://nih.vercel.app`
- Contract addresses: see `contracts/deployments/matsnet.json`
- Extension build: `extension/build/chrome-mv3-prod.zip` (load unpacked in dev)
