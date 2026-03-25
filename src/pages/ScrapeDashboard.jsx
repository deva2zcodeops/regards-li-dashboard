import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  LineChart, Line,
  PieChart, Pie, Cell,
} from 'recharts';

import { apiFetch } from '../utils/apiFetch.js';
const RANGES   = ['7d', '14d', '30d', 'all'];

const ERROR_COLORS = {
  '429 Rate Limited':     '#ffb74d',
  '401 Auth Failed':      '#ef5350',
  '403 Forbidden':        '#ff8a65',
  'Proxy Error':          '#ce93d8',
  'Max Retries Exceeded': '#fff176',
  'Other':                '#546e7a',
};

const BUCKET_COLORS = ['#4fc3f7', '#00e676', '#ffb74d'];

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sublabel, accent, info }) {
  const [tooltipPos, setTooltipPos] = useState(null);
  return (
    <div style={{
      flex: 1, minWidth: 160,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, letterSpacing: 1.6, color: 'var(--text-muted)', fontWeight: 600 }}>
          {label}
        </span>
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
            >i</span>
            {tooltipPos && (
              <div style={{
                position: 'fixed', top: tooltipPos.top, right: tooltipPos.right,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 4, padding: '7px 10px',
                fontSize: 10, color: 'var(--text-muted)',
                width: 210, zIndex: 9999, lineHeight: 1.6,
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
              }}>
                {info}
              </div>
            )}
          </div>
        )}
      </div>
      <span style={{
        fontSize: 28, fontWeight: 700, lineHeight: 1,
        color: accent || 'var(--text)',
        fontVariantNumeric: 'tabular-nums',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {value ?? '—'}
      </span>
      {sublabel && (
        <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.4 }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

function Panel({ title, subtitle, children }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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

// ── Connections Distribution Histogram ────────────────────────────────────────

function DistributionChart({ distribution, totalDone }) {
  if (totalDone === 0) {
    return (
      <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>NO COMPLETED JOBS</span>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 4, padding: '6px 10px', fontSize: 10,
        fontFamily: 'inherit',
      }}>
        <div style={{ color: payload[0].fill, fontWeight: 700, marginBottom: 2 }}>{d.bucket}</div>
        <div style={{ color: 'var(--text-muted)' }}>{d.count.toLocaleString()} jobs · {d.pct}%</div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      <ResponsiveContainer width="60%" height={140}>
        <BarChart data={distribution} margin={{ top: 4, right: 8, bottom: 4, left: 0 }} barCategoryGap="30%">
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="bucket"
            tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'inherit' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'inherit' }}
            axisLine={false} tickLine={false} width={28} allowDecimals={false}
          />
          <ReTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {distribution.map((_, i) => (
              <Cell key={i} fill={BUCKET_COLORS[i]} opacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Bucket legend with % breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {distribution.map((d, i) => (
          <div key={d.bucket} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 1, background: BUCKET_COLORS[i], flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--text)', letterSpacing: 0.3 }}>{d.bucket}</span>
              </div>
              <span style={{ fontSize: 10, color: BUCKET_COLORS[i], fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {d.pct}%
              </span>
            </div>
            {/* Mini progress bar */}
            <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${d.pct}%`,
                background: BUCKET_COLORS[i],
                transition: 'width 0.4s ease',
                opacity: 0.7,
              }} />
            </div>
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
              {d.count.toLocaleString()} jobs
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Daily Connections Trend ───────────────────────────────────────────────────

function DailyTrendChart({ daily }) {
  if (!daily || daily.length === 0) {
    return (
      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>NO DATA</span>
      </div>
    );
  }

  const chartData = daily.map((d) => {
    let label = String(d.date);
    try { label = format(parseISO(String(d.date)), 'MMM d'); } catch {}
    return { ...d, label };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{
        background: 'var(--surface-2)',
        border: '1px solid rgba(0,230,118,0.3)',
        borderRadius: 4, padding: '6px 10px', fontSize: 10,
        fontFamily: 'inherit',
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
        <div style={{ color: 'var(--green)', fontWeight: 700 }}>
          avg {d.avg_conn.toLocaleString()} connections
        </div>
        <div style={{ color: 'var(--text-muted)', marginTop: 1 }}>
          {d.total_conn.toLocaleString()} total · {d.done} jobs
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'inherit' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'inherit' }}
          axisLine={false} tickLine={false} width={36} allowDecimals={false}
        />
        <ReTooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="avg_conn"
          stroke="var(--green)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--green)', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: 'var(--green)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Error Breakdown Donut ─────────────────────────────────────────────────────

function ErrorDonutChart({ errorTypes }) {
  const [activeIdx, setActiveIdx] = useState(null);

  const total = errorTypes.reduce((s, e) => s + e.count, 0);

  if (total === 0) {
    return (
      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>NO FAILURES</span>
      </div>
    );
  }

  const data = errorTypes.map((e) => ({
    name:  e.type,
    value: e.count,
    pct:   ((e.count / total) * 100).toFixed(1),
    color: ERROR_COLORS[e.type] || '#546e7a',
  }));

  const active = activeIdx != null ? data[activeIdx] : null;

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ width: 160, height: 160, flexShrink: 0, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={46} outerRadius={72}
              paddingAngle={1}
              dataKey="value"
              onMouseEnter={(_, i) => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color}
                  opacity={activeIdx == null || activeIdx === i ? 0.85 : 0.3}
                  style={{ cursor: 'pointer', outline: 'none' }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
            {active ? active.value.toLocaleString() : total.toLocaleString()}
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            {active ? `${active.pct}%` : 'TOTAL'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minWidth: 140 }}>
        {data.map((e, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, cursor: 'default',
              opacity: activeIdx == null || activeIdx === i ? 1 : 0.4,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <div style={{ width: 7, height: 7, borderRadius: 1, background: e.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text)', flex: 1, letterSpacing: 0.2 }}>{e.name}</span>
            <span style={{ fontSize: 10, color: e.color, fontWeight: 700, minWidth: 32, textAlign: 'right' }}>
              {e.pct}%
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', minWidth: 24, textAlign: 'right' }}>
              {e.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ScrapeDashboard() {
  const [range, setRange]     = useState('7d');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch(`/api/scrape?range=${range}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d)  => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [range]);

  const rate429Color = data
    ? parseFloat(data.rate_429) >= 30 ? 'var(--red)'
    : parseFloat(data.rate_429) >= 10 ? '#ffb74d'
    : 'var(--text)'
    : 'var(--text)';

  const rateAuthColor = data
    ? parseFloat(data.rate_auth) >= 20 ? 'var(--red)'
    : parseFloat(data.rate_auth) >= 5  ? '#ffb74d'
    : 'var(--text)'
    : 'var(--text)';

  return (
    <div style={{
      flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
      overflowY: 'auto', padding: '20px 24px', gap: 20,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text)', fontWeight: 700 }}>
            SCRAPE PERFORMANCE
          </span>
          <span style={{ fontSize: 9, letterSpacing: 1.2, color: 'var(--text-muted)' }}>
            CONNECTION VOLUME, DISTRIBUTION &amp; FAILURE CAUSES
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {RANGES.map((r) => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '4px 12px', fontSize: 10, letterSpacing: 1.2,
              background: range === r ? 'var(--green-dim)' : 'transparent',
              border: `1px solid ${range === r ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 3,
              color: range === r ? 'var(--green)' : 'var(--text-dim)',
              cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase',
            }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '10px 14px', background: 'var(--red-dim)',
          border: '1px solid var(--red)', borderRadius: 4,
          color: 'var(--red)', fontSize: 10, letterSpacing: 0.8,
        }}>
          FETCH ERROR: {error}
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        <StatCard
          label="AVG CONNECTIONS SCRAPED"
          value={loading ? '…' : (data?.avg_connections ?? 0).toLocaleString()}
          sublabel="per completed job"
          accent="var(--green)"
          info="Mean number of LinkedIn connections retrieved per successfully completed job. Low values may indicate jobs are being cut short by rate limits."
        />
        <StatCard
          label="TOTAL CONNECTIONS SCRAPED"
          value={loading ? '…' : (data?.total_connections ?? 0).toLocaleString()}
          sublabel={`across ${loading ? '…' : (data?.total_done ?? 0).toLocaleString()} completed jobs`}
          accent="var(--green)"
          info="Sum of all connections scraped across completed jobs in the selected range."
        />
        <StatCard
          label="429 RATE"
          value={loading ? '…' : `${data?.rate_429}%`}
          sublabel="of failed jobs hit rate limits"
          accent={rate429Color}
          info="Percentage of failed jobs where LinkedIn returned HTTP 429 (Too Many Requests). High values mean scrape frequency needs to be reduced."
        />
        <StatCard
          label="AUTH FAILURE RATE"
          value={loading ? '…' : `${data?.rate_auth}%`}
          sublabel="of failed jobs hit 401 / 403"
          accent={rateAuthColor}
          info="Percentage of failed jobs rejected with 401 (Unauthorized) or 403 (Forbidden). Usually means the user's li_at session cookie has expired."
        />
      </div>

      {/* Distribution + error donut */}
      {!loading && data && (
        <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 300 }}>
            <Panel title="CONNECTIONS DISTRIBUTION" subtitle="COMPLETED JOBS ONLY">
              <DistributionChart
                distribution={data.distribution}
                totalDone={data.total_done}
              />
            </Panel>
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Panel title="ERROR BREAKDOWN" subtitle="FAILED JOBS">
              <ErrorDonutChart errorTypes={data.error_types} />
            </Panel>
          </div>
        </div>
      )}

      {/* Daily avg connections trend */}
      {!loading && data && (
        <div style={{ flexShrink: 0 }}>
          <Panel title="AVG CONNECTIONS PER DAY" subtitle="COMPLETED JOBS · UTC DATES">
            <DailyTrendChart daily={data.daily} />
          </Panel>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && data?.total_done === 0 && data?.total_failed === 0 && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 8,
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.4 }}>NO DATA</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 9, opacity: 0.5, letterSpacing: 1 }}>
            NO JOBS FOUND FOR THIS RANGE
          </span>
        </div>
      )}
    </div>
  );
}
