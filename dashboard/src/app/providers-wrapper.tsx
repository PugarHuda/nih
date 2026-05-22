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
 * Wallet stack is client-only. Wrap with ssr:false to skip Next.js's static
 * snapshot of providers + chain guard — they touch window at import.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProvidersInner>
      <ChainGuard />
      {children}
    </ProvidersInner>
  );
}
