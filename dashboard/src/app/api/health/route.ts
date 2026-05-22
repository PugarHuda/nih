import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { matsnet } from "@/lib/chain";
import { addresses } from "@/lib/contracts";

/**
 * Health check — verifies the dashboard can talk to the RPC and the
 * Router contract is reachable. Used by uptime monitors and the demo
 * pre-flight checklist.
 */
export async function GET() {
  const started = Date.now();
  const result: Record<string, unknown> = {
    status: "ok",
    chainId: matsnet.id,
    contracts: addresses,
  };

  try {
    const client = createPublicClient({
      chain: matsnet,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.test.mezo.org"),
    });
    const block = await client.getBlockNumber();
    result.latestBlock = Number(block);
    result.rpcLatencyMs = Date.now() - started;
  } catch (err) {
    result.status = "degraded";
    result.error = (err as Error).message;
    return NextResponse.json(result, { status: 503 });
  }

  return NextResponse.json(result, {
    headers: { "cache-control": "no-store" },
  });
}
