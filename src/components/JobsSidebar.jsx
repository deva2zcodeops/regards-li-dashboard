import React, { useEffect, useState, useCallback, useRef } from 'react';
import { format } from 'date-fns';

import { apiFetch } from '../utils/apiFetch.js';

const STATUS_CONFIG = {
  running: { color: 'var(--green)',      symbol: '◉', pulse: true  },
  done:    { color: 'var(--green)',      symbol: '✓', pulse: false },
  failed:  { color: 'var(--red)',        symbol: '✕', pulse: false },
  pending: { color: 'var(--text-muted)', symbol: '◌', pulse: false },
};

const LIMIT = 15;

export function JobsSidebar({ selectedJobId, onSelectJob, range, statusFilter, search }) {
  const [jobs, setJobs]         = useState([]);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const scrollRef               = useRef(null);

  const fetchJobs = useCallback(async (targetPage, replace = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ range, page: String(targetPage), limit: String(LIMIT) });
      if (search && search.trim()) params.set('search', search.trim());
      const res  = await apiFetch(`/api/jobs?${params}`);
      const data = await res.json();
      const incoming = data.jobs || [];
      setJobs((prev) => replace ? incoming : [...prev, ...incoming]);
      setPage(targetPage);
      setHasMore(targetPage < (data.pages || 1));
    } catch (err) {
      console.error('[JobsSidebar] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [range, search, loading]);

  // Reset on range or search change
  useEffect(() => {
    setJobs([]);
    setPage(1);
    setHasMore(true);
    fetchJobs(1, true);
    // Only poll when not actively searching
    if (!search) {
      const interval = setInterval(() => fetchJobs(1, true), 15_000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, search]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      fetchJobs(page + 1);
    }
  }, [loading, hasMore, page, fetchJobs]);

  const visibleJobs = statusFilter && statusFilter !== 'ALL'
    ? jobs.filter((job) => job.status === statusFilter)
    : jobs;

  useEffect(() => {
    if (selectedJobId && !loading && jobs.length > 0 && !visibleJobs.find((j) => j.job_id === selectedJobId)) {
      onSelectJob('');
    }
  }, [visibleJobs, selectedJobId, onSelectJob, loading, jobs.length]);

  return (
    <div style={{
      width: 'var(--sidebar-width)',
      minWidth: 'var(--sidebar-width)',
      borderRight: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* Section label */}
      <div style={{
        padding: '8px 16px 6px',
        color: 'var(--text-muted)',
        fontSize: 10,
        letterSpacing: 1.5,
        borderBottom: '1px solid var(--border)',
      }}>
        ACTIVE JOBS
      </div>

      {/* Job list */}
      <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto' }}>
        {visibleJobs.length === 0 && !loading && (
          <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 11, textAlign: 'center' }}>
            NO JOBS FOUND
          </div>
        )}
        {visibleJobs.map((job) => {
          const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
          const isSelected = job.job_id === selectedJobId;
          const shortId = `job_${job.job_id.slice(0, 8)}...`;

          return (
            <div
              key={job.job_id}
              onClick={() => onSelectJob(isSelected ? '' : job.job_id)}
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--border)',
                background: isSelected ? 'var(--surface-3)' : 'transparent',
                borderLeft: isSelected ? '2px solid var(--green)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text)', fontSize: 12, letterSpacing: 0.5 }}>
                  {shortId}
                </span>
                <span style={{
                  color: cfg.color,
                  fontSize: 14,
                  lineHeight: 1,
                  animation: cfg.pulse ? 'pulse-dot 1.4s ease-in-out infinite' : 'none',
                }}>
                  {cfg.symbol}
                </span>
              </div>

              <div style={{
                marginTop: 3,
                fontSize: 10,
                letterSpacing: 0.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: 'var(--text-dim)' }}>{job.user_id?.toUpperCase()}</span>
                {job.created_at && (
                  <span style={{ color: 'var(--text-muted)' }}>
                    {format(new Date(job.created_at), 'HH:mm')}
                  </span>
                )}
              </div>

              {job.progress > 0 && (
                <div style={{ marginTop: 4, color: 'var(--green)', fontSize: 10, opacity: 0.7 }}>
                  {job.progress} connections
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 10, textAlign: 'center', letterSpacing: 1 }}>
            LOADING...
          </div>
        )}
        {!loading && !hasMore && jobs.length > 0 && (
          <div style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 10, textAlign: 'center', letterSpacing: 1, opacity: 0.5 }}>
            END
          </div>
        )}
      </div>
    </div>
  );
}
