type RateLimitEntry = {
  attempts: number;
  resetAt: number;
};

const rateLimits = new Map<string, RateLimitEntry>();

export function consumeRateLimit(
  scope: string,
  identifier: string,
  limit = 5,
  windowMilliseconds = 15 * 60 * 1_000,
) {
  const now = Date.now();
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
