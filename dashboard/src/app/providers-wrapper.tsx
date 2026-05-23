"use client";

import { Providers as ProvidersInner } from "./providers";
import { ChainGuard } from "@/components/chain-guard";

/**
 * Providers wrapper.
 *
 * Round 6 used dynamic({ ssr: false }) to dodge a window-touching init in
 * RainbowKit, but that turned out to bail SSR for the WHOLE app (the
 * <template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"> marker), which
 * meant the static comic-landing markup never reached the rendered HTML.
 *
 * Modern wagmi (ssr: true in createConfig) + RainbowKit 2 + Mezo Passport
 * handle SSR cleanly now. Direct import — every page SSRs properly again.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProvidersInner>
      <ChainGuard />
      {children}
    </ProvidersInner>
  );
}
