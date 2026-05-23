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

/**
 * Top tip receivers.
 *
 * NOTE: we used to query the `accounts` entity here, but the subgraph
 * mapping has a stale-reference bug when sender == recipient (self-tip
 * for handles you own): sender.save() overwrites the recipient's
 * totalReceived update because both hold separate AssemblyScript copies
 * of the same entity. Until the subgraph is republished, derive top
 * recipients from `handleStats` (always correct) and resolve owner
 * addresses via the on-chain registry on the client.
 */
export async function fetchTopRecipients(limit = 10): Promise<TopRecipient[]> {
  if (!ENDPOINT) return [];
  const stats = await fetchHandleStats(limit);
  // The pseudo-address shown in the UI is the handle owner if known
  // (KNOWN_HANDLES contains demo handles), otherwise the handleId itself.
  return stats.map((s) => ({
    address: s.handleId,
    totalReceived: s.totalReceived,
    tipCount: s.tipCount,
  }));
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

export interface HandleStat {
  handleId: string;
  totalReceived: string;
  tipCount: string;
}

/**
 * Known handleId → (platform, username) reverse map.
 *
 * The subgraph stores handleId as bytes32 (keccak256("platform:username")).
 * That hash isn't invertible on-chain, so we keep a small client-side map
 * of the handles we registered manually during deploy. Unknown handleIds
 * fall back to a short hex preview in the UI.
 */
export const KNOWN_HANDLES: Record<string, { platform: string; username: string }> = {
  "0x876ed16774c41851a77836c6b7c8a73d1c4b8235505742837e791346d9640d75": { platform: "twitter", username: "hajislamet" },
  "0xe42fad11825c4bb4bc805f9ad53dbde50e93baf1431d09934ba95fe91bf60d91": { platform: "twitter", username: "pugarhuda" },
  "0xc0a8544bd367c1f9e4bad8de180be3c96f97d663c4168d837e04c5628c64e77e": { platform: "github", username: "PugarHuda" },
  "0x6773975048115fba630eae27d130fa00457470464b1f3b7cbc48b2720e319a51": { platform: "twitter", username: "MezoNetwork" },
  "0x3c5b565e32b3a7f627794117bdd3a0292f1e4d225316f4b5b2bae3d08a6ca151": { platform: "twitter", username: "EncodeClub" },
};

export function lookupHandle(handleId: string): { platform: string; username: string } | null {
  return KNOWN_HANDLES[handleId.toLowerCase()] ?? null;
}

export async function fetchHandleStats(limit = 10): Promise<HandleStat[]> {
  if (!ENDPOINT) return [];
  const query = `{
    handleStats(first: ${limit}, orderBy: totalReceived, orderDirection: desc) {
      handleId
      totalReceived
      tipCount
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
  return json.data?.handleStats ?? [];
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
