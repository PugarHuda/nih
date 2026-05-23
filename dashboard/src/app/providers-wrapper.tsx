"use client";

import dynamic from "next/dynamic";

const ProvidersInner = dynamic(() => import("./providers").then((m) => m.Providers), {
  ssr: false,
  loading: () => null,
});

const ChainGuard = dynamic(
  () => import("@/components/chain-guard").then((m) => m.ChainGuard),
  { ssr: false }
);

/**
 * Providers wrapper for the (app) route group only.
 *
 * ssr:false here is safe because the marketing landing at / now lives
 * outside the (app) group and never imports this wrapper. Wagmi /
 * RainbowKit / motion touch React 19 internals that crash on the server,
 * so we render them client-only.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProvidersInner>
      <ChainGuard />
      {children}
    </ProvidersInner>
  );
}
