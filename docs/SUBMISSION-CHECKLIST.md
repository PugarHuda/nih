# Submission checklist

Run through this list before clicking "Submit" on the Encode Club dashboard.

## Status (auto-tracked)

| Item | Status |
|---|---|
| Smart contracts on matsnet (FULL_REAL — all real Mezo MUSD) | ✅ deployed `2026-05-23` |
| 29/29 contract tests passing | ✅ |
| Dashboard live on Vercel | ✅ https://nih-seven.vercel.app |
| GitHub repo public | ✅ https://github.com/PugarHuda/nih |
| Goldsky subgraph (nih/v4) indexing real-MUSD events | ✅ |
| Extension build (Chrome MV3) downloadable | ✅ https://nih-seven.vercel.app/install |
| Developer docs page | ✅ https://nih-seven.vercel.app/docs |
| Interactive onboarding tour | ✅ https://nih-seven.vercel.app/onboarding |
| All bonus partner integrations | ✅ Goldsky, Spectrum, Boar, OpenRouter, Tenderly, Validation Cloud |
| **Demo video (3 min)** | ⏳ TODO — script in `docs/DEMO.md` |
| **Encode form submitted + Mezo track selected** | ⏳ TODO — user task |
| **KYB documents uploaded** | ⏳ TODO — user task |

## Track selection on Encode form

- [x] **Supernormal dApps (MUSD)** — primary track
- Optional cross-submit:
  - [ ] **Bank on Bitcoin** — justify via NihCredit + NihTrove (Bitcoin-collateral MUSD lending)
  - [ ] **MEZO Utilization** — justify via MEZO fee discount on `tip(payFeeInMezo=true)`

## Bonus prize forms (separate from main submission)

- [x] **Goldsky** — `nih/v4` endpoint at `api.goldsky.com/.../subgraphs/nih/v4/gn`
- [x] **Spectrum Nodes** — 3 endpoints wired in `dashboard/src/lib/spectrum.ts` + `/api/spectrum-stats` live
- [x] **Boar Network** — Mezo mainnet RPC powering `/api/suggest` AI agent
- [x] **Validation Cloud** — documented as mainnet RPC + chain config in `lib/chain.ts`
- [x] **Tenderly** — simulator deep-link in every tx-toast
- [ ] Submit each bonus form on Encode dashboard with the URLs above

## Technical sanity (verified pre-submit)

- [x] `pnpm --filter contracts test` — 29/29 pass
- [x] `pnpm --filter dashboard build` — no TS errors, 16 routes
- [x] `pnpm --filter extension build` — `extension/build/chrome-mv3-prod/` ready
- [x] Tip flow end-to-end on matsnet — 8 real-MUSD tips seeded, indexed
- [x] Borrow → repay → close — verified via NihCredit (`/borrow` Active card)
- [x] Stream → withdraw → cancel — verified via NihStream
- [x] /unlock pay-to-access — receipt gated on actual tx receipt
- [x] Extension popup ↔ dashboard wallet bridge with nonce

## Security hardening

- [x] NihVault.setRouter onlyOwner (no mempool hijack)
- [x] NihRegistry signature replay guard (usedSignatures mapping)
- [x] Verifier ownership anchor (URL/canonical match required, not just substring)
- [x] ExtensionBridge nonce + explicit consent (no third-party iframe leak)
- [x] tx-toast waits for receipt (no "Confirmed" on broadcast-then-revert)

## Demo video preflight

- [ ] OBS at 1080p 30fps, hardware encoder
- [ ] Browser windows pre-arranged (tipper left, creator right)
- [ ] Wallets pre-funded with matsnet BTC (faucet.test.mezo.org) + real MUSD via Mezo trove
- [ ] Extension loaded via `chrome://extensions → Load unpacked → extension/build/chrome-mv3-prod`
- [ ] Background music drops during voiceover
- [ ] Subtitles burned in
- [ ] Final 5 seconds = logo + tagline + GitHub URL

## Post-submission

- [ ] Tweet thread tagging `@MezoNetwork` + `@EncodeClub`
- [ ] Discord post in `#general` + `#team-formation`
- [ ] Snapshot `contracts/deployments/matsnet.json` to a gist for record
