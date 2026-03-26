import React, { useEffect, useCallback } from 'react';
import { format } from 'date-fns';

import { useJobsList } from '@/hooks/useJobsList.js';

const STATUS_CONFIG = {
  running: { color: 'var(--green)',      symbol: '◉', pulse: true  },
  done:    { color: 'var(--green)',      symbol: '✓', pulse: false },
  failed:  { color: 'var(--red)',        symbol: '✕', pulse: false },
  pending: { color: 'var(--text-muted)', symbol: '◌', pulse: false },
};

export function JobsSidebar({ selectedJobId, onSelectJob, range, statusFilter, search, isMobile, mobileOpen, onMobileClose }) {
  const { jobs, loading, hasMore, scrollRef, handleScroll } = useJobsList({ range, search });

  const visibleJobs = statusFilter && statusFilter !== 'ALL'
    ? jobs.filter((job) => job.status === statusFilter)
    : jobs;

  // Clear stale selection when the selected job is no longer in the visible list.
  useEffect(() => {
    if (!selectedJobId || loading || jobs.length === 0) return;
    const visible = statusFilter && statusFilter !== 'ALL'
      ? jobs.filter((j) => j.status === statusFilter)
      : jobs;
    if (!visible.find((j) => j.job_id === selectedJobId)) {
      onSelectJob('');
    }
  }, [jobs, statusFilter, selectedJobId, loading, onSelectJob]);

  // ── Shared job list content ────────────────────────────────
  const jobListContent = (
    <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto' }}>
      {visibleJobs.length === 0 && !loading && (
        <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 11, textAlign: 'center' }}>
          NO JOBS FOUND
        </div>
      )}
      {visibleJobs.map((job) => {
        const cfg        = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
        const isSelected = job.job_id === selectedJobId;
        const shortId    = `job_${job.job_id.slice(0, 8)}...`;

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
                  {format(new Date(job.created_at), 'dd MMM, HH:mm')}
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
  );

  // ── Mobile: drawer overlay ─────────────────────────────────
  if (isMobile) {
    if (!mobileOpen) return null;
    return (
      <>
        <div
          onClick={onMobileClose}
          style={{
            position: 'fixed', inset: 0, top: 'var(--header-height)',
            background: 'rgba(0,0,0,0.6)', zIndex: 40,
          }}
        />
        <div style={{
          position: 'fixed', left: 0, top: 'var(--header-height)', bottom: 0,
          width: '80vw', maxWidth: 300,
          background: 'var(--surface)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 50,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px 6px', borderBottom: '1px solid var(--border)', flexShrink: 0,
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1.5 }}>ACTIVE JOBS</span>
            <button
              onClick={onMobileClose}
              style={{
                background: 'transparent', border: 'none', color: 'var(--text-dim)',
                cursor: 'pointer', fontSize: 14, padding: '0 4px', lineHeight: 1, fontFamily: 'inherit',
              }}
            >
              ✕
            </button>
          </div>
          {jobListContent}
        </div>
      </>
    );
  }

  // ── Desktop ────────────────────────────────────────────────
  return (
    <div style={{
      width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)',
      borderRight: '1px solid var(--border)', background: 'var(--surface)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 16px 6px',
        color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1.5,
        borderBottom: '1px solid var(--border)',
      }}>
        ACTIVE JOBS
      </div>
      {jobListContent}
    </div>
  );
}
