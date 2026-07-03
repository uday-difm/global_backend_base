const ipRequests = new Map();

/**
 * Checks if a given IP address is within its request rate limits.
 * Uses a sliding-window filter over the last 1 second.
 *
 * @param {string} ip - Client IP address
 * @param {number} limitRps - Allowed requests per second
 * @returns {boolean} True if within limits, false if rate limited
 */
export function checkRateLimit(ip, limitRps = 60) {
  const now = Date.now();
  const oneSecondAgo = now - 1000;

  // Prevent memory leaks: if map grows too large, clear inactive entries
  if (ipRequests.size > 10000) {
    for (const [key, timestamps] of ipRequests.entries()) {
      const active = timestamps.filter((t) => t > oneSecondAgo);
      if (active.length === 0) {
        ipRequests.delete(key);
      } else {
        ipRequests.set(key, active);
      }
    }
  }

  let timestamps = ipRequests.get(ip) || [];
  timestamps = timestamps.filter((t) => t > oneSecondAgo);

  if (timestamps.length >= limitRps) {
    return false;
  }

  timestamps.push(now);
  ipRequests.set(ip, timestamps);
  return true;
}
