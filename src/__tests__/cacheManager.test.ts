import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  setCachedResult,
  getCachedResult,
  clearAllToolCache,
  pruneExpiredCacheEntries,
  hashInput,
} from '../utils/cacheManager';

// Mock localStorage for Node environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
  key: (i: number) => Object.keys(mockStorage)[i] || null,
  get length() {
    return Object.keys(mockStorage).length;
  },
};

describe('LocalStorage Cache Manager (PRD Section 8)', () => {
  beforeAll(() => {
    // @ts-ignore
    globalThis.localStorage = localStorageMock;
  });

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('correctly hashes inputs deterministically', () => {
    const h1 = hashInput('test-query-123');
    const h2 = hashInput('test-query-123');
    const h3 = hashInput('different-query');
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
  });

  it('stores and retrieves cacheable tool results', () => {
    const success = setCachedResult('calculator', 'history', ['2 + 2 = 4']);
    expect(success).toBe(true);

    const retrieved = getCachedResult<string[]>('calculator', 'history');
    expect(retrieved).toEqual(['2 + 2 = 4']);
  });

  it('enforces security exceptions: never caches passwords or JWTs', () => {
    const passResult = setCachedResult('password-generator', 'sample', 'SuperSecretPass!');
    expect(passResult).toBe(false);

    const jwtResult = setCachedResult('jwt-decoder', 'sample', 'eyJhbGciOi...');
    expect(jwtResult).toBe(false);

    expect(getCachedResult('password-generator', 'sample')).toBeNull();
    expect(getCachedResult('jwt-decoder', 'sample')).toBeNull();
  });

  it('expires and purges entries older than 24 hours', () => {
    // Manually inject entry created 25 hours ago
    const expiredCreatedAt = Date.now() - 25 * 60 * 60 * 1000;
    const key = `multi_tools:cache:v1:word-counter:${hashInput('old-text')}`;
    const payload = {
      version: 'v1',
      toolId: 'word-counter',
      inputHash: hashInput('old-text'),
      data: 'Sample Word Count Text',
      createdAt: expiredCreatedAt,
    };
    localStorageMock.setItem(key, JSON.stringify(payload));

    // Reading should return null and delete it
    const res = getCachedResult('word-counter', 'old-text');
    expect(res).toBeNull();
    expect(localStorageMock.getItem(key)).toBeNull();
  });

  it('allows user to explicitly clear all tool cache', () => {
    setCachedResult('calculator', 'hist', ['1 + 1 = 2']);
    setCachedResult('word-counter', 'saved', 'Hello');

    const clearedCount = clearAllToolCache();
    expect(clearedCount).toBe(2);
    expect(getCachedResult('calculator', 'hist')).toBeNull();
  });
});
