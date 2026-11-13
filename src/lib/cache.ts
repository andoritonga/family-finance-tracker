interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  updatedAt: number;
}

const MAX_CACHE_ENTRIES = 200;
const memoryCache = new Map<string, CacheEntry<any>>();

export const cache = {
  get<T>(key: string): T | null {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return entry.data as T;
  },

  /**
   * Prevents ?refresh=true abuse from exhausting Google Sheets API quota (60 req/min).
   * Returns cached value if the key was refreshed within cooldownSeconds.
   */
  getRecentForRefresh<T>(key: string, cooldownSeconds: number = 10): T | null {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (now > entry.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    if (now - entry.updatedAt < cooldownSeconds * 1000) {
      return entry.data as T;
    }
    return null;
  },

  set<T>(key: string, data: T, ttlSeconds: number = 45): void {
    const now = Date.now();
    if (!memoryCache.has(key) && memoryCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey) memoryCache.delete(oldestKey);
    }
    memoryCache.set(key, {
      data,
      expiresAt: now + ttlSeconds * 1000,
      updatedAt: now,
    });
  },

  delete(key: string): void {
    memoryCache.delete(key);
  },

  invalidatePattern(pattern: RegExp | string): void {
    for (const key of memoryCache.keys()) {
      if (typeof pattern === 'string') {
        if (key.includes(pattern)) {
          memoryCache.delete(key);
        }
      } else if (pattern.test(key)) {
        memoryCache.delete(key);
      }
    }
  },

  clear(): void {
    memoryCache.clear();
  },
};
