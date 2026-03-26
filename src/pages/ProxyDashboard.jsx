import React, { useState, useEffect } from 'react';

import { apiFetch } from '@/utils/apiFetch.js';
import { StatCard } from '@/components/StatCard.jsx';
import { RANGES } from '@/constants.js';
import { DashboardHeader } from '@/components/DashboardHeader.jsx';
import { FetchErrorBanner } from '@/components/FetchErrorBanner.jsx';
import styles from '@/components/DashboardPage.module.css';

// ── Match Level Badge ────────────────────────────────────────────────────────

const LEVEL_COLORS = {
  full:    'var(--green)',
  city:    '#4fc3f7',
  region:  '#ffb74d',
  country: '#ce93d8',
  none:    'var(--red)',
};

function LevelBadge({ level }) {
  const color = LEVEL_COLORS[level] || 'var(--text-muted)';
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 7px',
      border: `1px solid ${color}`,
      color,
      fontSize: 9,
      letterSpacing: 1,
      borderRadius: 2,
      fontWeight: 700,
      textTransform: 'uppercase',
    }}>
      {level || 'none'}
    </span>
  );
}

// ── Fallback Table ────────────────────────────────────────────────────────────

function FallbackTable({ rows }) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 4,
      overflow: 'hidden',
      flex: 1,
      minWidth: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, letterSpacing: 1.6, color: 'var(--text-dim)', fontWeight: 600 }}>
          FALLBACK RATE BY COUNTRY
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.8 }}>
          TOP 20 · SORTED BY VOLUME
        </span>
      </div>

      {/* Col headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 52px 88px 130px',
        padding: '5px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        {['COUNTRY', 'CODE', 'TOTAL JOBS', 'FULL MATCH %'].map((h, i) => (
          <span key={h} style={{
            fontSize: 9, letterSpacing: 1.4, color: 'var(--text-muted)',
            textAlign: i >= 2 ? 'right' : 'left', textTransform: 'uppercase',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ overflowY: 'auto', maxHeight: 340 }}>
        {rows.length === 0 ? (
          <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>
            NO DATA
          </div>
        ) : rows.map((row, i) => {
          const fullPct = parseFloat(row.full_match_pct);
          const barColor = fullPct >= 80 ? 'var(--green)' : fullPct >= 50 ? '#ffb74d' : 'var(--red)';
          return (
            <div key={row.country_code} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 52px 88px 130px',
              padding: '7px 14px',
              borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
              background: i % 2 === 0 ? 'transparent' : 'var(--surface)',
              alignItems: 'center',
              position: 'relative',
            }}>
              {/* bar backdrop */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${fullPct}%`, background: 'rgba(0,230,118,0.04)',
                pointerEvents: 'none',
              }} />

              <span style={{ fontSize: 10, color: 'var(--text)', fontWeight: 500, letterSpacing: 0.3 }}>
                {row.country}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
                {row.country_code}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {row.total.toLocaleString()}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: barColor, fontVariantNumeric: 'tabular-nums', minWidth: 38, textAlign: 'right' }}>
                  {row.full_match_pct}%
                </span>
                <LevelBadge level={row.most_common_fallback} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Match Level Bar ───────────────────────────────────────────────────────────

function MatchLevelBar({ levels }) {
  const order = ['full', 'city', 'region', 'country', 'none'];
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <span style={{ fontSize: 10, letterSpacing: 1.6, color: 'var(--text-dim)', fontWeight: 600 }}>
          MATCH LEVEL DISTRIBUTION
        </span>
      </div>

      {/* Stacked bar */}
      <div style={{ padding: '14px 16px', background: 'var(--surface)' }}>
        <div style={{
          display: 'flex',
          height: 12,
          borderRadius: 2,
          overflow: 'hidden',
          gap: 1,
        }}>
          {order.map((key) => {
            const pct = parseFloat(levels?.[key]?.pct || '0');
            if (pct === 0) return null;
            return (
              <div
                key={key}
                title={`${key}: ${pct}%`}
                style={{
                  width: `${pct}%`,
                  background: LEVEL_COLORS[key],
                  transition: 'width 0.4s ease',
                  opacity: 0.85,
                  cursor: 'default',
                }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          {order.map((key) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 8, height: 8, borderRadius: 1,
                background: LEVEL_COLORS[key], flexShrink: 0,
              }} />
              <span style={{ fontSize: 9, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {key}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {levels?.[key]?.pct ?? '0.0'}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Verification Metric ───────────────────────────────────────────────────────

function VerificationCard({ rate, verifiedCount, total }) {
  const pct = parseFloat(rate || '0');
  const color = pct >= 95 ? 'var(--green)' : pct >= 80 ? '#ffb74d' : 'var(--red)';
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 4,
      background: 'var(--surface)',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      minWidth: 200,
    }}>
      <span style={{ fontSize: 9, letterSpacing: 1.6, color: 'var(--text-muted)', fontWeight: 600 }}>
        PROXY VERIFICATION RATE
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 36, fontWeight: 700, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {rate ?? '—'}%
        </span>
      </div>
      <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
        {verifiedCount?.toLocaleString() ?? '—'} / {total?.toLocaleString() ?? '—'} jobs verified via ipify
      </span>
      {/* Progress bar */}
      <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(pct, 100)}%`,
          background: color,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ProxyDashboard() {
  const [range, setRange]     = useState('7d');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch(`/api/proxy?range=${range}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d)  => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [range]);

  const lvl = data?.levels;

  return (
    <div className={styles.page}>

      <DashboardHeader
        title="PROXY PERFORMANCE"
        subtitle="SOAX GEO-MATCHING COVERAGE & VERIFICATION"
        range={range}
        onRangeChange={setRange}
        ranges={RANGES}
      />

      <FetchErrorBanner error={error} />

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        <StatCard
          label="FULL MATCH"
          value={loading ? '…' : `${lvl?.full?.pct ?? '0.0'}%`}
          sublabel="carrier + city + region matched"
          accent="var(--green)"
          barPct={loading ? 0 : parseFloat(lvl?.full?.pct || 0)}
          info="SOAX found a proxy matching carrier, city, and region. Highest fidelity — LinkedIn sees traffic from the exact ISP and location."
        />
        <StatCard
          label="CITY MATCH"
          value={loading ? '…' : `${lvl?.city?.pct ?? '0.0'}%`}
          sublabel="city matched · carrier not found"
          accent="#4fc3f7"
          barPct={loading ? 0 : parseFloat(lvl?.city?.pct || 0)}
          info="City was matched in SOAX but the user's ISP (carrier) wasn't available. Most common outcome — city-level targeting is usually sufficient."
        />
        <StatCard
          label="REGION MATCH"
          value={loading ? '…' : `${lvl?.region?.pct ?? '0.0'}%`}
          sublabel="region matched · city not found"
          accent="#ffb74d"
          barPct={loading ? 0 : parseFloat(lvl?.region?.pct || 0)}
          info="Region (state/province) was matched but the specific city had no SOAX coverage. Proxy targets the correct region but wrong city."
        />
        <StatCard
          label="COUNTRY ONLY"
          value={loading ? '…' : `${lvl?.country?.pct ?? '0.0'}%`}
          sublabel="region & city not found"
          accent="#ce93d8"
          barPct={loading ? 0 : parseFloat(lvl?.country?.pct || 0)}
          info="Only country-level proxy available. SOAX had no coverage for the user's region or city. Weakest geo match — higher risk of LinkedIn detection."
        />
        <StatCard
          label="NO MATCH"
          value={loading ? '…' : `${lvl?.none?.pct ?? '0.0'}%`}
          sublabel="no SOAX proxy found"
          accent="var(--red)"
          barPct={loading ? 0 : parseFloat(lvl?.none?.pct || 0)}
          info="SOAX returned no proxy for this country at all. Job ran without a matching proxy — very high detection risk."
        />
      </div>

      {/* Distribution bar + verification */}
      {!loading && data && (
        <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 320 }}>
            <MatchLevelBar levels={lvl} />
          </div>
          <VerificationCard
            rate={data.verification_rate}
            verifiedCount={data.verified_count}
            total={data.verify_total}
          />
        </div>
      )}

      {/* Fallback by country table */}
      {!loading && data && (
        <div style={{ flexShrink: 0 }}>
          <FallbackTable rows={data.fallback_by_country ?? []} />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && data?.total === 0 && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 8,
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.4 }}>NO PROXY DATA</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 9, opacity: 0.5, letterSpacing: 1 }}>
            JOB_GEO TABLE IS EMPTY FOR THIS RANGE
          </span>
        </div>
      )}
    </div>
  );
}
