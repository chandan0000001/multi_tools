import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { clearAllToolCache, getCacheStats, pruneExpiredCacheEntries } from '../utils/cacheManager';

export interface CachePurgeResult {
  count: number;
  freedBytes: number;
}

interface CacheContextType {
  stats: { count: number; totalSizeBytes: number };
  refreshStats: () => void;
  clearCache: () => CachePurgeResult;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState({ count: 0, totalSizeBytes: 0 });

  const refreshStats = useCallback(() => {
    setStats(getCacheStats());
  }, []);

  useEffect(() => {
    // Prune any expired cache entries (>24 hours) immediately on mount
    pruneExpiredCacheEntries();
    refreshStats();

    const handleUpdate = () => {
      refreshStats();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('multi_tools:cache_update', handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('multi_tools:cache_update', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, [refreshStats]);

  const clearCache = useCallback((): CachePurgeResult => {
    const bytesBefore = stats.totalSizeBytes;
    const cleared = clearAllToolCache();
    refreshStats();
    return { count: cleared, freedBytes: bytesBefore };
  }, [stats.totalSizeBytes, refreshStats]);

  return (
    <CacheContext.Provider value={{ stats, refreshStats, clearCache }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const ctx = useContext(CacheContext);
  if (!ctx) throw new Error('useCache must be used within CacheProvider');
  return ctx;
};
