# Nih — Pitch one-pager

## The 30-second pitch

> Bitcoin is the best money the world has ever invented, but you can't tip your favorite YouTube creator with it without first selling, then dealing with a custodian, then crossing your fingers it arrives. **Nih makes it as easy as a like.** A browser extension injects a tip button on Twitter, YouTube, GitHub, and LinkedIn. One click sends MUSD — Mezo's real Bitcoin-backed stablecoin — to the creator's wallet. And here's the magic: those creators can borrow against their accumulated tips without ever selling their Bitcoin exposure. Built on Mezo, powered by MUSD and MEZO. Tipping meets self-service banking.

## The problem

| Existing tipping | Why it fails |
|---|---|
| **Patreon, Ko-fi** | 5–10% fee. Custodial. Platform-locked. Slow payouts. |
| **Tippin.me (BTC Lightning)** | Volatile BTC. Twitter only. Lightning UX is brutal. |
| **X native Bitcoin tip** | Same as above. Lightning channel headache. |
| **Brave BAT** | Niche browser. Closed ecosystem. |

**The gap**: no tipping tool gives creators stable, Bitcoin-backed money across every platform with self-custody — and none of them turn that income into composable financial primitives.

## The solution

**Nih = browser extension + on-chain registry + escrow vault + credit line + per-second streams + pay-to-unlock content + Mezo Stability-Pool yield, all settling in real Mezo MUSD.**

1. **Browser extension** injects a "Tip MUSD" button on every social profile (Twitter, YouTube, GitHub, LinkedIn — 4 platforms, all with on-chain verifier support).
2. **On-chain registry** maps social handle → Mezo wallet via tiered verification (Tier 1 challenge-text + URL/canonical anchor; Tier 2 OAuth planned; Tier 3 DAO whitelist).
3. **Escrow vault** parks tips for unregistered handles for up to 180 days; auto-refunds if unclaimed.
4. **Credit line (NihCredit)** lets creators borrow up to 60% LTV at 1% APR fixed against accumulated tips — without selling.
5. **Per-second subscriptions (NihStream)** — Patreon-style monthly preset buttons that escrow MUSD and stream accrual to the creator by the second.
6. **Pay-to-unlock (/unlock)** — MUSD-gated content reveal; the on-chain `Tipped` event is the receipt, gated on actual transaction receipt (no spoof).
7. **Real Mezo yield (NihEarn)** — deposit real MUSD into Mezo's actual StabilityPool through Nih and earn BTC from liquidations + MUSD from redemption fees.

## Why Mezo

- **MUSD is stable.** Creators don't gamble on BTC price moves to feed their family.
- **MUSD is Bitcoin-backed.** Every MUSD is collateralized 110%+ by real BTC reserves.
- **MUSD is composable.** Tips → MUSD savings rate → trove collateral. Income literally turns into a credit line. No other chain offers this.
- **Gas is BTC.** Tippers pay gas in Bitcoin. Loops the economy back to the source asset.

## What we touch (cross-track integration)

| Primitive | How Nih uses it | Track impact |
|---|---|---|
| **MUSD (real Mezo, `0xf9BB…0af`)** | Default tip token, ALL settlement (tip / credit / stream / unlock) | Supernormal dApps ✓ |
| **MEZO** | Optional fee payment for 50% discount | MEZO Utilization ✓ |
| **Mezo StabilityPool** | NihEarn deposits real MUSD → BTC yield from liquidations | Bank on Bitcoin ✓ |
| **Mezo BorrowerOperations + TroveManager** | NihTrove per-user proxy for trove open / close / mint MUSD | Bank on Bitcoin ✓ |

This is the only known submission that **touches all three Mezo tracks at once** AND wraps Mezo's real BorrowerOperations + StabilityPool primitives (not a fork).

## Differentiators

| | Tippin.me | X Native Tip | Patreon | **Nih** |
|---|---|---|---|---|
| Currency | BTC volatile | BTC volatile | Fiat | **Real Mezo MUSD** |
| Platforms | 1 | 1 | platform-locked | **4 (extensible)** |
| Self-custody | partial | partial | no | **yes** |
| Fee | ~0.5% | ~1% | 5–10% | **0.5% (0.25% in MEZO)** |
| Composable | no | no | no | **credit + streams + yield + paywall** |
| Real Mezo primitives | n/a | n/a | n/a | **3 (MUSD, BorrowerOps, StabilityPool)** |

## Traction (this submission)

- **10 smart contracts** deployed on Mezo matsnet, 29/29 tests passing
- **Goldsky subgraph (nih/v4)** indexing real-MUSD events, currently at block 13.2M+
- **8 seeded real-MUSD tips** with 5 registered handles, demonstrating the loop
- **16 dashboard routes** including `/onboarding` interactive product tour, `/unlock` pay-to-access, `/docs` developer reference
- **Browser extension** built (Plasmo Chrome MV3, 4 platforms), self-hosted at `/install`
- **6 partner integrations** wired (Goldsky, Spectrum, Boar, OpenRouter, Tenderly, Validation Cloud)
- **Security hardening** — receipt-gated tx UX, on-chain signature replay guard, verifier ownership anchor, extension nonce + consent, vault setRouter onlyOwner

## Roadmap

**Post-hackathon (milestone grant track)**
- Chrome Web Store publish (build artefact ready, awaiting review)
- Twitter / GitHub OAuth Tier 2 verification
- 100 verified creators onboarded
- Mainnet deployment (Validation Cloud RPC, same code path)

**6 months**
- YouTube creator partnerships
- Mobile PWA polish (already responsive)
- DAO migration of fee treasury (currently treasury = deployer)

## Team

Pugar Huda Mantoro — Indonesian builder, AI + workflow automation background. Solo + Claude Code.

## Ask

$5K veMEZO First Place (MUSD Track) + milestone-based grant for mainnet deployment with first 100 verified creators within 90 days.

---

> *Nih* — Indonesian for "here you go". The casual hand-off, made on-chain.
