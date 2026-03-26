import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/utils/apiFetch.js';
import { endpoints } from '@/api.js';
import { POLL_INTERVAL_MS } from '@/constants.js';

/**
 * Polls `/api/stats` every POLL_INTERVAL_MS and returns the latest value.
 * Re-fetches immediately when `range` changes.
 *
 * @param {string} range  One of '7d' | '14d' | '30d' | 'all'.
 * @returns {object | null}  The stats payload, or null while loading.
 */
export function useAppStats(range) {
  const [stats, setStats] = useState(null);
  const intervalRef = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      const res  = await apiFetch(endpoints.stats(range));
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('[useAppStats] fetch error:', err);
    }
  }, [range]);

  useEffect(() => {
    fetchStats();
    intervalRef.current = setInterval(fetchStats, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchStats]);

  return stats;
}
