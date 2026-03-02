import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'

type Window = '10 s' | '30 s' | '1 m' | '5 m' | '15 m' | '1 h' | '1 d'

export type RateLimitResult =
  | { ok: true }
  | {
      ok: false
      retryAfterSeconds: number
      limit: number
      remaining: number
      resetMs: number
      key: string
      rule: string
    }

let _redis: Redis | null | undefined
const _limiters = new Map<string, Ratelimit>()

function redisOrNull(): Redis | null {
  if (_redis !== undefined) return _redis
  const url = String(process.env.UPSTASH_REDIS_REST_URL || '').trim()
  const token = String(process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
  if (!url || !token) {
    _redis = null
    return _redis
  }
  _redis = Redis.fromEnv()
  return _redis
}

function getLimiter(rule: string, limit: number, window: Window): Ratelimit | null {
  const redis = redisOrNull()
  if (!redis) return null
  const k = `${rule}:${limit}:${window}`
  const existing = _limiters.get(k)
  if (existing) return existing
  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
    prefix: `rl:${rule}`,
  })
  _limiters.set(k, rl)
  return rl
}

export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

export async function checkRateLimit(args: {
  rule: string
  key: string
  limit: number
  window: Window
}): Promise<RateLimitResult> {
  const { rule, key, limit, window } = args
  const limiter = getLimiter(rule, limit, window)
  if (!limiter) return { ok: true } // allow if Upstash not configured (local dev / misconfig)

  const r = await limiter.limit(key)
  if (r.success) return { ok: true }

  const now = Date.now()
  const resetMs = typeof r.reset === 'number' ? r.reset : now + 30_000
  const retryAfterSeconds = Math.max(1, Math.ceil((resetMs - now) / 1000))
  return {
    ok: false,
    retryAfterSeconds,
    limit: r.limit,
    remaining: r.remaining,
    resetMs,
    key,
    rule,
  }
}

