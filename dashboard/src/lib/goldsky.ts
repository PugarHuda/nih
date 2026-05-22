/**
 * Goldsky GraphQL client for the Nih subgraph.
 *
 * Once the subgraph is deployed (see /subgraph), set NEXT_PUBLIC_GOLDSKY_URL
 * to the production endpoint. The hackathon submission may run against the
 * staging URL; the dashboard gracefully degrades to on-chain queries when
 * the endpoint is unset.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_GOLDSKY_URL;

export interface TopRecipient {
  address: string;
  totalReceived: string;
  tipCount: string;
}

export interface RecentTip {
  id: string;
  amount: string;
  sender: { address: string };
  recipient: { address: string } | null;
  handleId: string;
  timestamp: string;
}

export interface RecentStream {
  id: string;
  streamId: string;
  sender: string;
  recipient: string;
  deposit: string;
  startTime: string;
  stopTime: string;
  cancelled: boolean;
}

export type FeedEvent =
  | { type: "tip"; data: RecentTip }
  | { type: "stream"; data: RecentStream };

export async function fetchTopRecipients(limit = 10): Promise<TopRecipient[]> {
  if (!ENDPOINT) return [];
  const query = `{
    accounts(first: ${limit}, orderBy: totalReceived, orderDirection: desc, where: {totalReceived_gt: "0"}) {
      address
      totalReceived
      tipCount
    }
  }`;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data?.accounts ?? [];
}

export async function fetchRecentStreams(limit = 10): Promise<RecentStream[]> {
  if (!ENDPOINT) return [];
  const query = `{
    streamRecords(first: ${limit}, orderBy: startTime, orderDirection: desc) {
      id
      streamId
      sender
      recipient
      deposit
      startTime
      stopTime
      cancelled
    }
  }`;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data?.streamRecords ?? [];
}

/// Mixed timeline — tips and streams, newest first.
export async function fetchActivityFeed(limit = 8): Promise<FeedEvent[]> {
  const [tips, streams] = await Promise.all([
    fetchRecentTips(limit),
    fetchRecentStreams(limit),
  ]);
  const events: FeedEvent[] = [
    ...tips.map((t) => ({ type: "tip" as const, data: t })),
    ...streams.map((s) => ({ type: "stream" as const, data: s })),
  ];
  events.sort((a, b) => {
    const ta = a.type === "tip" ? Number(a.data.timestamp) : Number(a.data.startTime);
    const tb = b.type === "tip" ? Number(b.data.timestamp) : Number(b.data.startTime);
    return tb - ta;
  });
  return events.slice(0, limit);
}

export async function fetchRecentTips(limit = 20): Promise<RecentTip[]> {
  if (!ENDPOINT) return [];
  const query = `{
    tips(first: ${limit}, orderBy: timestamp, orderDirection: desc) {
      id
      amount
      sender { address }
      recipient { address }
      handleId
      timestamp
    }
  }`;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data?.tips ?? [];
}
