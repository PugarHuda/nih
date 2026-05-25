"use client";

import { useEffect, useState } from "react";
import { resolveOwnerLabels, labelFor, type HandleLabel } from "./tipper-labels";

/**
 * Resolves the wallet → handle map once on mount, then hands back a sync
 * `label(address)` helper. Components use it to turn a raw tipper address
 * into "twitter:alice" on the leaderboard + live ticker.
 */
export function useTipperLabels() {
  const [map, setMap] = useState<Record<string, HandleLabel>>({});
  useEffect(() => {
    let alive = true;
    resolveOwnerLabels()
      .then((m) => alive && setMap(m))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return {
    map,
    label: (address?: string | null) => labelFor(map, address),
  };
}
