import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchTopRecipients, fetchRecentTips, fetchTopTippers, lookupHandle, KNOWN_HANDLES } from "@/lib/goldsky";
import { resolveOwnerLabels, labelFor } from "@/lib/tipper-labels";
import { supporterStatus } from "@/lib/supporter-tier";
import { formatMUSD, truncateAddress } from "@/lib/utils";
import { Trophy, Coins, Heart } from "lucide-react";

export const revalidate = 60;

export default async function LeaderboardPage() {
  const [recipients, recentTips, topTippers, tipperMap] = await Promise.all([
    fetchTopRecipients(10),
    fetchRecentTips(15),
    fetchTopTippers(10),
    resolveOwnerLabels(),
  ]);
  // Turn a tipper wallet into "twitter:alice" when the address owns a
  // handle we know; otherwise fall back to the short hex address.
  const senderLabel = (addr: string) => {
    const h = labelFor(tipperMap, addr);
    return h ? `${h.platform}:${h.username}` : truncateAddress(addr);
  };

  return (
    <>
      <Header />
      <main className="container max-w-4xl py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs text-brand mb-4">
            <Trophy className="h-3.5 w-3.5" /> Live leaderboard
          </div>
          <h1 className="h1 mb-2" style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}>
            Top-tipped creators
          </h1>
          <p className="muted">
            Indexed in real-time by Goldsky from the Nih subgraph on Mezo matsnet.
          </p>
        </div>

        {recipients.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No data yet</CardTitle>
              <CardDescription>
                Subgraph endpoint not configured, or no tips have been recorded yet. Deploy
                the subgraph in <code>/subgraph</code> and set{" "}
                <code>NEXT_PUBLIC_GOLDSKY_URL</code> to populate this page.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm uppercase tracking-widest muted mb-4">
                Top recipients
              </h2>
              <ol className="space-y-2">
                {recipients.map((r, i) => {
                  // After the goldsky.ts switch, `address` is a handleId.
                  // Resolve to a friendly @handle when we know it.
                  const meta = lookupHandle(r.address);
                  const label = meta
                    ? `@${meta.username} · ${meta.platform}`
                    : `${r.address.slice(0, 10)}…`;
                  return (
                    <li
                      key={r.address}
                      style={{
  padding: "10px 16px",
  background: "var(--paper)",
  color: "var(--ink)",
  border: "3px solid var(--ink)",
  boxShadow: "2px 2px 0 0 var(--ink)",
}}
className="flex items-center gap-4"
                    >
                      <span className="text-xl font-semibold muted w-7">{i + 1}</span>
                      <span className="font-mono text-sm flex-1 truncate">{label}</span>
                      <span className="text-sm font-semibold text-brand">
                        {formatMUSD(BigInt(r.totalReceived))} MUSD
                      </span>
                      <span className="text-[10px] muted mono">{r.tipCount} tip{Number(r.tipCount) === 1 ? "" : "s"}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div>
              <h2 className="text-sm uppercase tracking-widest muted mb-4">
                Recent tips
              </h2>
              <ul className="space-y-2">
                {recentTips.map((tip) => (
                  <li
                    key={tip.id}
                    style={{
  padding: "10px 16px",
  background: "var(--paper)",
  color: "var(--ink)",
  border: "3px solid var(--ink)",
  boxShadow: "2px 2px 0 0 var(--ink)",
}}
className="flex items-center gap-3"
                  >
                    <Coins className="h-4 w-4 text-accent" />
                    <code className="font-mono text-xs muted truncate max-w-[42%]">
                      {senderLabel(tip.sender.address)}
                    </code>
                    <span className="muted text-xs">→</span>
                    <code className="font-mono text-xs muted">
                      {tip.recipient ? truncateAddress(tip.recipient.address) : "vault"}
                    </code>
                    <span className="ml-auto text-sm font-semibold">
                      {formatMUSD(BigInt(tip.amount))} MUSD
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Top tippers — recognition for the people funding creators. Tier
            from lifetime MUSD sent (Account.totalSent), handle resolved when
            the wallet owns a known handle. This is the tipper-side reward. */}
        {topTippers.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-4 w-4 text-accent" />
              <h2 className="text-sm uppercase tracking-widest muted">Top supporters</h2>
            </div>
            <ol className="grid sm:grid-cols-2 gap-2">
              {topTippers.map((t, i) => {
                const meta = labelFor(tipperMap, t.address);
                const label = meta ? `${meta.platform}:${meta.username}` : truncateAddress(t.address);
                const tier = supporterStatus(BigInt(t.totalSent)).tier;
                return (
                  <li
                    key={t.address}
                    className="flex items-center gap-3"
                    style={{
                      padding: "10px 16px",
                      background: "var(--paper)",
                      color: "var(--ink)",
                      border: "3px solid var(--ink)",
                      boxShadow: "2px 2px 0 0 var(--ink)",
                    }}
                  >
                    <span className="text-xl font-semibold muted w-7">{i + 1}</span>
                    <span className="font-mono text-sm flex-1 truncate">{label}</span>
                    {tier && (
                      <span
                        className="text-[11px] font-semibold whitespace-nowrap"
                        style={{ color: tier.color }}
                        title={`${tier.name} Supporter`}
                      >
                        {tier.emoji} {tier.name}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-accent whitespace-nowrap">
                      {formatMUSD(BigInt(t.totalSent))} MUSD
                    </span>
                    <span className="text-[10px] muted mono whitespace-nowrap">
                      {t.tipCount} tip{Number(t.tipCount) === 1 ? "" : "s"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </main>
    </>
  );
}
