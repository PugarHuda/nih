import { createConfig, fallback, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { matsnet } from "./chain";

/**
 * Transport priority — matsnet:
 *   1. NEXT_PUBLIC_SPECTRUM_RPC (if set) — bonus prize integration
 *   2. NEXT_PUBLIC_RPC_URL (default Mezo public)
 *   3. Hardcoded fallback to public
 *
 * The wagmi `fallback` transport rotates through these on failure, so a
 * Spectrum hiccup doesn't break the dashboard.
 */
const spectrum = process.env.NEXT_PUBLIC_SPECTRUM_RPC;
const primary = process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.test.mezo.org";

export const wagmiConfig = createConfig({
  chains: [matsnet],
  connectors: [injected()],
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
  ssr: true,
});
