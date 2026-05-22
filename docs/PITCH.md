# Nih — Pitch one-pager

## The 30-second pitch

> Bitcoin is the best money the world has ever invented, but you can't tip your favorite YouTube creator with it without first selling, then dealing with a custodian, then crossing your fingers it arrives. **Nih makes it as easy as a like.** A browser extension injects a tip button on Twitter, YouTube, Substack, Medium, and GitHub. One click sends MUSD — Bitcoin-backed stablecoin — to the creator's wallet. And here's the magic: those creators can borrow against their accumulated tips without ever selling their Bitcoin exposure. Built on Mezo, powered by MUSD and MEZO. Tipping meets self-service banking.

## The problem

| Existing tipping | Why it fails |
|---|---|
| **Patreon, Ko-fi** | 5–10% fee. Custodial. Platform-locked. Slow payouts. |
| **Tippin.me (BTC Lightning)** | Volatile BTC. Twitter only. Lightning UX is brutal. |
| **X native Bitcoin tip** | Same as above. Lightning channel headache. |
| **Brave BAT** | Niche browser. Closed ecosystem. |

**The gap**: no tipping tool gives creators stable, Bitcoin-backed money across every platform with self-custody — and none of them turn that income into composable financial primitives.

## The solution

**Nih = browser extension + on-chain registry + escrow vault + credit line.**

1. **Browser extension** injects a "Tip MUSD" button on every social profile (Twitter, YouTube, Substack, Medium, GitHub).
2. **On-chain registry** maps social handle → Mezo wallet via tiered verification (Tier 1 signature, Tier 2 OAuth, Tier 3 DAO whitelist).
3. **Escrow vault** parks tips for unregistered handles for up to 180 days; auto-refunds if unclaimed.
4. **Credit line** lets creators borrow up to 60% LTV against accumulated tips — without selling.

## Why Mezo

- **MUSD is stable.** Creators don't gamble on BTC price moves to feed their family.
- **MUSD is Bitcoin-backed.** Every MUSD is collateralized 110%+ by real BTC reserves.
- **MUSD is composable.** Tips → MUSD savings rate → trove collateral. Income literally turns into a credit line. No other chain offers this.
- **Gas is BTC.** Tippers pay gas in Bitcoin. Loops the economy back to the source asset.

## What we touch (cross-track integration)

| Primitive | How Nih uses it | Track impact |
|---|---|---|
| **MUSD** | Default tip token, all settlement | Supernormal dApps ✓ |
| **MEZO** | Optional fee payment for 50% discount | MEZO Utilization ✓ |
| **Mezo Earn** | Creator dashboard auto-suggests savings deposit | Bank on Bitcoin ✓ |
| **Trove (MUSD borrow)** | Credit Line module borrows against locked tips | Bank on Bitcoin ✓ |

This is the only known submission that **touches all three Mezo tracks at once**.

## Differentiators

| | Tippin.me | X Native Tip | Patreon | **Nih** |
|---|---|---|---|---|
| Currency | BTC volatile | BTC volatile | Fiat | **MUSD stable** |
| Platforms | 1 | 1 | platform-locked | **5 (extensible)** |
| Self-custody | partial | partial | no | **yes** |
| Fee | ~0.5% | ~1% | 5–10% | **0.5% (0.25% in MEZO)** |
| Composable | no | no | no | **credit line** |

## Traction & roadmap

**Hackathon week (now)**
- Smart contracts deployed on Mezo matsnet
- Browser extension (Chrome + Firefox) shipped
- Dashboard live on Vercel
- Demo video recorded

**Post-hackathon (milestone grant track)**
- Chrome Web Store publish
- Twitter OAuth Tier 2 verification
- 100 verified creators onboarded
- Goldsky subgraph in production

**6 months**
- YouTube creator partnerships
- Mainnet launch
- Mobile companion app
- DAO migration of fee treasury

## Team

Pugar Huda Mantoro — Indonesian builder, AI + workflow automation background. Solo + Claude Code.

## Ask

$5K veMEZO First Place (MUSD Track) + milestone-based grant for mainnet deployment with first 100 verified creators within 90 days.

---

> *"Nih, gue tip lo."*
