import { useState, useCallback, useEffect, useRef } from 'react';
import { apiFetch } from '@/utils/apiFetch.js';
import { POLL_INTERVAL_MS, JOBS_PER_PAGE } from '@/constants.js';

/**
 * Manages the sidebar job list: initial fetch, polling for new jobs,
 * and infinite-scroll pagination.
 *
 * @param {{ range: string, search: string }} params
 * @returns {{ jobs, loading, hasMore, scrollRef, handleScroll }}
 */
export function useJobsList({ range, search }) {
  const [jobs, setJobs]       = useState([]);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const fetchJobs = useCallback(async (targetPage, replace = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        range,
        page: String(targetPage),
        limit: String(JOBS_PER_PAGE),
      });
      if (search?.trim()) params.set('search', search.trim());

      const res  = await apiFetch(`/api/jobs?${params}`);
      const data = await res.json();
      const incoming = data.jobs || [];

      setJobs((prev) => replace ? incoming : [...prev, ...incoming]);
      setPage(targetPage);
      setHasMore(targetPage < (data.pages || 1));
    } catch (err) {
      console.error('[useJobsList] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [range, search, loading]); // loading intentionally included as a guard

  // Reset and re-fetch on range / search change; poll when idle.
  useEffect(() => {
    setJobs([]);
    setPage(1);
    setHasMore(true);
    fetchJobs(1, true);

    if (!search) {
      const id = setInterval(() => fetchJobs(1, true), POLL_INTERVAL_MS);
      return () => clearInterval(id);
    }
  }, [range, search]); // fetchJobs intentionally omitted — re-creating the interval when loading changes would break polling

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      fetchJobs(page + 1);
    }
  }, [loading, hasMore, page, fetchJobs]);

  return { jobs, loading, hasMore, scrollRef, handleScroll };
}
