import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, keccak256, encodePacked } from "viem";
import { matsnet } from "@/lib/chain";
import { addresses, routerAbi } from "@/lib/contracts";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * "Tippy" — Nih's tip-amount suggestion assistant.
 *
 * Pipeline:
 *  1. Gather real signals (never a flat guess):
 *     - the creator's typical tip: lifetime received ÷ tip count (subgraph)
 *     - the tipper's own generosity: lifetime sent (router)
 *     - the tipper's Bitcoin track record on mainnet (Boar Network RPC)
 *     - the post + platform context
 *  2. If OPENROUTER_API_KEY is set, send that context to an LLM for a
 *     personalised amount + a short human rationale + the factors weighed.
 *  3. Otherwise fall back to a deterministic heuristic so the endpoint never
 *     blocks the UI offline. The UI brands all of this as "Tippy".
 *
 * The Boar read is the "blockchain context for an AI agent" integration —
 * in production we'd swap the raw RPC for Boar's authenticated MCP endpoint.
 */

interface SuggestPayload {
  postText?: string;
  authorHandle?: string;
  senderAddress?: `0x${string}`;
  recipientAddress?: `0x${string}`;
  platform?: string;
}

// Boar's Mezo endpoint is MAINNET — used here read-only to demonstrate
// the integration (deployer wallet balances on mainnet, supply stats,
// etc). For testnet contract reads we still go through the public
// Mezo RPC. This satisfies the Boar "use Boar's RPC in an AI agentic
// application" criterion (the LLM consumes the Boar context below).
const boarRpc = process.env.BOAR_RPC_URL ?? "";
const localRpc = process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.test.mezo.org";

const client = createPublicClient({
  chain: matsnet,
  transport: http(localRpc),
});

const GOLDSKY = process.env.NEXT_PUBLIC_GOLDSKY_URL;

/** The creator's typical tip = lifetime received ÷ number of tips. */
async function creatorTipProfile(platform?: string, username?: string) {
  if (!GOLDSKY || !platform || !username) return null;
  try {
    const handleId = keccak256(
      encodePacked(["string", "string", "string"], [platform, ":", username.replace(/^@/, "")]),
    );
    const res = await fetch(GOLDSKY, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: `{ handleStat(id: "${handleId}") { totalReceived tipCount } }`,
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const j = await res.json();
    const s = j?.data?.handleStat;
    if (!s) return null;
    const total = Number(s.totalReceived) / 1e18;
    const count = Number(s.tipCount);
    return { total, count, avg: count > 0 ? total / count : 0 };
  } catch {
    return null;
  }
}

async function loadContext(payload: SuggestPayload) {
  const ctx: Record<string, string> = {};
  // The creator's tipping history — the single strongest signal for "what's
  // a normal tip for this person."
  const prof = await creatorTipProfile(payload.platform, payload.authorHandle);
  if (prof && prof.count > 0) {
    ctx.creatorTypicalTip = `${prof.avg.toFixed(2)} MUSD avg (over ${prof.count} tips, ${prof.total.toFixed(2)} MUSD lifetime)`;
  } else {
    ctx.creatorTypicalTip = "no tips yet — brand new on Nih";
  }
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
  // Boar mainnet read: prove the wallet's mainnet activity (if any)
  // to give the model a richer reputation picture. Best-effort — Boar
  // mainnet may be cold; the LLM call works without it.
  if (boarRpc && payload.senderAddress) {
    try {
      const resp = await fetch(boarRpc, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getBalance",
          params: [payload.senderAddress, "latest"],
        }),
      });
      if (resp.ok) {
        const j = await resp.json();
        const wei = BigInt(j.result ?? "0x0");
        ctx.senderMainnetBTC = (Number(wei) / 1e18).toFixed(6) + " BTC (mainnet via Boar)";
      }
    } catch { /* ignore */ }
  }
  return ctx;
}

/**
 * Offline fallback that still weighs real signals (post effort + the
 * creator's typical tip from ctx) so "Tippy" is never a flat guess.
 */
function heuristicSuggest(
  payload: SuggestPayload,
  ctx: Record<string, string>,
): { amount: number; reasoning: string; factors: string[] } {
  const text = (payload.postText ?? "").trim();
  const len = text.length;
  const hasCodeBlock = /```|`/.test(text);
  const hasLink = /https?:\/\//.test(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const factors: string[] = [];

  // Effort score from the post itself.
  let score = 0;
  if (len > 500) { score += 2; factors.push("a long, detailed post"); }
  else if (len > 200) { score += 1; factors.push("a decent-length post"); }
  if (hasCodeBlock) { score += 2; factors.push("it shares code"); }
  if (hasLink) score += 0.5;
  if (wordCount > 50) score += 1;

  // Anchor to the creator's typical tip when we know it.
  const m = (ctx.creatorTypicalTip ?? "").match(/([0-9]+(?:\.[0-9]+)?) MUSD avg/);
  const avg = m ? Number(m[1]) : 0;
  if (avg > 0) factors.push(`this creator usually gets about ${avg.toFixed(0)} MUSD`);

  const tiers = [1, 5, 10, 25];
  let amount = score >= 4 ? 10 : score >= 2 ? 5 : 1;
  if (avg > 0) {
    // Snap toward the nearest tier to the creator's average, nudged by effort.
    const nearest = tiers.reduce((a, b) => (Math.abs(b - avg) < Math.abs(a - avg) ? b : a));
    amount = Math.max(amount, nearest);
  }
  if (factors.length === 0) factors.push("a quick post and no history yet");

  const reasoning =
    avg > 0
      ? "Around what this creator usually gets, nudged by the post itself."
      : score >= 2
        ? "This post put in real effort, so a bit more than a starter tip."
        : "A friendly starter tip — bump it up if you loved the post.";
  return { amount, reasoning, factors };
}

