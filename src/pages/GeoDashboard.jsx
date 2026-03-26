import React, { useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';
import countries110m from 'world-atlas/countries-110m.json';

import { apiFetch } from '@/utils/apiFetch.js';
import { RANGES } from '@/constants.js';
import { DashboardHeader } from '@/components/DashboardHeader.jsx';
import { FetchErrorBanner } from '@/components/FetchErrorBanner.jsx';
import styles from '@/components/DashboardPage.module.css';

// ── Pulsing dot keyframes injected once ──────────────────────────────────────

const PULSE_CSS = `
@keyframes geo-pulse {
  0%   { r: 0; opacity: 0.8; }
  100% { r: 22; opacity: 0; }
}
@keyframes geo-ping {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}
`;

let pulseCssInjected = false;
function injectPulseCSS() {
  if (pulseCssInjected) return;
  const style = document.createElement('style');
  style.textContent = PULSE_CSS;
  document.head.appendChild(style);
  pulseCssInjected = true;
}

// ── Geo Stat Cell (with info tooltip) ────────────────────────────────────────

function GeoStatCell({ s, borderRight }) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div style={{
      flex: 1,
      padding: '10px 16px',
      borderRight: borderRight ? '1px solid var(--border)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 8, letterSpacing: 1.6, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {s.label}
        </span>
        {s.info && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <span
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              style={{
                width: 13, height: 13, borderRadius: '50%',
                border: '1px solid var(--text-muted)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 7, color: 'var(--text-muted)', cursor: 'default',
                userSelect: 'none', lineHeight: 1, fontStyle: 'italic', fontWeight: 700,
              }}
            >i</span>
            {showInfo && (
              <div style={{
                position: 'absolute', bottom: 20, right: 0,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 4, padding: '7px 10px',
                fontSize: 10, color: 'var(--text-muted)',
                width: 200, zIndex: 200, lineHeight: 1.6,
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
              }}>
                {s.info}
              </div>
            )}
          </div>
        )}
      </div>
      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', letterSpacing: 0.5 }}>
        {s.value}
      </span>
    </div>
  );
}

// ── World Map ────────────────────────────────────────────────────────────────

function dotRadius(count, maxCount) {
  const minR = 4;
  const maxR = 16;
  if (maxCount === 0) return minR;
  return minR + Math.sqrt(count / maxCount) * (maxR - minR);
}

function WorldMap({ points, total }) {
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => { injectPulseCSS(); }, []);

  const maxCount = points.length > 0 ? Math.max(...points.map((p) => p.count)) : 1;
  const activeRegions = points.length;
  const topCountry = points[0] ?? null;

  return (
    <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>

      {/* LIVE badge */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 14,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        background: 'rgba(8,9,13,0.75)',
        border: '1px solid rgba(0,230,118,0.3)',
        borderRadius: 3,
        padding: '4px 10px',
        backdropFilter: 'blur(4px)',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--green)',
          boxShadow: '0 0 6px var(--green)',
          display: 'inline-block',
          animation: 'geo-ping 1.4s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 9, letterSpacing: 1.8, color: 'var(--green)', fontWeight: 700 }}>
          LIVE ORIGIN PULSE
        </span>
      </div>

      {/* Map */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 130, center: [10, 15] }}
        style={{ width: '100%', height: 'auto', background: '#050810', display: 'block' }}
      >
        <Geographies geography={countries110m}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: { fill: '#0d1624', stroke: '#152535', strokeWidth: 0.4, outline: 'none' },
                  hover:   { fill: '#142030', stroke: '#1e3545', strokeWidth: 0.4, outline: 'none' },
                  pressed: { fill: '#0d1624', outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {/* Dots */}
        {points.map((p, i) => {
          if (p.lat == null || p.lng == null) return null;
          const r = dotRadius(p.count, maxCount);
          const pct = total > 0 ? ((p.count / total) * 100).toFixed(1) : '0.0';

          return (
            <Marker
              key={i}
              coordinates={[p.lng, p.lat]}
              onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, p, pct })}
              onMouseMove={(e)  => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Pulse ring */}
              <circle
                r={0}
                fill="none"
                stroke="var(--green)"
                strokeWidth={1}
                style={{
                  animation: `geo-pulse ${1.8 + (i % 5) * 0.3}s ease-out infinite`,
                  animationDelay: `${(i * 0.25) % 1.5}s`,
                }}
              />
              {/* Glow halo */}
              <circle r={r * 1.6} fill="rgba(0,230,118,0.08)" />
              {/* Main dot */}
              <circle
                r={r}
                fill="rgba(0,230,118,0.7)"
                stroke="#00e676"
                strokeWidth={0.8}
                style={{ cursor: 'pointer', filter: 'drop-shadow(0 0 4px rgba(0,230,118,0.8))' }}
              />
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Stats bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0,
        borderTop: '1px solid var(--border)',
        background: 'rgba(8,9,13,0.9)',
      }}>
        {[
          { label: 'ACTIVE REGIONS', value: activeRegions,                                                   info: 'Number of distinct countries with at least one job in this range.' },
          { label: 'TOP COUNTRY',    value: topCountry ? topCountry.country || topCountry.country_code : '—', info: 'Country with the highest number of geo-resolved proxy requests.' },
          { label: 'TOP COUNTRY %',  value: topCountry ? `${topCountry.percentage}%` : '—',                  info: 'Share of total requests served from the top country.' },
          { label: 'TOTAL REQUESTS', value: total.toLocaleString(),                                           info: 'Total job_geo records found for this date range.' },
        ].map((s, i, arr) => (
          <GeoStatCell key={s.label} s={s} borderRight={i < arr.length - 1} />
        ))}
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          top: tooltip.y + 14,
          left: tooltip.x + 10,
          background: 'var(--surface-2)',
          border: '1px solid rgba(0,230,118,0.3)',
          padding: '7px 12px',
          borderRadius: 4,
          pointerEvents: 'none',
          zIndex: 300,
          minWidth: 150,
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}>
          <div style={{ color: 'var(--green)', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, marginBottom: 3 }}>
            {tooltip.p.country || tooltip.p.country_code}
          </div>
          <div style={{ color: 'var(--text)', fontSize: 10 }}>
            {tooltip.p.count.toLocaleString()} requests
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: 10, marginTop: 1 }}>
            {tooltip.pct}% of total
          </div>
        </div>
      )}
    </div>
  );
}

