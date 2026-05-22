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
  // landing.html → src/app/page.tsx (now a real React component).
  // Old rewrite removed.
};

export default nextConfig;
