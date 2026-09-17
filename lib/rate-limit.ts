// Distributed rate limiting for public form submissions.
//
// The previous version of this file used an in-memory Map. That does NOT
// work on Vercel/serverless: each invocation can land on a different,
// short-lived instance with its own memory, so a spammer's requests mostly
// land in fresh buckets. This version uses Upstash Redis (a REST-based,
// serverless-friendly Redis) as the real shared counter, with an in-memory
// fallback ONLY so local development works without any setup.
//
// Required for real protection in production — set these two env vars
// (free tier at upstash.com is enough for this traffic level):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let limiter: Ratelimit | null = null;

if (hasUpstash) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    analytics: true,
    prefix: 'inquiry-rl',
  });
} else if (process.env.NODE_ENV === 'production') {
  // Loud on purpose: this is a real gap, not a style choice.
  // eslint-disable-next-line no-console
  console.warn(
    '[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set in production — ' +
      'falling back to a per-instance in-memory limiter, which does NOT ' +
      'protect a multi-instance serverless deployment. Set these before relying on rate limiting.'
  );
}

// In-memory fallback — local dev only, or an unconfigured deploy (better
// than nothing for a single long-running instance, not a real guarantee).
const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function isRateLimitedInMemory(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_PER_WINDOW;
}

export async function isRateLimited(key: string): Promise<boolean> {
  if (limiter) {
    const { success } = await limiter.limit(key);
    return !success;
  }
  return isRateLimitedInMemory(key);
}

// Rejects submissions that came in faster than a human could plausibly type
// the form. Pair with a hidden "form_rendered_at" timestamp field. Cheap,
// zero-dependency defense-in-depth layered under Turnstile below.
export function isSuspiciouslyFast(renderedAtMs: number, minMs = 1500): boolean {
  return Date.now() - renderedAtMs < minMs;
}
