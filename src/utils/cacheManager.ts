/**
 * Section 8: LocalStorage cache manager
 * Maximum age: 24 hours (86,400,000 ms)
 * Namespaced keys: multi_tools:cache:v1:<tool-id>:<input-hash>
 */

const CACHE_PREFIX = 'multi_tools:cache:v1:';
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ITEM_SIZE_BYTES = 50 * 1024; // 50 KB limit per entry to prevent quota exhaustion

export interface CacheEntry<T = any> {
  version: 'v1';
  toolId: string;
  inputHash: string;
  data: T;
  createdAt: number;
}

// Sensitive tools that MUST NOT be cached in localStorage by default
const SENSITIVE_TOOL_IDS = new Set([
  'password-generator',
  'jwt-decoder',
  'qr-wifi-contact',
]);

/**
 * Generate a simple deterministic hash of any string input
 */
export function hashInput(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Store a result in localStorage adhering to PRD security and expiration rules.
 */
export function setCachedResult<T>(toolId: string, inputKey: string, data: T): boolean {
  if (SENSITIVE_TOOL_IDS.has(toolId)) {
    // Security exception: never cache sensitive tool data
    return false;
  }

  try {
    const inputHash = hashInput(inputKey);
    const storageKey = `${CACHE_PREFIX}${toolId}:${inputHash}`;
    const entry: CacheEntry<T> = {
      version: 'v1',
      toolId,
      inputHash,
      data,
      createdAt: Date.now(),
    };

    const serialized = JSON.stringify(entry);
    if (new Blob([serialized]).size > MAX_ITEM_SIZE_BYTES) {
      console.warn(`[Cache] Result too large to cache in localStorage (${toolId})`);
      return false;
    }

    localStorage.setItem(storageKey, serialized);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('multi_tools:cache_update'));
    }
    return true;
  } catch (err) {
    console.warn('[Cache] Could not write to localStorage (quota exceeded or restricted):', err);
    return false;
  }
}

/**
 * Read cached result. If expired (>24 hours) or corrupted, immediately delete and return null.
 */
export function getCachedResult<T>(toolId: string, inputKey: string): T | null {
  if (SENSITIVE_TOOL_IDS.has(toolId)) {
    return null;
  }

  const inputHash = hashInput(inputKey);
  const storageKey = `${CACHE_PREFIX}${toolId}:${inputHash}`;

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    const now = Date.now();

    // Check expiration: must not exceed 24 hours
    if (!entry.createdAt || now - entry.createdAt > MAX_CACHE_AGE_MS) {
      localStorage.removeItem(storageKey);
      return null;
    }

    return entry.data;
  } catch (err) {
    localStorage.removeItem(storageKey);
    return null;
  }
}

/**
 * Clean up all expired entries across the entire app
 */
export function pruneExpiredCacheEntries(): number {
  let prunedCount = 0;
  const now = Date.now();
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const entry: CacheEntry = JSON.parse(raw);
          if (!entry.createdAt || now - entry.createdAt > MAX_CACHE_AGE_MS) {
            keysToRemove.push(key);
          }
        }
      } catch {
        keysToRemove.push(key);
      }
    }
  }

  keysToRemove.forEach((k) => {
    localStorage.removeItem(k);
    prunedCount++;
  });

  return prunedCount;
}

/**
 * Clear all multi_tools cached entries explicitly (User Action)
 */
export function clearAllToolCache(): number {
  let removedCount = 0;
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((k) => {
    localStorage.removeItem(k);
    removedCount++;
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('multi_tools:cache_update'));
  }

  return removedCount;
}

/**
 * Get count and approximate size of active multi_tools cache entries
 */
export function getCacheStats(): { count: number; totalSizeBytes: number } {
  let count = 0;
  let totalSizeBytes = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      const val = localStorage.getItem(key);
      if (val) {
        count++;
        totalSizeBytes += key.length + val.length;
      }
    }
  }

  return { count, totalSizeBytes };
}
