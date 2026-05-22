# QA Round 2 — after v0.4 ship

Deep static + functional review after the real-Mezo + streaming round.

## Bugs found

| # | Severity | File | Bug | Fix |
|---|---|---|---|---|
| 1 | 🔴 Critical | `contracts/scripts/deploy.ts` | Router/Vault/Credit pointed at real Mezo MUSD which has `mint()` gated by an allowlist — `/faucet` would revert, demo blocked | Hybrid deploy: Router/Vault/Credit/Stream → MockMUSD (open mint), Earn/Trove → real Mezo MUSD |
| 2 | 🔴 Critical | `contracts/contracts/NihTrove.sol:87` | `btcReturned = (balance - btcBefore) + coll - 0` double-counted collateral — `closeTrove()` already sends coll back, balance delta IS the refund | Simplified to `btcReturned = address(this).balance - btcBefore` |
| 3 | 🔴 High | `contracts/contracts/NihStream.sol:withdrawable` | After cancel, returned `deposit - withdrawn` which equals the sender's refunded amount — recipient could call `withdraw()` expecting more funds | Return 0 after cancel — all funds distributed at cancel-time |
| 4 | 🟡 Medium | `contracts/contracts/NihEarn.sol:withdraw` | BTC distribution split used `shares / (shares + totalShares)` with NEW totalShares — slight underweight on user's claim | Capture exact BTC delta from StabilityPool, forward to withdrawing user (also documented v2 reward-index pattern for fair time-weighting) |
| 5 | 🟡 Medium | `subgraph/subgraph.yaml` | NihStream events not indexed — `/leaderboard` and any streaming UI saw nothing | Added StreamCreated/Withdrawn/Cancelled handlers + StreamRecord entity. Deployed as `nih/v2` |
| 6 | 🟢 Low | `subgraph/src/mapping.ts` | `BigInt.fromI64(event.params.startTime)` — graph-ts maps uint64 directly to BigInt, the conversion call broke AssemblyScript compile | Removed conversion |

## Real Mezo verification

Confirmed live on matsnet via direct `eth_call`:
- `0xf9BBcCC0F1b68EA07c86de6F88C76b3d8E2dD0af.name()` → "Mezo USD" ✓
- `0xa14cbA6DD12D537A8decc7dd3c4aC413B8711eba` is BorrowerOperations ✓
- `0xCfdb903cD2Dc14E24e78130A63b20Ba65107262A` is StabilityPool ✓
- `0x7FE0A5a7EeBD88530c58824475edEae33424671F` is TroveManager ✓

Critical discovery: Mezo's real `MUSD.mint()` checks `mintList[msg.sender]` — only specific roles (BorrowerOperations etc.) can mint. Public users **cannot** acquire real MUSD without opening a Mezo trove. This is why we keep Mock MUSD for the demo tip flow.

## Tests added (now 17/17 passing)

```
NihStream (9 specs)
✔ creates a stream and locks the deposit
✔ releases MUSD linearly over time
✔ recipient withdraws the streamed amount
✔ non-recipient cannot withdraw
✔ withdraw after cancel reverts (NEW — catches bug #3)
✔ rejects double-cancel (NEW)
✔ rejects creating stream to self (NEW)
✔ rejects zero duration (NEW)
✔ cancel splits remaining pro-rata
```

## Production smoke test (https://nih-seven.vercel.app)

All 15 endpoints green:

| Route | Status |
|---|---|
| / | 200 |
| /stream | 200 |
| /earn | 200 |
| /borrow | 200 |
| /claim | 200 |
| /tip | 200 |
| /faucet | 200 |
| /leaderboard | 200 |
| /install | 200 |
| /privacy | 200 |
| /dashboard | 200 |
| /c/twitter/hajislamet | 200 |
| /api/health | 200 (returns NEW addresses) |
| /api/og | 200 |
| /manifest.webmanifest | 200 |

## Redeployment

All Nih contracts redeployed to matsnet with fixed Mezo integration:

| Contract | Address |
|---|---|
| MockMUSD | `0x496Cf8877B6EE51Ea84733FcDC50b39Dff9A22EA` |
| MockMEZO | `0x6BA6c7c52413A592F7799288CbC42d187ddda2f8` |
| NihRegistry | `0x237A48d4B05944cC78b2b469F68F1f21D7AdfF39` |
| NihVault | `0x4f76dc7EFbA1d1eE2cd76A75430b06A73d22cEFC` |
| NihRouter | `0xbeb23b459819b74F60699cE2FEA35B17266F36c5` |
| NihCredit | `0x9857aF25fFa558C382AbB916803Ee441502b0F8D` |
| NihStream | `0xBcaaD11EAF61fCf239837C403169Ec380bf36A37` |
| NihEarn | `0xBBfDd0F250c0c66dF6158A4ff5228e88086BbcF6` (real Mezo MUSD + StabilityPool) |
| NihTrove | `0x819d8bEFe65F9cc7A0E468048CFA1f7E3982f5A5` (real Mezo MUSD + BorrowerOperations) |

5 demo handles re-registered on the new Registry (Tier 3 Manual).

Subgraph migrated `nih/v1` → `nih/v2` — new endpoint indexes streams too.

## Sign-off

All bugs from this round resolved. Production deploys clean. Auto-deploy still active.

What's still v0.5+ roadmap:
- **NihEarn v2 reward-index** — proper time-weighted BTC distribution. Current v1 is a single-user demo; multi-user pool needs the index pattern from Convex/Lido.
- **NihTrove per-user proxy clones** — current contract supports one open trove at a time. For real production, deploy per-user proxy via CREATE2 + Clones library.
- **Open-mint allowlist for testnet MUSD** — if Mezo team adds Nih to mintList, we can collapse Mock + Real MUSD into one.
