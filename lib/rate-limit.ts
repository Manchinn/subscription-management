const attempts = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // cleanup every 5 minutes
const MAX_ENTRIES = 10000

let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of attempts) {
    if (now > entry.resetAt) attempts.delete(key)
  }
  // Hard cap to prevent unbounded growth
  if (attempts.size > MAX_ENTRIES) {
    const entries = [...attempts.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt)
    for (let i = 0; i < entries.length - MAX_ENTRIES; i++) {
      attempts.delete(entries[i][0])
    }
  }
}

export function isRateLimited(key: string): { blocked: boolean; retryAfterMs: number } {
  cleanup()
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    return { blocked: false, retryAfterMs: 0 }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { blocked: true, retryAfterMs: entry.resetAt - now }
  }

  return { blocked: false, retryAfterMs: 0 }
}

export function recordFailedAttempt(key: string): void {
  cleanup()
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }

  entry.count++
}

export function resetRateLimit(key: string): void {
  attempts.delete(key)
}