// ── Generic top-10 table ──────────────────────────────────────────────────────

function TopTable({ title, columns, rows, total }) {
  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      border: '1px solid var(--border)',
      borderRadius: 4,
      overflow: 'hidden',
    }}>
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
        <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.8 }}>TOP 10</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: columns.map((c) => c.width).join(' '),
        padding: '5px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        {columns.map((c) => (
          <span key={c.key} style={{
            fontSize: 9, letterSpacing: 1.4, color: 'var(--text-muted)',
            textAlign: c.align || 'left', textTransform: 'uppercase',
          }}>
            {c.label}
          </span>
        ))}
      </div>

      <div style={{ overflowY: 'auto', maxHeight: 260 }}>
        {rows.length === 0 ? (
          <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>
            NO DATA
          </div>
        ) : rows.map((row, i) => {
          const barPct = total > 0 ? (row.count / total) * 100 : 0;
          return (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: columns.map((c) => c.width).join(' '),
              padding: '6px 14px',
              borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
              background: i % 2 === 0 ? 'transparent' : 'var(--surface)',
              position: 'relative',
              alignItems: 'center',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${barPct}%`, background: 'rgba(0,230,118,0.05)',
                pointerEvents: 'none',
              }} />
              {columns.map((c) => (
                <span key={c.key} style={{
                  fontSize: 10,
                  color: c.key === columns[0].key ? 'var(--text)' : 'var(--text-dim)',
                  letterSpacing: 0.4, textAlign: c.align || 'left',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontWeight: c.key === columns[0].key ? 500 : 400,
                }}>
                  {c.format ? c.format(row[c.key], row) : row[c.key]}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function GeoDashboard() {
  const [range, setRange]     = useState('7d');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch(`/api/geo?range=${range}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d)  => { if (!cancelled) { setData(d);  setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [range]);

  const countryColumns = [
    { key: 'country',      label: 'Country',  width: '1fr' },
    { key: 'country_code', label: 'Code',     width: '44px', align: 'center' },
    { key: 'count',        label: 'Requests', width: '72px', align: 'right', format: (v) => v.toLocaleString() },
    { key: 'percentage',   label: '%',        width: '44px', align: 'right', format: (v) => `${v}%` },
  ];
  const regionColumns = [
    { key: 'region',     label: 'Region',   width: '1fr' },
    { key: 'country',    label: 'Country',  width: '80px' },
    { key: 'count',      label: 'Requests', width: '72px', align: 'right', format: (v) => v.toLocaleString() },
    { key: 'percentage', label: '%',        width: '44px', align: 'right', format: (v) => `${v}%` },
  ];
  const cityColumns = [
    { key: 'city',       label: 'City',     width: '1fr' },
    { key: 'country',    label: 'Country',  width: '80px' },
    { key: 'count',      label: 'Requests', width: '72px', align: 'right', format: (v) => v.toLocaleString() },
    { key: 'percentage', label: '%',        width: '44px', align: 'right', format: (v) => `${v}%` },
  ];
  const carrierColumns = [
    { key: 'carrier',    label: 'Carrier',  width: '1fr' },
    { key: 'country',    label: 'Country',  width: '80px' },
    { key: 'count',      label: 'Requests', width: '72px', align: 'right', format: (v) => v.toLocaleString() },
    { key: 'percentage', label: '%',        width: '44px', align: 'right', format: (v) => `${v}%` },
  ];

  return (
    <div className={styles.page}>

      <DashboardHeader
        title="GEO INTELLIGENCE"
        subtitle="GLOBAL TRAFFIC DISTRIBUTION & ENDPOINT INTEGRITY"
        range={range}
        onRangeChange={setRange}
        ranges={RANGES}
      />

      <FetchErrorBanner error={error} />

      {/* Map */}
      <div style={{ flexShrink: 0 }}>
        {loading ? (
          <div style={{
            height: 260, border: '1px solid var(--border)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1.4,
            background: '#050810',
          }}>
            LOADING MAP...
          </div>
        ) : (
          <WorldMap points={data?.map_points ?? []} total={data?.total ?? 0} />
        )}
      </div>

      {/* Tables — row 1: Countries + Regions */}
      {!loading && data && (
        <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
          <TopTable title="Top Countries" columns={countryColumns} rows={data.countries}          total={data.total} />
          <TopTable title="Top Regions"   columns={regionColumns}  rows={data.regions ?? []}      total={data.total} />
        </div>
      )}

      {/* Tables — row 2: Cities + Carriers */}
      {!loading && data && (
        <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
          <TopTable title="Top Cities"   columns={cityColumns}    rows={data.cities}    total={data.total} />
          <TopTable title="Top Carriers" columns={carrierColumns} rows={data.carriers}  total={data.total} />
        </div>
      )}

      {!loading && !error && data?.total === 0 && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 8,
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.4 }}>NO GEO DATA</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 9, opacity: 0.5, letterSpacing: 1 }}>
            JOB_GEO TABLE IS EMPTY FOR THIS RANGE
          </span>
        </div>
      )}
    </div>
  );
}
