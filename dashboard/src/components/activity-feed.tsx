"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";
import { formatMUSD, truncateAddress } from "@/lib/utils";
import { fetchRecentTips, type RecentTip } from "@/lib/goldsky";

/**
 * Live activity ticker — polls Goldsky every 15s.
 * Falls back to a single placeholder when subgraph is not configured.
 */
export function ActivityFeed({ limit = 6 }: { limit?: number }) {
  const [tips, setTips] = useState<RecentTip[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchRecentTips(limit);
      if (!cancelled) {
        setTips(data);
        setLoaded(true);
      }
    }
    load();
    const interval = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [limit]);

  if (loaded && tips.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 p-5 text-sm text-muted text-center">
        No tips yet — be the first.
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      <AnimatePresence initial={false}>
        {tips.map((tip) => (
          <motion.li
            key={tip.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface/50 px-3 py-2.5 text-sm"
          >
            <span className="rounded-md bg-accent/10 p-1.5 text-accent">
              <Coins className="h-3.5 w-3.5" />
            </span>
            <code className="font-mono text-xs text-muted">
              {truncateAddress(tip.sender.address)}
            </code>
            <span className="text-muted text-xs">→</span>
            <code className="font-mono text-xs text-muted">
              {tip.recipient ? truncateAddress(tip.recipient.address) : "vault"}
            </code>
            <span className="ml-auto font-semibold text-fg">
              {formatMUSD(BigInt(tip.amount))} MUSD
            </span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
