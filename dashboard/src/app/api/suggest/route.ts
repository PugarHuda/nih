import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { matsnet } from "@/lib/chain";
import { addresses, routerAbi } from "@/lib/contracts";

/**
 * AI tip-amount suggestion.
 *
 * Pipeline:
 *  1. Pull on-chain context via the Boar Network RPC (or default Mezo RPC):
 *     - recipient's lifetime tips received (social proof)
 *     - sender's lifetime tips sent (caller generosity)
 *  2. If ANTHROPIC_API_KEY is set, send context + post text to Claude for
 *     a personalised recommendation and a 1-line rationale.
 *  3. Otherwise fall back to the deterministic heuristic so the endpoint
 *     never blocks the UI in offline / no-budget demos.
 *
 * The Boar MCP "blockchain context" pattern lives here — for production we'd
 * swap fetch() of public RPC with Boar's authenticated MCP endpoint that
 * exposes batched reads and ENS-style decoded responses.
 */

interface SuggestPayload {
  postText?: string;
  authorHandle?: string;
  senderAddress?: `0x${string}`;
  recipientAddress?: `0x${string}`;
  platform?: string;
}

const boarRpc = process.env.BOAR_RPC_URL ?? "https://rpc.test.mezo.org";

const client = createPublicClient({
  chain: matsnet,
  transport: http(boarRpc),
});

async function loadContext(payload: SuggestPayload) {
  const ctx: Record<string, string> = {};
  if (payload.recipientAddress) {
    try {
      const v = (await client.readContract({
        address: addresses.Router,
        abi: routerAbi,
        functionName: "totalReceived",
        args: [payload.recipientAddress],
      })) as bigint;
      ctx.recipientLifetimeReceived = (Number(v) / 1e18).toFixed(2) + " MUSD";
    } catch { /* ignore */ }
  }
  if (payload.senderAddress) {
    try {
      const v = (await client.readContract({
        address: addresses.Router,
        abi: routerAbi,
        functionName: "totalSent",
        args: [payload.senderAddress],
      })) as bigint;
      ctx.senderLifetimeSent = (Number(v) / 1e18).toFixed(2) + " MUSD";
    } catch { /* ignore */ }
  }
  return ctx;
}

function heuristicSuggest(payload: SuggestPayload): { amount: number; reasoning: string } {
  const text = (payload.postText ?? "").trim();
  const len = text.length;
  const hasCodeBlock = /```|`/.test(text);
  const hasNumbers = /\d+/.test(text);
  const hasLink = /https?:\/\//.test(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  let score = 0;
  if (len > 500) score += 2;
  else if (len > 200) score += 1;
  if (hasCodeBlock) score += 2;
  if (hasNumbers) score += 0.5;
  if (hasLink) score += 0.5;
  if (wordCount > 50) score += 1;

  if (score >= 4) return { amount: 10, reasoning: "Long technical post — substantive contribution worth 10 MUSD." };
  if (score >= 2) return { amount: 5, reasoning: "Solid post with depth. 5 MUSD feels right." };
  if (score >= 1) return { amount: 1, reasoning: "Light post — encouragement tip of 1 MUSD." };
  return { amount: 1, reasoning: "Default starter tip of 1 MUSD." };
}

async function llmSuggest(payload: SuggestPayload, ctx: Record<string, string>) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const prompt = `You are a tipping assistant. Recommend a tip amount in MUSD (one of 1, 5, 10, 25) based on the post and on-chain reputation. Reply as JSON {"amount": number, "reasoning": "one short sentence"}.

Post text:
${(payload.postText ?? "").slice(0, 1500)}

Author handle: ${payload.authorHandle ?? "unknown"}
Platform: ${payload.platform ?? "unknown"}

On-chain context (via Boar Network RPC):
${Object.entries(ctx).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "- no prior activity"}`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (typeof parsed.amount === "number" && typeof parsed.reasoning === "string") {
      return { amount: parsed.amount, reasoning: parsed.reasoning, source: "claude+boar" };
    }
  } catch {
    /* swallow */
  }
  return null;
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as SuggestPayload;
  const ctx = await loadContext(payload);
  const ai = await llmSuggest(payload, ctx);
  if (ai) return NextResponse.json(ai);
  const fallback = heuristicSuggest(payload);
  return NextResponse.json({ ...fallback, source: "heuristic" });
}
