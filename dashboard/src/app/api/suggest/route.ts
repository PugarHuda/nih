import { NextRequest, NextResponse } from "next/server";

/**
 * AI-powered tip suggestion endpoint.
 *
 * Given a context (post text, author handle, sender history), returns a
 * suggested tip amount in MUSD plus a short reasoning string.
 *
 * Wire-up:
 *  - In production, this would call Claude SDK with Boar Blockchain MCP tools attached
 *    so the model can inspect on-chain reputation, prior tips received, and the
 *    sender's typical generosity. For the hackathon scaffold, we return a
 *    deterministic heuristic that reads like an LLM rationale.
 *  - Replace `heuristicSuggest` with a Claude SDK call when ANTHROPIC_API_KEY is set.
 */

interface SuggestPayload {
  postText?: string;
  authorHandle?: string;
  senderAddress?: string;
  platform?: string;
}

function heuristicSuggest(payload: SuggestPayload): { amount: number; reasoning: string } {
  const text = (payload.postText ?? "").trim();
  const len = text.length;
  const hasCodeBlock = /```|`/.test(text);
  const hasNumbers = /\d+/.test(text);
  const hasLink = /https?:\/\//.test(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Heuristic scoring
  let score = 0;
  if (len > 500) score += 2;           // long-form
  else if (len > 200) score += 1;
  if (hasCodeBlock) score += 2;        // technical
  if (hasNumbers) score += 0.5;         // data-driven
  if (hasLink) score += 0.5;
  if (wordCount > 50) score += 1;

  let amount: number;
  let reasoning: string;
  if (score >= 4) {
    amount = 10;
    reasoning = "Long technical post — substantive contribution. Recommended tip: 10 MUSD.";
  } else if (score >= 2) {
    amount = 5;
    reasoning = "Solid post with depth. Recommended tip: 5 MUSD.";
  } else if (score >= 1) {
    amount = 1;
    reasoning = "Light post — encouragement tip. Recommended: 1 MUSD.";
  } else {
    amount = 1;
    reasoning = "Default starter tip. Recommended: 1 MUSD.";
  }

  return { amount, reasoning };
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as SuggestPayload;

  if (process.env.ANTHROPIC_API_KEY) {
    // TODO: Claude SDK call with Boar MCP tools attached.
    // Returns same shape as heuristic so caller code is unaffected.
  }

  return NextResponse.json(heuristicSuggest(payload));
}
