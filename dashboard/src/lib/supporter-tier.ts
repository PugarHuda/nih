/**
 * Supporter tiers — a real, on-chain reputation for tippers.
 *
 * Derived purely from `NihRouter.totalSent(wallet)` (lifetime MUSD tipped),
 * which the router already tracks on every tip. No new contract, no stored
 * flag, no fake data: the tier is a pure function of verifiable chain state.
 * It gives tippers recognition (a status they earn by supporting creators) —
 * the missing tipper-side incentive — without minting anything.
 */
export interface Tier {
  name: string;
  emoji: string;
  /** inclusive lower bound in whole MUSD */
  min: number;
  color: string;
}

// Highest-first so `tierFor` can return the first match.
export const TIERS: Tier[] = [
  { name: "Diamond", emoji: "💎", min: 500, color: "#3BA7C4" },
  { name: "Gold", emoji: "🥇", min: 100, color: "#E0A100" },
  { name: "Silver", emoji: "🥈", min: 25, color: "#8A8F98" },
  { name: "Bronze", emoji: "🥉", min: 1, color: "#B06B3A" },
];

export interface SupporterStatus {
  tier: Tier | null; // null when nothing tipped yet
  sentMusd: number;
  next: Tier | null; // the tier above the current one
  toNext: number; // MUSD remaining to reach `next` (0 if maxed/none)
}

/** Resolve a lifetime-sent amount (wei, 18-decimals) to a supporter status. */
export function supporterStatus(totalSentWei: bigint | undefined): SupporterStatus {
  const sentMusd = totalSentWei ? Number(totalSentWei) / 1e18 : 0;
  const tier = TIERS.find((t) => sentMusd >= t.min) ?? null;
  // `next` is the lowest tier whose min exceeds the current sent amount.
  const above = [...TIERS].reverse().find((t) => t.min > sentMusd) ?? null;
  return {
    tier,
    sentMusd,
    next: above,
    toNext: above ? Math.max(0, above.min - sentMusd) : 0,
  };
}
