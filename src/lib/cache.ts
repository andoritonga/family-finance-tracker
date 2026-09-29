interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

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

  set<T>(key: string, data: T, ttlSeconds: number = 45): void {
    memoryCache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
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
