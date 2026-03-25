import React, { useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile.js';

const RANGES = ['7d', '14d', '30d'];
const LEVELS = ['ALL', 'running', 'done', 'failed', 'pending'];

export function LogFilters({ filters, onFilter, liveMode, onToggleLive, onShowJobs }) {
  const isMobile = useIsMobile();
  const searchTimer = useRef(null);

  function handleSearch(e) {
    const val = e.target.value;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => onFilter('search', val), 300);
  }

  if (isMobile) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
      }}>
        {/* Row 1: JOBS toggle + LIVE MODE + range pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 12px',
          borderBottom: '1px solid var(--border)',
        }}>
          {onShowJobs && (
            <button
              onClick={onShowJobs}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '0 9px', height: 26,
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 3,
                color: 'var(--text-dim)',
                fontSize: 10, fontWeight: 600, letterSpacing: 0.8,
                cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
            >
              JOBS ≡
            </button>
          )}

          <button
            onClick={onToggleLive}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '0 9px', height: 26,
              background: liveMode ? 'var(--green-dim)' : 'transparent',
              border: `1px solid ${liveMode ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 3,
              color: liveMode ? 'var(--green)' : 'var(--text-muted)',
              fontSize: 10, fontWeight: 700, letterSpacing: 1,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: liveMode ? 'var(--green)' : 'var(--text-muted)',
              animation: liveMode ? 'pulse-dot 1.4s ease-in-out infinite' : 'none',
              flexShrink: 0,
            }} />
            LIVE
          </button>

          <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />

          <div style={{ display: 'flex', gap: 3 }}>
            {RANGES.map((r) => {
              const active = filters.range === r;
              return (
                <button
                  key={r}
                  onClick={() => !liveMode && onFilter('range', r)}
                  disabled={liveMode}
                  style={{
                    padding: '0 8px', height: 24,
                    background: active ? 'var(--surface-3)' : 'transparent',
                    border: `1px solid ${active ? 'var(--text-dim)' : 'transparent'}`,
                    borderRadius: 3,
                    color: active ? 'var(--text)' : 'var(--text-muted)',
                    fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: 0.8,
                    opacity: liveMode ? 0.35 : 1,
                    cursor: liveMode ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {r.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Level filter + Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1, whiteSpace: 'nowrap' }}>LVL:</span>
          <select
            value={filters.level}
            onChange={(e) => onFilter('level', e.target.value)}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 3, color: 'var(--text)', padding: '0 6px',
              height: 26, fontSize: 10, letterSpacing: 0.8, outline: 'none',
            }}
          >
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <input
            type="text"
            placeholder="user_id or job_id"
            defaultValue={filters.search}
            onChange={handleSearch}
            style={{
              flex: 1, minWidth: 0,
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 3, color: 'var(--text)', padding: '0 8px',
              height: 26, fontSize: 10, letterSpacing: 0.6, outline: 'none',
            }}
          />
        </div>
      </div>
    );
  }

  // ── Desktop layout ─────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 16px',
      height: 44,
      minHeight: 44,
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      flexShrink: 0,
    }}>

      {/* Live mode button */}
      <button
        onClick={onToggleLive}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 12px',
          height: 26,
          background: liveMode ? 'var(--green-dim)' : 'transparent',
          border: `1px solid ${liveMode ? 'var(--green)' : 'var(--border)'}`,
          borderRadius: 3,
          color: liveMode ? 'var(--green)' : 'var(--text-muted)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.2,
        }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: liveMode ? 'var(--green)' : 'var(--text-muted)',
          animation: liveMode ? 'pulse-dot 1.4s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }} />
        LIVE MODE
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

      {/* Range pills */}
      <div style={{ display: 'flex', gap: 4 }}>
        {RANGES.map((r) => {
          const active = filters.range === r;
          return (
            <button
              key={r}
              onClick={() => !liveMode && onFilter('range', r)}
              disabled={liveMode}
              style={{
                padding: '0 10px',
                height: 24,
                background: active ? 'var(--surface-3)' : 'transparent',
                border: `1px solid ${active ? 'var(--text-dim)' : 'transparent'}`,
                borderRadius: 3,
                color: active ? 'var(--text)' : 'var(--text-muted)',
                fontSize: 10,
                fontWeight: active ? 700 : 400,
                letterSpacing: 0.8,
                opacity: liveMode ? 0.35 : 1,
                cursor: liveMode ? 'not-allowed' : 'pointer',
              }}
            >
              {r.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

      {/* Level filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>LEVEL:</span>
        <select
          value={filters.level}
          onChange={(e) => onFilter('level', e.target.value)}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 3,
            color: 'var(--text)',
            padding: '0 6px',
            height: 26,
            fontSize: 10,
            letterSpacing: 0.8,
            outline: 'none',
          }}
        >
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Search by user_id or job_id */}
      <input
        type="text"
        placeholder="user_id or job_id"
        defaultValue={filters.search}
        onChange={handleSearch}
        style={{
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 3,
          color: 'var(--text)',
          padding: '0 10px',
          height: 26,
          width: 220,
          fontSize: 10,
          letterSpacing: 0.8,
          outline: 'none',
          marginLeft: 'auto',
        }}
      />
    </div>
  );
}
