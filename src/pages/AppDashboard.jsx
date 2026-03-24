import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, formatDistanceStrict } from 'date-fns';

import { apiFetch } from '../utils/apiFetch.js';

const RANGES = [
  { label: '7D',      value: '7d'  },
  { label: '14D',     value: '14d' },
  { label: '30D',     value: '30d' },
  { label: 'OVERALL', value: 'all' },
];

const STATUS_CONFIG = {
  running: { color: 'var(--green)', bg: 'var(--green-dim)',  label: 'RUNNING', pulse: true  },
  done:    { color: 'var(--green)', bg: 'var(--green-dim)',  label: 'DONE',    pulse: false },
  failed:  { color: 'var(--red)',   bg: 'var(--red-dim)',    label: 'FAILED',  pulse: false },
  pending: { color: 'var(--text-muted)', bg: 'transparent', label: 'PENDING', pulse: false },
};

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, sublabel, accent, info }) {
  const [tooltipPos, setTooltipPos] = useState(null);
  return (
    <div style={{
      flex: 1,
      minWidth: 160,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10,
          letterSpacing: 1.4,
          color: 'var(--text-muted)',
          fontWeight: 500,
        }}>
          {label}
        </span>
        {info && (
          <div style={{ flexShrink: 0 }}>
            <span
              onMouseEnter={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setTooltipPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
              }}
              onMouseLeave={() => setTooltipPos(null)}
              style={{
                width: 14, height: 14, borderRadius: '50%',
                border: '1px solid var(--text-muted)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, color: 'var(--text-muted)', cursor: 'default',
                userSelect: 'none', lineHeight: 1, fontStyle: 'italic', fontWeight: 700,
              }}
            >i</span>
            {tooltipPos && (
              <div style={{
                position: 'fixed', top: tooltipPos.top, right: tooltipPos.right,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 4, padding: '7px 10px',
                fontSize: 10, color: 'var(--text-muted)',
                width: 210, zIndex: 9999, lineHeight: 1.6,
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
              }}>
                {info}
              </div>
            )}
          </div>
        )}
      </div>
      <span style={{
        fontSize: 28,
        fontWeight: 700,
        color: accent || 'var(--text)',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value ?? '—'}
      </span>
      {sublabel && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      border: `1px solid ${cfg.color}`,
      color: cfg.color,
      background: cfg.bg,
      fontSize: 9,
      fontWeight: 700,
      padding: '2px 7px',
      borderRadius: 2,
      letterSpacing: 1,
      whiteSpace: 'nowrap',
    }}>
      {cfg.pulse && (
        <span style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: cfg.color,
          animation: 'pulse-dot 1.4s ease-in-out infinite',
          flexShrink: 0,
        }} />
      )}
      {cfg.label}
    </span>
  );
}

// ─── Sort Icon ────────────────────────────────────────────────
function SortIcon({ col, sort, order }) {
  if (sort !== col) return <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}> ⇅</span>;
  return <span style={{ color: 'var(--green)' }}>{order === 'asc' ? ' ↑' : ' ↓'}</span>;
}

