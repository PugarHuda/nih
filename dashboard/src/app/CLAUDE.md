# dashboard/src/app/

Next.js 15 App Router pages.

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing page (hero + how-it-works + install CTA) |
| `/dashboard` | Creator dashboard — balance, lifetime tips, action grid |
| `/claim` | Verify handle ownership and claim parked tips |
| `/borrow` | Open / repay credit line against tip collateral |
| `/api/verify` | POST endpoint — issues verifier-signed Tier 1 attestation |

## Convention notes

- All pages are `"use client"` since they read on-chain state via wagmi hooks
- API routes use the verifier private key from `VERIFIER_PRIVATE_KEY` env (never exposed client-side)
- Contract addresses read from `NEXT_PUBLIC_*_ADDRESS` env (frontend-safe)
- Toast notifications via `sonner`
- Animations via `framer-motion` with consistent `fadeUp` variant

## Adding a new page

1. Create `app/<route>/page.tsx` with `"use client"`
2. Import `<Header />` for nav
3. Use `<Card>` + `<Button>` + `<Input>` primitives from `components/ui/`
4. Read state via `useReadContract` from wagmi
5. Write state via `useWriteContract` + `toast.success/error`
