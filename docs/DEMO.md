# Demo guide — 3-minute video script

> One goal: walk the judges through the whole magic loop in under 180 seconds.
> Tip → claim → borrow against income → composition wins.

## Cast

- **Sender persona** (Alice) — random tipper. MetaMask installed, has matsnet BTC + 100 MUSD from the faucet.
- **Creator persona** (Bob) — Twitter user @hajislamet. Already manually registered to the deployer wallet by the `register-handles.ts` script (so tips land straight in his wallet, not the vault).
- **Unregistered persona** (Carol) — Twitter user @newcreator. We'll tip her too — funds park in the vault, then she claims via the verification flow.

## Stage setup (do this BEFORE recording)

1. OBS Studio, 1080p 30fps, hardware encoder.
2. Two browser windows side-by-side.
   - Window A (Sender / Alice): `https://twitter.com/hajislamet` (or any tweet you control).
   - Window B (Creator / Bob): `https://nih-seven.vercel.app/dashboard`.
3. Both windows: MetaMask installed, signed into the same wallet (yours), already on Mezo matsnet.
4. Hit `/faucet` from the dashboard to mint 100 MUSD + 100 MEZO.
5. Hit `https://faucet.test.mezo.org` to top up BTC for gas (~0.01 BTC is plenty).
6. Pre-warm the extension: load unpacked from `extension/build/chrome-mv3-prod/`. Verify the "N Tip MUSD" button appears under tweets.

## Scene 1 — The hook (0:00 – 0:25)

**On screen:** Window A, Twitter feed scrolling.

**Voiceover:**
> "Tipping someone on Twitter today means a Patreon link, a custodial Lightning wallet, or just giving up. Nih makes it as simple as a like — but the money you're sending is backed by Bitcoin."

**Action:**
- Hover over a tweet from @hajislamet — the "N Tip MUSD" button is already injected.
- Click it. Popover slides in. Pick 5 MUSD. MetaMask prompts. Confirm.
- Toast: "Tip sent."

## Scene 2 — The creator side (0:25 – 0:55)

**On screen:** Switch to Window B (`/dashboard`).

**Voiceover:**
> "Meanwhile, the creator opens Nih. The 5 MUSD already landed — no platform cut, no conversion, no waiting period. Stable money, settled in three seconds."

**Action:**
- Dashboard already shows new balance: `5 MUSD`. `Lifetime tips received` ticks up to whatever total you have.
- Pan to the action grid: highlight the "Borrow against your tips" card.

## Scene 3 — The killer feature (0:55 – 1:30)

**On screen:** Click into `/borrow`.

**Voiceover:**
> "Here's where Nih stops being a tipping app and becomes a bank. Creators borrow against their accumulated tips — without selling any Bitcoin."

**Action:**
- Type `50` MUSD as collateral.
- UI shows: `You receive 30 MUSD` at `1% APR fixed`.
- Click `Approve MUSD` → MetaMask confirm.
- Click `Borrow 30 MUSD` → confirm. Toast: "Borrowed 30 MUSD".
- Highlight the dashboard: 30 MUSD in wallet, 50 MUSD locked. Income literally turned into cash flow.

## Scene 4 — The claim flow (1:30 – 2:10)

**On screen:** Open `/claim` in a fresh tab.

**Voiceover:**
> "What about someone who got tipped before they registered? Tips park in an on-chain vault. To claim them, prove you own the handle — by posting the challenge text on your public profile."

**Action:**
- Select `github`, type `PugarHuda` (or use a fresh handle).
- The page shows: `Verifying my Nih wallet 0xdbe1...e09`. Copy.
- Cut to a GitHub README in a tab — paste it in, commit.
- Back to Nih. Click `Verify handle`. Server fetches the public README, finds the text, signs Tier 1 attestation. Toast: "Handle verified!"
- Vault balance is now claimable. Click `Claim X MUSD` → MetaMask → done.

## Scene 5 — Composition + partners (2:10 – 2:50)

**On screen:** `/leaderboard` page (Goldsky-powered).

**Voiceover:**
> "Nih is the only hackathon submission that touches all three Mezo primitives in one product. MUSD as settlement currency. MEZO as the optional fee discount. Mezo-Earn-compatible savings, with credit-line collateral built on top. Indexed live by Goldsky. Multi-RPC backed by Spectrum and Validation Cloud. AI tip suggestions through Boar Network's blockchain MCP."

**Action:**
- Show the leaderboard auto-updating with the tips we just sent.
- Quick cut to architecture diagram (one beat).

## Scene 6 — The close (2:50 – 3:00)

**On screen:** Logo on dark background, tagline below.

**Voiceover:**
> "Nih. Tip MUSD anywhere on the web. Bitcoin-backed banking, one click at a time."

---

## Pre-flight checklist

- [ ] Extension loaded into Chrome, pinned, popup opens
- [ ] Dashboard reachable at `https://nih-seven.vercel.app`
- [ ] Wallet on matsnet, balances visible: BTC > 0.01, MUSD > 100, MEZO > 100
- [ ] At least one tip already sent so the leaderboard isn't empty
- [ ] @hajislamet (and your own GitHub) pre-registered via `register-handles.ts`
- [ ] Demo recording: practice three times for timing before you hit record
- [ ] Background music chosen, fades out during voiceover
- [ ] Subtitles ready (some judges watch without audio)
- [ ] Last 5 seconds = logo + tagline only — that's the sticky frame

## Backup links to put in the submission form

- Live dashboard: `https://nih-seven.vercel.app`
- Install extension: `https://nih-seven.vercel.app/install`
- GitHub repo: `https://github.com/PugarHuda/nih`
- GitHub release (extension zip): `https://github.com/PugarHuda/nih/releases/tag/v0.1.0`
- Goldsky subgraph endpoint: `https://api.goldsky.com/api/public/project_cmo5pukv64upu01y48tefank9/subgraphs/nih/v1/gn`
- Deployed contract addresses: see `contracts/deployments/matsnet.json` and the README table

## Common demo gotchas (and the fix)

| Symptom | Cause | Fix |
|---|---|---|
| MetaMask still on Ethereum mainnet | Chain not switched | The chain banner / Connect button auto-prompts — accept it |
| `Tip too small` revert | Below 0.5 MUSD minimum | Bump to ≥ 1 MUSD |
| Approve loops forever | First approve transaction got dropped (low gas) | Refresh page, try again |
| Tip looks "stuck" | RPC node lagging | Hard refresh — wagmi fallback transport rotates through Spectrum / Mezo public automatically |
| Subgraph leaderboard empty | Goldsky still indexing your fresh tip | Wait 10–30 seconds, refresh — it catches up |
