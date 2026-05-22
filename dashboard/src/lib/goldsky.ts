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
