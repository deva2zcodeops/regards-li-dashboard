import React from 'react';

/**
 * Titled panel wrapper used in chart dashboards.
 */
export function Panel({ title, subtitle, children }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, letterSpacing: 1.6, color: 'var(--text-dim)', fontWeight: 600 }}>
          {title}
        </span>
        {subtitle && (
          <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.8 }}>{subtitle}</span>
        )}
      </div>
      <div style={{ padding: '14px 16px', background: 'var(--surface)' }}>
        {children}
      </div>
    </div>
  );
}
