import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@mezo-org/passport",
    "@mezo-org/orangekit",
    "@mezo-org/orangekit-contracts",
    "@mezo-org/orangekit-smart-account",
    "@mezo-org/mezo-clay",
    "@mezo-org/mezod-contracts",
    "@mezo-org/musd-contracts",
    "@mezo-org/sign-in-with-wallet",
    "@rainbow-me/rainbowkit",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "abs.twimg.com" },
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "unavatar.io" },
      { protocol: "https", hostname: "github.com" },
    ],
  },
  // Alias framer-motion + motion to a React-19-safe shim so the bundled
  // copy that Mezo Passport pulls in (which references
  // React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner
  // — removed in React 19) never gets evaluated. None of our own code
  // uses framer-motion directly any more; the shim provides the same
  // public API as a no-op so passport's imports resolve fine.
  webpack: (config) => {
    const shim = path.resolve(__dirname, "src/lib/framer-motion-shim.tsx");
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "framer-motion$": shim,
      "framer-motion/dist/es/index.mjs": shim,
      "motion/react$": shim,
      "motion/react/dist/es/index.mjs": shim,
    };
    return config;
  },
};

export default nextConfig;
