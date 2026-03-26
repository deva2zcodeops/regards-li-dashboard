import React from 'react';

/**
 * Shared prev/next pagination footer used in tables and the log stream.
 */
export function PaginationBar({ page, totalPages, onPageChange }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      padding: '10px 16px',
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      flexShrink: 0,
    }}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        style={btn(page <= 1)}
      >
        ‹ PREV
      </button>
      <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        style={btn(page >= totalPages)}
      >
        NEXT ›
      </button>
    </div>
  );
}

function btn(disabled) {
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
    fontFamily: 'inherit',
  };
}