// ─── Main Component ───────────────────────────────────────────
export function AppDashboard({ onViewJobLogs }) {
  const [range, setRange]   = useState('7d');
  const [stats, setStats]   = useState(null);
  const [jobs,  setJobs]    = useState([]);
  const [page,  setPage]    = useState(1);
  const [pages, setPages]   = useState(1);
  const [total, setTotal]   = useState(0);
  const [sort,  setSort]    = useState('started_at');
  const [order, setOrder]   = useState('desc');
  const [loading, setLoading] = useState(false);

  const statsIntervalRef = useRef(null);

  // ── Fetch stats ────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res  = await apiFetch(`/api/stats?range=${range}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('[AppDashboard] stats fetch error:', err);
    }
  }, [range]);

  useEffect(() => {
    fetchStats();
    // Re-fetch stats every 15 s to keep "running" count live
    statsIntervalRef.current = setInterval(fetchStats, 15_000);
    return () => clearInterval(statsIntervalRef.current);
  }, [fetchStats]);

  // ── Fetch jobs table ───────────────────────────────────────
  const fetchJobs = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        range,
        page:  String(targetPage),
        limit: '15',
        sort,
        order,
      });
      const res  = await apiFetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs   || []);
      setPage(data.page   || 1);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('[AppDashboard] jobs fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [range, sort, order]);

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  // ── Sort toggle ────────────────────────────────────────────
  function handleSort(col) {
    if (sort === col) {
      setOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
    } else {
      setSort(col);
      setOrder('desc');
    }
    setPage(1);
  }

  // ── Duration helper ────────────────────────────────────────
  function getDuration(job) {
    if (job.status !== 'done' && job.status !== 'failed') return '—';
    try {
      return formatDistanceStrict(new Date(job.updated_at), new Date(job.created_at));
    } catch {
      return '—';
    }
  }

  const thStyle = (col) => ({
    padding: '8px 14px',
    textAlign: 'left',
    fontSize: 9,
    letterSpacing: 1.4,
    color: sort === col ? 'var(--green)' : 'var(--text-muted)',
    fontWeight: 600,
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--border)',
  });

  const tdStyle = {
    padding: '9px 14px',
    fontSize: 11,
    color: 'var(--text)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>

      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 11,
          letterSpacing: 1.6,
          color: 'var(--text-dim)',
          fontWeight: 600,
        }}>
          APP DASHBOARD
        </span>

        {/* Range selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map((r) => {
            const active = range === r.value;
            return (
              <button
                key={r.value}
                onClick={() => { setRange(r.value); setPage(1); }}
                style={{
                  padding: '0 12px',
                  height: 26,
                  background: active ? 'var(--surface-3)' : 'transparent',
                  border: `1px solid ${active ? 'var(--text-dim)' : 'var(--border)'}`,
                  borderRadius: 3,
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 10,
                  fontWeight: active ? 700 : 400,
                  letterSpacing: 0.8,
                  cursor: 'pointer',
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard
          label="TOTAL REQUESTS"
          value={stats ? stats.total_requests.toLocaleString() : '…'}
          sublabel={`last ${range === 'all' ? 'all time' : range}`}
          info="Total scrape jobs submitted in the selected time range, regardless of outcome."
        />
        <StatCard
          label="CURRENTLY RUNNING"
          value={stats ? stats.running.toLocaleString() : '…'}
          sublabel="always live"
          accent="var(--green)"
          info="Jobs actively running right now. Always live — not filtered by the date range selector."
        />
        <StatCard
          label="COMPLETED"
          value={stats ? stats.completed.toLocaleString() : '…'}
          sublabel={`last ${range === 'all' ? 'all time' : range}`}
          accent="var(--green)"
          info="Jobs that finished successfully (status = done) in the selected range."
        />
        <StatCard
          label="FAILED"
          value={stats ? stats.failed.toLocaleString() : '…'}
          sublabel={`last ${range === 'all' ? 'all time' : range}`}
          accent={stats && stats.failed > 0 ? 'var(--red)' : undefined}
          info="Jobs that hit an unrecoverable error and stopped. Common causes: expired li_at cookie, LinkedIn 429 rate limit, or proxy failure."
        />
        <StatCard
          label="AVG CONNECTIONS"
          value={stats ? (stats.avg_connections || 0).toLocaleString() : '…'}
          sublabel="completed jobs"
          info="Mean number of LinkedIn connections scraped per successfully completed job."
        />
      </div>

      {/* ── Jobs table ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          padding: '10px 14px 8px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 10, letterSpacing: 1.4, color: 'var(--text-muted)', fontWeight: 600 }}>
            JOBS
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {total.toLocaleString()} total
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle(null)}>JOB ID</th>
                <th style={thStyle(null)}>USER</th>
                <th
                  style={thStyle('started_at')}
                  onClick={() => handleSort('started_at')}
                >
                  STARTED <SortIcon col="started_at" sort={sort} order={order} />
                </th>
                <th
                  style={thStyle('status')}
                  onClick={() => handleSort('status')}
                >
                  STATUS <SortIcon col="status" sort={sort} order={order} />
                </th>
                <th style={thStyle(null)}>DURATION</th>
                <th
                  style={{ ...thStyle('progress'), textAlign: 'center', minWidth: 120 }}
                  onClick={() => handleSort('progress')}
                >
                  CONNECTIONS <SortIcon col="progress" sort={sort} order={order} />
                </th>
                <th style={thStyle(null)}>ERROR</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '24px 14px' }}>
                    LOADING...
                  </td>
                </tr>
              )}
              {!loading && jobs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '24px 14px' }}>
                    NO JOBS FOUND
                  </td>
                </tr>
              )}
              {!loading && jobs.map((job) => (
                <tr
                  key={job.job_id}
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 10 }}>
                    {onViewJobLogs ? (
                      <span
                        onClick={() => onViewJobLogs(job.job_id)}
                        title={job.job_id}
                        style={{
                          color: 'var(--green)',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          textUnderlineOffset: 3,
                          textDecorationColor: 'var(--green)',
                          opacity: 0.85,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.85'}
                      >
                        {job.job_id.slice(0, 8)}…
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>{job.job_id.slice(0, 8)}…</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-dim)' }}>
                    {job.user_id || '—'}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {job.created_at
                      ? format(new Date(job.created_at), 'MMM d, HH:mm')
                      : '—'}
                  </td>
                  <td style={tdStyle}>
                    <StatusBadge status={job.status} />
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>
                    {getDuration(job)}
                  </td>
                  <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', textAlign: 'center', minWidth: 120 }}>
                    {job.progress > 0 ? job.progress.toLocaleString() : '—'}
                  </td>
                  <td style={{
                    ...tdStyle,
                    color: 'var(--red)',
                    maxWidth: 280,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: 10,
                  }}
                    title={job.error || ''}
                  >
                    {job.error || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '10px 16px',
            borderTop: '1px solid var(--border)',
          }}>
            <button
              onClick={() => fetchJobs(page - 1)}
              disabled={page <= 1}
              style={paginationBtn(page <= 1)}
            >
              ‹ PREV
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>
              {page} / {pages}
            </span>
            <button
              onClick={() => fetchJobs(page + 1)}
              disabled={page >= pages}
              style={paginationBtn(page >= pages)}
            >
              NEXT ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function paginationBtn(disabled) {
  return {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 3,
    color: disabled ? 'var(--text-muted)' : 'var(--text)',
    padding: '3px 12px',
    fontSize: 10,
    letterSpacing: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  };
}
