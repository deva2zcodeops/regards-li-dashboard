import React, { useEffect, useRef } from 'react';
import { LogRow } from './LogRow.jsx';

export function LogStream({ logs, liveMode, loading, page, totalPages, onPageChange, jobId }) {
  const bottomRef = useRef(null);
  const prevLogsLengthRef = useRef(0);

  useEffect(() => {
    if (liveMode && logs.length === prevLogsLengthRef.current + 1) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLogsLengthRef.current = logs.length;
  }, [logs, liveMode]);

  if (!jobId) {
    return (
      <div style={centeredStyle}>
        <span style={{ color: 'var(--green)', fontSize: 18, opacity: 0.3 }}>▶</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1 }}>
          SELECT A JOB TO VIEW LOGS
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={centeredStyle}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1 }}>
          LOADING...
        </span>
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div style={centeredStyle}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1 }}>
          {liveMode ? 'WAITING FOR LOGS...' : 'NO LOGS FOUND'}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {logs.map((log) => (
          <LogRow key={log.id} log={log} />
        ))}
        <div ref={bottomRef} />
      </div>

      {!liveMode && totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '8px 16px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            style={paginationBtn(page <= 1)}
          >
            ‹ PREV
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            style={paginationBtn(page >= totalPages)}
          >
            NEXT ›
          </button>
        </div>
      )}
    </div>
  );
}

const centeredStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  gap: 10,
};

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
