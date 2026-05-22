# Submission checklist

Run through this list before clicking "Submit" on the Encode Club dashboard.

## Mandatory (required for eligibility)

- [ ] Smart contracts deployed to Mezo matsnet
- [ ] Contract addresses listed in `README.md` and `contracts/deployments/matsnet.json`
- [ ] Frontend live on Vercel (paste URL in submission form)
- [ ] GitHub repo public (or invite Encode/Mezo judges)
- [ ] Demo video uploaded (3 min, YouTube/Loom)
- [ ] Project description in submission form mirrors `docs/PITCH.md`

## Track selection

- [ ] **Supernormal dApps (MUSD)** — primary track
- Optional cross-submit:
  - [ ] **Bank on Bitcoin** (justify via Credit Line feature)
  - [ ] **MEZO Utilization** (justify via MEZO fee discount)

## Bonus prizes

- [ ] **Goldsky** subgraph URL submitted (see `subgraph/`)
- [ ] **Spectrum Nodes** RPC integration documented in `ARCHITECTURE.md`
- [ ] **Boar Network** MCP integration noted (used for AI tip suggestions)
- [ ] **Validation Cloud** noted as mainnet RPC provider (roadmap)
- [ ] All bonus prize forms filled (separate from main submission)

## Technical sanity

- [ ] `pnpm --filter contracts test` passes (5 tests minimum)
- [ ] `pnpm --filter dashboard build` succeeds (no TS errors)
- [ ] `pnpm --filter extension build` succeeds
- [ ] Tip flow end-to-end works on matsnet (verified manually)
- [ ] Claim flow end-to-end works on matsnet (verified manually)
- [ ] Borrow → Repay loop works (verified manually)

## Polish

- [ ] Landing page works on mobile + desktop
- [ ] Twitter Open Graph card renders correctly (preview with `https://cards-dev.twitter.com/validator`)
- [ ] Dashboard handles empty states gracefully (new wallet, no tips, no loan)
- [ ] Error messages are human-readable (no `0x4e487b71...` panic codes)
- [ ] Toasts use the brand color, not default sonner styling
- [ ] `npm test` exits 0

## Demo video preflight

- [ ] OBS configured at 1080p 30fps
- [ ] Browser windows pre-arranged (sender on left, creator on right)
- [ ] Wallets pre-funded with matsnet BTC + mock MUSD
- [ ] Background music chosen, drops out during voiceover
- [ ] Subtitles burned in (juri may watch without audio)
- [ ] Final 5 seconds = pure logo + tagline

## Post-submission

- [ ] Tweet thread announcing submission tagging `@MezoNetwork` and `@EncodeClub`
- [ ] Discord post in `#team-formation` and `#general`
- [ ] Save snapshot of `contracts/deployments/matsnet.json` to a gist as backup
