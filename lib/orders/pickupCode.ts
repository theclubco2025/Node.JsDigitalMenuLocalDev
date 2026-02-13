export function computePickupCode(orderId: string): string {
  // Deterministic 6-digit code derived from orderId (no extra DB column needed).
  let h = 2166136261
  for (let i = 0; i < orderId.length; i++) {
    h ^= orderId.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const n = Math.abs(h) % 1_000_000
  return String(n).padStart(6, '0')
}

