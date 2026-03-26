import React, { useState } from 'react';

/**
 * Reusable stat card used across all dashboard pages.
 *
 * Props:
 *   label    – uppercase label shown above the value
 *   value    – large numeric/text value
 *   sublabel – small descriptive text below the value
 *   accent   – CSS colour string for the value
 *   info     – tooltip text shown on hover of the ⓘ icon
 *   minWidth – minimum card width (default 150)
 *   barPct   – 0-100, renders a subtle background fill bar (used by ProxyDashboard)
 */
export function StatCard({ label, value, sublabel, accent, info, minWidth = 150, barPct }) {
  const [tooltipPos, setTooltipPos] = useState(null);

  return (
    <div style={{
      flex: 1,
      minWidth,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      position: 'relative',
    }}>

      {/* Optional background progress bar */}
      {barPct != null && (
        <div style={{
          position: 'absolute', left: 0, bottom: 0, top: 0, right: 0,
          overflow: 'hidden', borderRadius: 4, pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', left: 0, bottom: 0, top: 0,
            width: `${barPct}%`,
            background: `${accent || 'var(--green)'}14`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}

      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, letterSpacing: 1.4, color: 'var(--text-muted)', fontWeight: 500 }}>
          {label}
        </span>

        {/* Info tooltip */}
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
            >
              i
            </span>
            {tooltipPos && (
              <div style={{
                position: 'fixed', top: tooltipPos.top, right: tooltipPos.right,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '7px 10px',
                fontSize: 10, color: 'var(--text-muted)',
                width: 210, zIndex: 9999, lineHeight: 1.6,
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)', pointerEvents: 'none',
              }}>
                {info}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Value */}
      <span style={{
        fontSize: 28,
        fontWeight: 700,
        color: accent || 'var(--text)',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {value ?? '—'}
      </span>

      {/* Sublabel */}
      {sublabel && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}
