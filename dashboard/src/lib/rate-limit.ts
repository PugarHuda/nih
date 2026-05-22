/**
 * Minimal in-memory rate limiter for API routes.
 *
 * Why not Upstash / Vercel KV? For this hackathon we run a single edge
 * function per region — token buckets fit in-process. When we scale out,
 * swap the Map for a KV store (`@vercel/kv`) with the same interface.
 *
 * Keys are typically `ip:route` so the same caller hitting two endpoints
 * gets independent quotas.
 */
interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Max requests per `windowMs`. */
  limit: number;
  /** Window length in ms. */
  windowMs: number;
}

export function rateLimit(key: string, { limit, windowMs }: RateLimitOptions): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: limit, lastRefill: now };

  // Refill linearly based on elapsed time.
  const elapsed = now - bucket.lastRefill;
  const refill = (elapsed / windowMs) * limit;
  bucket.tokens = Math.min(limit, bucket.tokens + refill);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    const retryAfter = Math.ceil(((1 - bucket.tokens) * windowMs) / limit / 1000);
    buckets.set(key, bucket);
    return { ok: false, remaining: 0, retryAfter };
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { ok: true, remaining: Math.floor(bucket.tokens), retryAfter: 0 };
}

export function clientIp(req: Request): string {
  // Vercel populates these headers; fall back to a constant in dev.
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local"
  );
}
