type RateLimitEntry = {
  attempts: number;
  resetAt: number;
};

const rateLimits = new Map<string, RateLimitEntry>();
const maximumTrackedIdentifiers = 5_000;

function pruneExpiredEntries(now: number) {
  if (rateLimits.size < maximumTrackedIdentifiers) return;
  for (const [key, entry] of rateLimits) {
    if (entry.resetAt <= now) rateLimits.delete(key);
  }
  if (rateLimits.size >= maximumTrackedIdentifiers) {
    const oldestKey = rateLimits.keys().next().value as string | undefined;
    if (oldestKey) rateLimits.delete(oldestKey);
  }
}

export function consumeRateLimit(
  scope: string,
  identifier: string,
  limit = 5,
  windowMilliseconds = 15 * 60 * 1_000,
) {
  const now = Date.now();
  pruneExpiredEntries(now);
  const key = `${scope}:${identifier}`;
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { attempts: 1, resetAt: now + windowMilliseconds });
    return true;
  }

  if (current.attempts >= limit) return false;
  current.attempts += 1;
  return true;
}

export function clearRateLimit(scope: string, identifier: string) {
  rateLimits.delete(`${scope}:${identifier}`);
}
