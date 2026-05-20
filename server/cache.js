import { LRUCache } from 'lru-cache';

// In-memory cache for StatCan responses. Server restart wipes it; that's fine.
// DA boundaries + census variables change every 5 years, so 24h TTL is generous.
export const cache = new LRUCache({
  max: 2000,
  ttl: 1000 * 60 * 60 * 24, // 24h
});

/**
 * Wrap an async fetch in the cache. Key is typically the full URL.
 */
export async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const value = await fn();
  cache.set(key, value);
  return value;
}
