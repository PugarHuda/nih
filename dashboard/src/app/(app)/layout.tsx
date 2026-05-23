import { Providers } from "../providers-wrapper";

// wagmi/RainbowKit/motion need the browser. Skip static prerender for
// every page in this route group — they render on demand at request time.
export const dynamic = "force-dynamic";

/**
 * App-section layout — wraps wagmi / RainbowKit / Mezo Passport.
 *
 * Why a route group: the marketing landing at `/` doesn't need a wallet
 * context, and importing those libraries on it caused (a) the Phantom vs
 * MetaMask `window.ethereum` race to crash the page and (b) framer-motion's
 * stale ReactCurrentOwner access to break /_not-found prerender.
 *
 * With this split:
 *   src/app/page.tsx          → static landing (no Providers)
 *   src/app/(app)/*           → dashboard, claim, borrow, etc. (Providers)
 *   src/app/_not-found.tsx    → handled by root layout (no Providers)
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
