const cache = new Map();

export async function getCached(key, ttlMs, fetchFn) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.ts < ttlMs) {
        return entry.value;
    }
    const value = await fetchFn();
    cache.set(key, { value, ts: Date.now() });
    return value;
}

export function invalidateCache(prefix) {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}

export function clearCache() {
    cache.clear();
}
