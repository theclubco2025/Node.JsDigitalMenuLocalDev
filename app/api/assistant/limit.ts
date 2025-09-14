// In-memory rate limiter and circuit breaker per tenant (dev-safe)

type TenantState = {
  hits: number[] // timestamps (ms) of recent calls
  failures: number
  openedAt: number | null
}

const WINDOW_MS = 60_000 // 1 minute
const LIMIT = 10 // 10/min
const TRIP_AFTER = 3 // consecutive failures
const OPEN_MS = 60_000 // open for 60s

const state = new Map<string, TenantState>()

function getState(tenantId: string): TenantState {
  let s = state.get(tenantId)
  if (!s) {
    s = { hits: [], failures: 0, openedAt: null }
    state.set(tenantId, s)
  }
  return s
}

// Legacy simple variant removed (conflicted). Using unified implementation below.

const hits = new Map<string, { count: number; windowStart: number }>()
const trips = new Map<string, { open: boolean; openedAt: number; failures: number }>()

export function rateLimit(tenantId: string, maxPerMin = 10) {
  const now = Date.now()
  const winMs = 60_000
  const key = tenantId || 'unknown'
  const cur = hits.get(key) || { count: 0, windowStart: now }
  if (now - cur.windowStart > winMs) {
    cur.windowStart = now
    cur.count = 0
  }
  cur.count += 1
  hits.set(key, cur)
  return cur.count <= maxPerMin
}

export function circuitIsOpen(tenantId: string) {
  const st = trips.get(tenantId)
  if (!st) return false
  if (!st.open) return false
  const openFor = Date.now() - st.openedAt
  if (openFor > 60_000) {
    trips.set(tenantId, { open: false, openedAt: 0, failures: 0 })
    return false
  }
  return true
}

export function recordFailure(tenantId: string, threshold = 3) {
  const st = trips.get(tenantId) || { open: false, openedAt: 0, failures: 0 }
  st.failures += 1
  if (st.failures >= threshold) {
    st.open = true
    st.openedAt = Date.now()
    st.failures = 0
  }
  trips.set(tenantId, st)
}

export function recordSuccess(tenantId: string) {
  trips.set(tenantId, { open: false, openedAt: 0, failures: 0 })
}


