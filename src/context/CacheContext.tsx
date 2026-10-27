import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { clearAllToolCache, getCacheStats, pruneExpiredCacheEntries } from '../utils/cacheManager';

interface CacheContextType {
  stats: { count: number; totalSizeBytes: number };
  refreshStats: () => void;
  clearCache: () => number;
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
  }, [refreshStats]);

  const clearCache = useCallback(() => {
    const cleared = clearAllToolCache();
    refreshStats();
    return cleared;
  }, [refreshStats]);

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
