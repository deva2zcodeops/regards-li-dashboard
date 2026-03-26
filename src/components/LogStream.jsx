import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { LogRow } from './LogRow.jsx';
import { PaginationBar } from './PaginationBar.jsx';

export function LogStream({ logs, liveMode, loading, page, totalPages, onPageChange, jobId, wsConnected, fetchError }) {
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

  if (fetchError) {
    return (
      <div style={centeredStyle}>
        <span style={{ color: 'var(--red)', fontSize: 10, letterSpacing: 1 }}>
          FETCH ERROR: {fetchError}
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
      {liveMode && !wsConnected && (
        <div style={{
          padding: '4px 16px',
          background: 'var(--red-dim)',
          borderBottom: '1px solid var(--red)',
          fontSize: 10,
          color: 'var(--red)',
          letterSpacing: 1,
          flexShrink: 0,
          textAlign: 'center',
        }}>
          WS DISCONNECTED — RECONNECTING...
        </div>
      )}

      <Virtuoso
        style={{ flex: 1 }}
        data={logs}
        followOutput={liveMode ? 'smooth' : false}
        itemContent={(_, log) => <LogRow log={log} />}
      />

      {!liveMode && totalPages > 1 && (
        <PaginationBar page={page} totalPages={totalPages} onPageChange={onPageChange} />
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
