import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchTopRecipients, fetchRecentTips, lookupHandle, KNOWN_HANDLES } from "@/lib/goldsky";
import { formatMUSD, truncateAddress } from "@/lib/utils";
import { Trophy, Coins } from "lucide-react";

export const revalidate = 60;

export default async function LeaderboardPage() {
  const [recipients, recentTips] = await Promise.all([
    fetchTopRecipients(10),
    fetchRecentTips(15),
  ]);

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
          <p className="text-muted">
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
              <h2 className="text-sm uppercase tracking-widest text-muted mb-4">
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
                      className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3"
                    >
                      <span className="text-xl font-semibold text-muted w-7">{i + 1}</span>
                      <span className="font-mono text-sm flex-1 truncate">{label}</span>
                      <span className="text-sm font-semibold text-brand">
                        {formatMUSD(BigInt(r.totalReceived))} MUSD
                      </span>
                      <span className="text-[10px] text-muted mono">{r.tipCount} tip{Number(r.tipCount) === 1 ? "" : "s"}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div>
              <h2 className="text-sm uppercase tracking-widest text-muted mb-4">
                Recent tips
              </h2>
              <ul className="space-y-2">
                {recentTips.map((tip) => (
                  <li
                    key={tip.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                  >
                    <Coins className="h-4 w-4 text-accent" />
                    <code className="font-mono text-xs text-muted">
                      {truncateAddress(tip.sender.address)}
                    </code>
                    <span className="text-muted text-xs">→</span>
                    <code className="font-mono text-xs text-muted">
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
      </main>
    </>
  );
}
