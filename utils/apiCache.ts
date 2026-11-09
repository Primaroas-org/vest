/**
 * Simple in-memory cache for API responses.
 * Uses stale-while-revalidate pattern:
 * - Returns cached data immediately if available
 * - Revalidates in background if data is stale
 * - Only shows loading state on first fetch
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>; // In-flight request deduplication
}

const cache = new Map<string, CacheEntry<any>>();

// Default TTL: 2 minutes
const DEFAULT_TTL_MS = 2 * 60 * 1000;

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  return entry.data;
}

export function isCacheValid(key: string, ttlMs: number = DEFAULT_TTL_MS): boolean {
  const entry = cache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < ttlMs;
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(keyOrPrefix: string): void {
  if (keyOrPrefix.endsWith('*')) {
    const prefix = keyOrPrefix.slice(0, -1);
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  } else {
    cache.delete(keyOrPrefix);
  }
}

/**
 * Fetch with caching. Returns cached data immediately if valid,
 * otherwise fetches fresh data.
 * 
 * If data is cached but stale, returns stale data and revalidates in background.
 */
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: { ttlMs?: number; forceRefresh?: boolean } = {}
): Promise<T> {
  const { ttlMs = DEFAULT_TTL_MS, forceRefresh = false } = options;

  // Return fresh cache
  if (!forceRefresh && isCacheValid(key, ttlMs)) {
    return getCached<T>(key)!;
  }

  // Deduplicate in-flight requests
  const entry = cache.get(key);
  if (entry?.promise) {
    return entry.promise;
  }

  // If we have stale data, return it immediately and revalidate in background
  const staleData = getCached<T>(key);

  const promise = fetchFn().then(data => {
    setCache(key, data);
    // Clear the in-flight promise
    const currentEntry = cache.get(key);
    if (currentEntry) {
      delete currentEntry.promise;
    }
    return data;
  }).catch(error => {
    // Clear the in-flight promise on error
    const currentEntry = cache.get(key);
    if (currentEntry) {
      delete currentEntry.promise;
    }
    throw error;
  });

  // Store the in-flight promise for deduplication
  if (entry) {
    entry.promise = promise;
  } else {
    cache.set(key, { data: staleData, timestamp: 0, promise });
  }

  // If we have stale data, return it and let the background fetch update the cache
  if (staleData !== null && !forceRefresh) {
    // Don't await - let it update in the background
    promise.catch(() => {}); // Prevent unhandled rejection
    return staleData;
  }

  return promise;
}

/**
 * React hook helper: creates a stable cache key from components
 */
export function makeCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(':');
}

// Invalidate all dashboard caches (e.g., after investment)
export function invalidateDashboardCache(): void {
  invalidateCache('dashboard:*');
}
