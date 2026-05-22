# QA Report — Nih v0.1.0

Recorded during the QA pass after initial implementation.

## Bugs found & fixed

| # | Severity | File | Bug | Fix |
|---|---|---|---|---|
| 1 | High | `dashboard/src/app/api/verify/route.ts` | `keccak256` and `encodePacked` imported from `viem/accounts` (wrong subpath) — module not found at runtime | Split imports: `keccak256, encodePacked` from `viem`; `privateKeyToAccount` from `viem/accounts` |
| 2 | High | `dashboard/src/app/borrow/page.tsx` | `(allowance ?? 0n < collateralWei)` — JS operator precedence parsed as `?? (0n < collateralWei)`. Always evaluated wrong | Hoisted to two statements with explicit parens: `const cur = (allowance ?? 0n); const needs = cur < collateralWei;` |
| 3 | Medium | `dashboard/src/app/borrow/page.tsx` + `claim/page.tsx` | Hardcoded `as readonly [...]` access on wagmi result that may not always be tuple-shaped | Introduced typed local variable `loanTuple` / `resolvedTuple` |
| 4 | Medium | `contracts/contracts/NihRouter.sol` | MEZO fee math assumed 1 MEZO = 1 MUSD (couples token prices) | Added `mezoPerMusd` rate state, `setMezoPerMusd()` admin fn; fee math now scales |
| 5 | Medium | `contracts/contracts/NihCredit.sol` | `deposit` share math used `balanceOf(this) - amount` which excludes outstanding loans → over-issues shares once loans are out | Track `totalOutstanding` separately, compute `totalAssets() = balance + outstanding`, snapshot before transfer |
| 6 | Medium | `contracts/contracts/NihCredit.sol` | `withdraw` could fail silently when pool is illiquid (all lent out) | Added explicit `InsufficientLiquidity` revert when `balanceOf(this) < amount` |
| 7 | High | `subgraph/src/mapping.ts` | Compared address param to `Bytes.empty()` (always false for 20-byte address) — recipient zero-address check broken | Changed to `Address.zero()` from graph-ts |
| 8 | High | `subgraph/src/mapping.ts` | `Loan` entity keyed by `event.transaction.hash`; `handleLoanRepaid` then loaded by *its own* tx hash and always missed | Re-keyed Loan entity by `event.params.borrower` (one active loan per borrower invariant) |
| 9 | Low | `dashboard/src/app/claim/page.tsx` | `toBytes` imported but unused | Removed import |
| 10 | Medium | `dashboard/public/widget.js` | Initial draft used `innerHTML` interpolating `data-username` — XSS risk if hosting site let attackers control the value | Refactored to `createElement` + `textContent` for all DOM construction |

## Known limitations (acceptable for hackathon, flagged for mainnet)

| Item | Mitigation plan |
|---|---|
| `NihVault._sweep` iterates `handleTips[handleId]` array unbounded — could OOG with thousands of tips | Limit batch per-call; pre-aggregate sum (`unclaimedAmount` already does). For mainnet: tip arrays implemented as circular buffer with head pointer |
| Backend verifier `/api/verify` auto-issues Tier 1 attestation without real handle ownership check | Production must integrate Twitter OAuth / signed-tweet challenge scrape |
| `mezoPerMusd` is owner-settable, not oracle-derived | Wire to TWAP oracle on mainnet |
| `MockMUSD` / `MockMEZO` deployed instead of real Mezo tokens | Set `MUSD_ADDRESS` / `MEZO_ADDRESS` env vars in `deploy.ts` to use real contracts on mainnet |
| `NihCredit` lender pool model not integrated with Mezo's MUSD trove | Production: flash-mint MUSD from a protocol-owned trove instead of pool-borrowed |

## Static analysis pass

- All Solidity files use SPDX headers
- All external state-modifying functions use `nonReentrant` where token transfers occur
- All `require` strings ≤ 32 bytes (gas-efficient)
- All custom errors declared
- OpenZeppelin v5 imports verified (Ownable signature now takes initial owner)

## Test coverage

`contracts/test/Nih.test.ts` — 5 specs:
1. Registry: manual register a handle
2. Registry: register with verifier signature (Tier 1)
3. Tipping: instant transfer to registered handle
4. Tipping: park in vault for unregistered, recipient claims later
5. Tipping: MEZO fee path discounted
6. Credit: open loan at 60% LTV
7. Credit: repay releases collateral

Tested behaviors NOT covered (gap for v0.2):
- `refundExpired` after TTL
- Liquidation flow when interest accrues past 90%
- Multi-deposit share math correctness
- Reentrancy guard probes
