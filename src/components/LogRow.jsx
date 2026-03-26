import React from 'react';
import { format } from 'date-fns';

const LEVEL_CONFIG = {
  INFO:    { color: 'var(--green)', dimColor: 'var(--green-dim)',  label: 'INFO'    },
  WARNING: { color: 'var(--amber)', dimColor: 'var(--amber-dim)',  label: 'WARNING' },
  ERROR:   { color: 'var(--red)',   dimColor: 'var(--red-dim)',    label: 'ERROR'   },
};

export function LogRow({ log }) {
  const cfg = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.INFO;
  let ts = '—';
  if (log.timestamp) {
    try { ts = format(new Date(log.timestamp), 'HH:mm:ss'); } catch { /* invalid date */ }
  }

  // Strip asctime — it duplicates the timestamp we already show on the line
  const cleanedMetadata = log.metadata
    ? Object.fromEntries(Object.entries(log.metadata).filter(([k]) => k !== 'asctime'))
    : {};
  const hasMetadata = Object.keys(cleanedMetadata).length > 0;

  return (
    <div style={{
      padding: '6px 16px',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Main log line */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>

        {/* Timestamp */}
        <span style={{
          color: 'var(--text-muted)',
          fontSize: 11,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {ts}
        </span>

        {/* Level badge */}
        <span style={{
          border: `1px solid ${cfg.color}`,
          color: cfg.color,
          background: cfg.dimColor,
          fontSize: 9,
          fontWeight: 700,
          padding: '1px 6px',
          borderRadius: 2,
          letterSpacing: 1,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {cfg.label}
        </span>

        {/* Logger name */}
        {log.logger && (
          <span style={{
            color: 'var(--text-dim)',
            fontSize: 11,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {log.logger}
          </span>
        )}

        {/* Message */}
        <span style={{ color: 'var(--text)', wordBreak: 'break-word', flex: 1, fontSize: 12 }}>
          {log.message}
        </span>
      </div>

      {/* Metadata block */}
      {hasMetadata && (
        <pre style={{
          marginTop: 6,
          marginLeft: 70,
          borderLeft: `2px solid ${cfg.color}`,
          paddingLeft: 12,
          paddingTop: 6,
          paddingBottom: 6,
          background: 'var(--surface-2)',
          borderRadius: '0 3px 3px 0',
          fontSize: 11,
          color: cfg.color,
          opacity: 0.85,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.6,
        }}>
          {JSON.stringify(cleanedMetadata, null, 2)}
        </pre>
      )}
    </div>
  );
}
