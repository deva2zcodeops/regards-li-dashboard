import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { apiFetch } from '../utils/apiFetch.js';

const LEVEL_COLORS = {
  ERROR:   'var(--red)',
  WARNING: '#ffb74d',
  INFO:    'var(--text-dim)',
};

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Log row ──────────────────────────────────────────────────
function ViewerRow({ log }) {
  const color = LEVEL_COLORS[log.level] || 'var(--text-muted)';
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '170px 65px 180px 1fr',
      gap: '0 12px',
      padding: '4px 16px',
      fontSize: 11,
      borderBottom: '1px solid var(--border)',
      fontFamily: 'monospace',
    }}>
      <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {log.timestamp ? format(new Date(log.timestamp), 'MMM d HH:mm:ss.SSS') : '—'}
      </span>
      <span style={{ color, fontWeight: 700, letterSpacing: 0.5 }}>{log.level}</span>
      <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {log.logger || '—'}
      </span>
      <span style={{ color: 'var(--text)', wordBreak: 'break-word' }}>{log.message}</span>
    </div>
  );
}

// ─── Log viewer modal ─────────────────────────────────────────
function ViewerModal({ archive, onClose }) {
  const [logs,          setLogs]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [viewerSearch,  setViewerSearch]  = useState('');
  const [viewerLevel,   setViewerLevel]   = useState('ALL');

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/archives/${archive.job_id}/view`)
      .then((r) => r.json())
      .then((d) => setLogs(d.logs || []))
      .catch((err) => console.error('[ViewerModal]', err))
      .finally(() => setLoading(false));
  }, [archive.job_id]);

  const filtered = logs.filter((log) => {
    if (viewerLevel !== 'ALL' && log.level !== viewerLevel) return false;
    if (viewerSearch && !log.message?.toLowerCase().includes(viewerSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{
      position:   'fixed',
      inset:      0,
      zIndex:     1000,
      background: 'rgba(0,0,0,0.65)',
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width:          '90vw',
        height:         '88vh',
        background:     'var(--surface)',
        border:         '1px solid var(--border)',
        borderRadius:   4,
        display:        'flex',
        flexDirection:  'column',
        overflow:       'hidden',
      }}>

        {/* Modal header */}
        <div style={{
          padding:        '10px 16px',
          borderBottom:   '1px solid var(--border)',
          display:        'flex',
          alignItems:     'center',
          gap:            12,
          flexShrink:     0,
          background:     'var(--surface-2)',
        }}>
          <span style={{ fontSize: 10, letterSpacing: 1.4, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            VIEWING
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--green)' }}>
            {archive.job_id}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {archive.user_id}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {archive.triggered_at ? format(new Date(archive.triggered_at), 'MMM d yyyy, HH:mm') : ''}
          </span>

          {/* Level filter */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
            {['ALL', 'INFO', 'WARNING', 'ERROR'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setViewerLevel(lvl)}
                style={{
                  background:    viewerLevel === lvl ? 'var(--surface-3)' : 'transparent',
                  border:        `1px solid ${viewerLevel === lvl ? 'var(--text-dim)' : 'var(--border)'}`,
                  borderRadius:  3,
                  color:         viewerLevel === lvl ? 'var(--text)' : 'var(--text-muted)',
                  fontSize:      9,
                  letterSpacing: 0.8,
                  padding:       '3px 10px',
                  cursor:        'pointer',
                  fontFamily:    'inherit',
                }}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Message search */}
          <input
            style={{
              flex:         1,
              minWidth:     160,
              background:   'var(--surface)',
              border:       '1px solid var(--border)',
              borderRadius: 3,
              color:        'var(--text)',
              fontSize:     11,
              padding:      '4px 10px',
              fontFamily:   'inherit',
              outline:      'none',
            }}
            placeholder="Search messages…"
            value={viewerSearch}
            onChange={(e) => setViewerSearch(e.target.value)}
          />

          <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {loading ? '…' : `${filtered.length.toLocaleString()} / ${logs.length.toLocaleString()} rows`}
          </span>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              marginLeft:    8,
              background:    'transparent',
              border:        '1px solid var(--border)',
              borderRadius:  3,
              color:         'var(--text-muted)',
              fontSize:      11,
              padding:       '4px 12px',
              cursor:        'pointer',
              fontFamily:    'inherit',
              letterSpacing: 1,
              flexShrink:    0,
            }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Column labels */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: '170px 65px 180px 1fr',
          gap:                 '0 12px',
          padding:             '5px 16px',
          fontSize:            9,
          letterSpacing:       1.2,
          color:               'var(--text-muted)',
          fontWeight:          600,
          borderBottom:        '1px solid var(--border)',
          background:          'var(--surface-2)',
          flexShrink:          0,
        }}>
          <span>TIMESTAMP</span>
          <span>LEVEL</span>
          <span>LOGGER</span>
          <span>MESSAGE</span>
        </div>

        {/* Rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
              LOADING...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
              NO LOGS MATCH
            </div>
          )}
          {!loading && filtered.map((log, idx) => <ViewerRow key={idx} log={log} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export function ArchivesDashboard() {
  const [search,  setSearch]  = useState('');
  const [from,    setFrom]    = useState('');
  const [to,      setTo]      = useState('');

  // committed values — only applied when SEARCH is clicked
  const [committed, setCommitted] = useState({ search: '', from: '', to: '' });

  const [archives, setArchives]   = useState([]);
  const [page,     setPage]       = useState(1);
  const [pages,    setPages]      = useState(1);
  const [total,    setTotal]      = useState(0);
  const [loading,  setLoading]    = useState(false);

  const [viewerArchive,  setViewerArchive]  = useState(null);
  const [downloadingId,  setDownloadingId]  = useState(null);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchArchives = useCallback(async (targetPage = 1, c = committed) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(targetPage), limit: '15' });
      if (c.search.trim()) params.set('search', c.search.trim());
      if (c.from)          params.set('from', new Date(c.from).toISOString());
      if (c.to)            params.set('to',   new Date(c.to + 'T23:59:59').toISOString());

      const res  = await apiFetch(`/api/archives?${params}`);
      const data = await res.json();
      setArchives(data.archives || []);
      setPage(data.page   || 1);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('[ArchivesDashboard] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [committed]);

  useEffect(() => { fetchArchives(1); }, [fetchArchives]);

  function handleSearch() {
    const c = { search, from, to };
    setCommitted(c);
    fetchArchives(1, c);
  }

  function handleClearDates() {
    const c = { ...committed, from: '', to: '' };
    setFrom(''); setTo('');
    setCommitted(c);
    fetchArchives(1, c);
  }

  function handleClear() {
    const c = { search: '', from: '', to: '' };
    setSearch(''); setFrom(''); setTo('');
    setCommitted(c);
    fetchArchives(1, c);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
  }

  // ── Download ───────────────────────────────────────────────
  async function handleDownload(archive) {
    setDownloadingId(archive.job_id);
    try {
      const res  = await apiFetch(`/api/archives/${archive.job_id}/download`);
      const data = await res.json();
      const a    = document.createElement('a');
      a.href     = data.url;
      a.download = `${archive.job_id}.jsonl.gz`;
      a.click();
    } catch (err) {
      console.error('[ArchivesDashboard] download error:', err);
    } finally {
      setDownloadingId(null);
    }
  }

  const hasFilters    = search || from || to;
  const dateRangeSet  = from && to;

  // ── Styles ─────────────────────────────────────────────────
  const thStyle = {
    padding: '8px 14px', textAlign: 'left', fontSize: 9,
    letterSpacing: 1.4, color: 'var(--text-muted)', fontWeight: 600,
    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  };
  const tdStyle = {
    padding: '9px 14px', fontSize: 11, color: 'var(--text)',
    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  };
  const inputStyle = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 3, color: 'var(--text)', fontSize: 11,
    padding: '5px 10px', fontFamily: 'inherit', outline: 'none', height: 28,
    colorScheme: 'dark',
  };
  const actionBtn = (accent) => ({
    background: 'transparent', border: `1px solid ${accent || 'var(--border)'}`,
    borderRadius: 3, color: accent || 'var(--text-muted)', fontSize: 9,
    letterSpacing: 1, padding: '3px 10px', cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  });

  return (
    <div style={{
      flex: 1, minHeight: 0, overflowY: 'auto',
      padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20,
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, letterSpacing: 1.6, color: 'var(--text-dim)', fontWeight: 600 }}>
          LOG ARCHIVES
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {total.toLocaleString()} archived jobs
        </span>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          placeholder="SEARCH USER / JOB ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Date inputs — hidden once both are selected, replaced by chip */}
        {!dateRangeSet && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>FROM</span>
              <input
                type="date"
                style={{ ...inputStyle, width: 136 }}
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>TO</span>
              <input
                type="date"
                style={{ ...inputStyle, width: 136 }}
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Date range chip — shown when both dates are selected */}
        {dateRangeSet && (
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          8,
            height:       28,
            padding:      '0 10px',
            background:   'var(--surface-2)',
            border:       '1px solid var(--green)',
            borderRadius: 3,
            fontSize:     11,
            color:        'var(--green)',
            whiteSpace:   'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span>
              {format(new Date(from), 'MMM d, yyyy')}
              <span style={{ margin: '0 6px', opacity: 0.6 }}>→</span>
              {format(new Date(to), 'MMM d, yyyy')}
            </span>
            <span
              onClick={handleClearDates}
              style={{
                cursor:     'pointer',
                fontSize:   12,
                lineHeight: 1,
                opacity:    0.7,
                paddingLeft: 2,
              }}
              title="Clear date range"
            >
              ✕
            </span>
          </div>
        )}

        <button
          onClick={handleSearch}
          style={{ ...actionBtn('var(--green)'), padding: '5px 16px', fontSize: 10, height: 28 }}
        >
          SEARCH
        </button>
        {hasFilters && (
          <button
            onClick={handleClear}
            style={{ ...actionBtn(), padding: '5px 12px', fontSize: 10, height: 28 }}
          >
            CLEAR
          </button>
        )}
      </div>

      {/* ── Archives table ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>JOB ID</th>
                <th style={thStyle}>USER</th>
                <th style={thStyle}>TRIGGERED AT</th>
                <th style={thStyle}>ARCHIVED AT</th>
                <th style={thStyle}>STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>LOGS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>SIZE</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '24px 14px' }}>
                    LOADING...
                  </td>
                </tr>
              )}
              {!loading && archives.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '24px 14px' }}>
                    NO ARCHIVES FOUND
                  </td>
                </tr>
              )}
              {!loading && archives.map((a) => (
                <tr
                  key={a.job_id}
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 10, color: 'var(--text-dim)' }} title={a.job_id}>
                    {a.job_id.slice(0, 8)}…
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-dim)' }}>{a.user_id || '—'}</td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {a.triggered_at ? format(new Date(a.triggered_at), 'MMM d, HH:mm') : '—'}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {a.archived_at ? format(new Date(a.archived_at), 'MMM d, HH:mm') : '—'}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: 1,
                      color:   a.status === 'done' ? 'var(--green)' : a.status === 'failed' ? 'var(--red)' : 'var(--text-muted)',
                      border:  `1px solid ${a.status === 'done' ? 'var(--green)' : a.status === 'failed' ? 'var(--red)' : 'var(--border)'}`,
                      padding: '2px 7px', borderRadius: 2,
                    }}>
                      {(a.status || '—').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                    {a.log_count != null ? a.log_count.toLocaleString() : '—'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--text-muted)' }}>
                    {formatBytes(a.file_size)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        onClick={() => handleDownload(a)}
                        disabled={downloadingId === a.job_id}
                        style={{ ...actionBtn('var(--text-dim)'), opacity: downloadingId === a.job_id ? 0.5 : 1 }}
                      >
                        {downloadingId === a.job_id ? '...' : 'DOWNLOAD'}
                      </button>
                      <button
                        onClick={() => setViewerArchive(a)}
                        style={actionBtn('var(--green)')}
                      >
                        VIEW
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => fetchArchives(page - 1)} disabled={page <= 1} style={paginationBtn(page <= 1)}>
              ‹ PREV
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>
              {page} / {pages}
            </span>
            <button onClick={() => fetchArchives(page + 1)} disabled={page >= pages} style={paginationBtn(page >= pages)}>
              NEXT ›
            </button>
          </div>
        )}
      </div>

      {/* ── Viewer modal ── */}
      {viewerArchive && (
        <ViewerModal
          archive={viewerArchive}
          onClose={() => setViewerArchive(null)}
        />
      )}
    </div>
  );
}

function paginationBtn(disabled) {
  return {
    background: 'transparent', border: '1px solid var(--border)', borderRadius: 3,
    color: disabled ? 'var(--text-muted)' : 'var(--text)', padding: '3px 12px',
    fontSize: 10, letterSpacing: 1, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  };
}