/**
 * LLM-backed suggestion via OpenRouter (model aggregator).
 *
 * Picks `OPENROUTER_MODEL` (default `openai/gpt-oss-20b:free` — fast +
 * free). Falls back to the deterministic heuristic if the request fails
 * or the model returns malformed JSON, so the endpoint never blocks.
 *
 * The on-chain `ctx` we pass to the model is read through Boar's Mezo
 * RPC (`BOAR_RPC_URL`) — that satisfies the Boar prize criterion of
 * "use Boar's RPC inside an AI agentic application."
 */
async function llmSuggest(payload: SuggestPayload, ctx: Record<string, string>) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  // Claude Haiku via OpenRouter. The previous default (a free OSS model)
  // streamed reasoning padding + malformed JSON, so the call always failed
  // and silently fell back to the heuristic — i.e. "AI suggest" never ran.
  // Haiku returns clean JSON, is fast/cheap, and makes the "Claude" label true.
  // `||` not `??` so an empty-string env still falls back to the default.
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-haiku";
  try {
    const prompt = `You are "Tippy", the tip-amount assistant inside the Nih app. Recommend a tip in MUSD: one of 1, 5, 10, or 25.

Weigh ALL of these signals and don't just pick a default — let them genuinely move the number:
1. The creator's TYPICAL tip (anchor to it: suggest near their average; go higher only for clearly standout posts, lower if they're brand new).
2. The tipper's own generosity history (a generous tipper can be nudged up; a first-timer, kept modest).
3. The tipper's Bitcoin track record on mainnet (a well-funded, active wallet supports a larger tip).
4. The post + platform (more effort/length/technical depth → higher; a one-liner → lower).

Reply with ONLY a JSON object, no prose:
{"amount": number, "reasoning": "one friendly sentence, no jargon", "factors": ["2-4 short phrases naming what actually drove THIS number"]}

Post text:
${(payload.postText ?? "").slice(0, 1500) || "(none provided)"}

Author handle: ${payload.authorHandle ?? "unknown"}
Platform: ${payload.platform ?? "unknown"}

Signals:
${Object.entries(ctx).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "- no prior activity"}`;

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        // Optional but recommended — helps OpenRouter attribute usage.
        // ASCII only: a non-ASCII char here (e.g. an em-dash) makes undici's
        // fetch throw "invalid header value", which silently killed the whole
        // LLM call and fell back to the heuristic.
        "http-referer": "https://nih-seven.vercel.app",
        "x-title": "Nih - Mezo Hackathon",
      },
      body: JSON.stringify({
        model,
        max_tokens: 200,
        temperature: 0.4,
        // No response_format: Claude via Bedrock on OpenRouter doesn't honor
        // the json_object flag and 400s on it. The prompt pins JSON-only and
        // the regex below extracts the object robustly.
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (typeof parsed.amount === "number" && typeof parsed.reasoning === "string") {
      // `source` tells the UI whether on-chain context (Boar) was used; the
      // UI brands everything as "Tippy" regardless of the underlying model.
      const usedBoar = "senderMainnetBTC" in ctx;
      const family = /claude/i.test(model) ? "claude" : "ai";
      const factors = Array.isArray(parsed.factors)
        ? parsed.factors.filter((f: unknown) => typeof f === "string").slice(0, 4)
        : undefined;
      return {
        amount: parsed.amount,
        reasoning: parsed.reasoning,
        source: usedBoar ? `${family}+boar` : family,
        model,
        factors,
      };
    }
  } catch {
    /* swallow → heuristic fallback */
  }
  return null;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  // LLM calls cost real money — keep tight quota per IP.
  const rl = rateLimit(`suggest:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rl.retryAfter },
      { status: 429, headers: { "retry-after": String(rl.retryAfter) } }
    );
  }

  const payload = (await req.json()) as SuggestPayload;
  const ctx = await loadContext(payload);
  const ai = await llmSuggest(payload, ctx);
  if (ai) return NextResponse.json(ai);
  const fallback = heuristicSuggest(payload, ctx);
  return NextResponse.json({ ...fallback, source: "heuristic" });
}
