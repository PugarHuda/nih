import { fallback, http } from "wagmi";
// Deep-import skips Passport's index barrel which would otherwise pull
// in @mezo-org/mezo-clay (React-18-only UI bundle that crashes React 19).
// config.js itself only depends on rainbowkit + wagmi + wallet helpers.
import { getConfig } from "@mezo-org/passport/dist/src/config";
import { matsnet } from "./chain";

/**
 * Wagmi config powered by @mezo-org/passport.
 *
 * Passport bundles Mezo-specific connectors out of the box:
 *  - MetaMask (default injected)
 *  - Xverse (Bitcoin-native wallet)
 *  - Unisat (Bitcoin-native wallet)
 *  - OKX (Bitcoin + EVM)
 *  - WalletConnect (mobile fallback)
 *
 * The crucial differentiator: Xverse and Unisat let BTC-maximalist users
 * connect with the wallets they already use for native Bitcoin — they don't
 * have to install MetaMask just to tip.
 *
 * Transport priority — matsnet:
 *   1. NEXT_PUBLIC_SPECTRUM_RPC if set (bonus prize integration)
 *   2. NEXT_PUBLIC_RPC_URL (Mezo public default)
 *   3. Hardcoded public fallback
 */
const spectrum = process.env.NEXT_PUBLIC_SPECTRUM_RPC;
const primary = process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.test.mezo.org";
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID ?? "00000000000000000000000000000000";

export const wagmiConfig = getConfig({
  appName: "Nih",
  appDescription: "Tip MUSD anywhere on the web.",
  appUrl: "https://nih-seven.vercel.app",
  appIcon: "https://nih-seven.vercel.app/icon.png",
  mezoNetwork: "testnet",
  walletConnectProjectId,
  chains: [matsnet],
  ssr: true,
  transports: {
    transports: {
      [matsnet.id]: fallback(
        [
          ...(spectrum ? [http(spectrum)] : []),
          http(primary),
          http("https://rpc.test.mezo.org"),
        ],
        { rank: false }
      ),
    },
  },
});
