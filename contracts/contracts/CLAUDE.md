# contracts/

Solidity smart contracts powering Nih.

## Files

| Contract | Purpose |
|---|---|
| `NihRegistry.sol` | Social handle → wallet mapping with verification tiers (0/Unverified, 1/Signature, 2/OAuth, 3/Manual) |
| `NihVault.sol` | Escrow holding tips for unregistered handles. 180-day TTL → auto-refund |
| `NihRouter.sol` | Single entry point: `tip(platform, username, amount, payFeeInMezo, ctx)` |
| `NihCredit.sol` | Creator credit line — borrow 60% LTV against claimed tips, 1% APR |
| `mocks/MockMUSD.sol` | ERC-20 mock for testnet (real MUSD address TBD) |
| `mocks/MockMEZO.sol` | ERC-20 mock for testnet |

## Deploy order

```
1. MockMUSD + MockMEZO    (or use real addresses on mainnet)
2. NihRegistry            (constructor: verifier address)
3. NihVault               (constructor: MUSD, NihRegistry)
4. NihRouter              (constructor: MUSD, MEZO, NihRegistry, NihVault, treasury)
5. NihVault.setRouter()   (one-time wiring)
6. NihCredit              (constructor: MUSD, NihVault)
```

## Conventions

- Solidity 0.8.28 with `evmVersion: london`
- OpenZeppelin v5
- GPL-3.0
- Custom errors over `require(... string)` for gas
- `ReentrancyGuard` on any state-modifying external function moving tokens
- No proxy / no upgrade — contracts are immutable

## Test

```bash
pnpm test
```
