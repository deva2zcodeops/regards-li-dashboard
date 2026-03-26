import { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/apiFetch.js';

/**
 * Generic hook for a single authenticated GET request.
 * Re-fetches automatically whenever `url` changes.
 *
 * @param {string | null} url  Full API path including query string, e.g. `/api/geo?range=7d`.
 *                             Pass null / empty string to skip fetching.
 * @returns {{ data: any, loading: boolean, error: string | null }}
 */
export function useDataFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!cancelled) { setData(d); setLoading(false); }
      })
      .catch((e) => {
        if (!cancelled) { setError(e.message); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}
