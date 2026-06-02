const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const attempts = new Map<string, { count: number; resetAt: number }>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now >= entry.resetAt) {
      attempts.delete(key);
    }
  }
}

export function rateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  cleanup();

  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now >= entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  return { allowed: true, retryAfterMs: 0 };
}
