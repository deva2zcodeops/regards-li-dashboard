import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

import { apiFetch } from '@/utils/apiFetch.js';
import { StatCard } from '@/components/StatCard.jsx';
import { Panel } from '@/components/Panel.jsx';
import { RANGES, ERROR_COLORS } from '@/constants.js';
import { DashboardHeader } from '@/components/DashboardHeader.jsx';
import { FetchErrorBanner } from '@/components/FetchErrorBanner.jsx';
import styles from '@/components/DashboardPage.module.css';

// ── Line Chart — daily failure rate ──────────────────────────────────────────

function FailureLineChart({ daily }) {
  if (!daily || daily.length === 0) {
    return (
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>NO DATA</span>
      </div>
    );
  }

  const chartData = daily.map((d) => {
    let label = String(d.date);
    try { label = format(parseISO(String(d.date)), 'MMM d'); } catch {}
    return { ...d, label, rate: parseFloat(d.rate) };
  });

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'inherit' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'inherit' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <ReTooltip
          contentStyle={{
            background: 'var(--surface-2)',
            border: '1px solid rgba(239,83,80,0.4)',
            borderRadius: 4,
            fontSize: 10,
            color: 'var(--text)',
            fontFamily: 'inherit',
          }}
          formatter={(val, _name, props) => [
            `${val}% (${props.payload.failed}/${props.payload.total} failed)`,
            'Failure Rate',
          ]}
          labelStyle={{ color: 'var(--text-muted)', marginBottom: 4 }}
        />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="#ef5350"
          strokeWidth={2}
          dot={{ r: 3, fill: '#ef5350', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#ef5350' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Donut Chart — error type breakdown ───────────────────────────────────────

function ErrorDonutChart({ errorTypes }) {
  const [activeIdx, setActiveIdx] = useState(null);

  const total = errorTypes.reduce((s, e) => s + e.count, 0);

  if (total === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      <div style={{ width: 180, height: 180, flexShrink: 0, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={80}
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
        {/* Center label overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
            {active ? active.value.toLocaleString() : total.toLocaleString()}
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            {active ? `${active.pct}%` : 'TOTAL'}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 160 }}>
        {data.map((e, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'default',
              opacity: activeIdx == null || activeIdx === i ? 1 : 0.4,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <div style={{ width: 8, height: 8, borderRadius: 1, background: e.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text)', flex: 1, letterSpacing: 0.3 }}>
              {e.name}
            </span>
            <span style={{ fontSize: 10, color: e.color, fontWeight: 700, minWidth: 36, textAlign: 'right' }}>
              {e.pct}%
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', minWidth: 28, textAlign: 'right' }}>
              {e.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar Chart — failures by hour ─────────────────────────────────────────────

function HourlyBarChartTooltip({ active, payload, label, tzLabel }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid rgba(239,83,80,0.4)',
      borderRadius: 4, padding: '6px 10px', fontSize: 10,
      fontFamily: 'inherit',
    }}>
      <div style={{ color: '#ef5350', fontWeight: 700, marginBottom: 2 }}>
        {label} {tzLabel}
      </div>
      <div style={{ color: 'var(--text-muted)' }}>
        {d.failed} failed / {d.total} total
      </div>
    </div>
  );
}

function HourlyBarChart({ hourlyUtc }) {
  const tzLabel = useMemo(() => {
    const off  = -new Date().getTimezoneOffset();
    const h    = Math.floor(Math.abs(off) / 60);
    const m    = Math.abs(off) % 60;
    const sign = off >= 0 ? '+' : '-';
    return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }, []);

  const localHourly = useMemo(() => {
    const tzOffsetMinutes = new Date().getTimezoneOffset();
    const buckets = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}h`,
      failed: 0,
      total: 0,
    }));
    hourlyUtc.forEach(({ hour, total, failed }) => {
      const localMins = hour * 60 - tzOffsetMinutes;
      const localHour = Math.floor(((localMins % 1440) + 1440) % 1440 / 60);
      buckets[localHour].failed += failed;
      buckets[localHour].total  += total;
    });
    return buckets;
  }, [hourlyUtc]);

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart
        data={localHourly}
        margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
        barCategoryGap="20%"
      >
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="hour"
          tick={{ fill: 'var(--text-muted)', fontSize: 8, fontFamily: 'inherit' }}
          axisLine={false}
          tickLine={false}
          interval={5}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 8, fontFamily: 'inherit' }}
          axisLine={false}
          tickLine={false}
          width={24}
          allowDecimals={false}
        />
        <ReTooltip
          content={(props) => <HourlyBarChartTooltip {...props} tzLabel={tzLabel} />}
          cursor={{ fill: 'rgba(239,83,80,0.08)' }}
        />
        <Bar dataKey="failed" fill="#ef5350" radius={[2, 2, 0, 0]} opacity={0.8} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Top Users Table ───────────────────────────────────────────────────────────

function TopUsersTable({ users }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, letterSpacing: 1.6, color: 'var(--text-dim)', fontWeight: 600 }}>
          TOP FAILING USERS
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>SORTED BY FAILURE RATE</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 72px 72px 88px 1fr',
        padding: '5px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        {['USER', 'TOTAL', 'FAILED', 'RATE', 'MOST COMMON ERROR'].map((h, i) => (
          <span key={h} style={{
            fontSize: 9, letterSpacing: 1.3, color: 'var(--text-muted)',
            textAlign: i >= 1 && i <= 3 ? 'right' : 'left',
          }}>
            {h}
          </span>
        ))}
      </div>

      <div style={{ overflowY: 'auto', maxHeight: 320 }}>
        {users.length === 0 ? (
          <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>
            NO FAILURES
          </div>
        ) : users.map((u, i) => {
          const rate      = parseFloat(u.failure_rate);
          const rateColor = rate >= 50 ? 'var(--red)' : rate >= 25 ? '#ffb74d' : 'var(--text-dim)';
          const errColor  = ERROR_COLORS[u.most_common_error] || 'var(--text-muted)';
          return (
            <div key={u.user_id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 72px 72px 88px 1fr',
              padding: '7px 14px',
              borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
              background: i % 2 === 0 ? 'transparent' : 'var(--surface)',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 10, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.user_id}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {u.total.toLocaleString()}
              </span>
              <span style={{ fontSize: 10, color: 'var(--red)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {u.failed.toLocaleString()}
              </span>
              <span style={{ fontSize: 11, color: rateColor, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {u.failure_rate}%
              </span>
              <span style={{ fontSize: 9, color: errColor, letterSpacing: 0.5, paddingLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.most_common_error}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ErrorsDashboard() {
  const [range, setRange]     = useState('7d');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch(`/api/errors?range=${range}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d)  => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [range]);

  const worstHour = useMemo(() => {
    if (!data?.hourly_utc) return null;
    const tzOffsetMinutes = new Date().getTimezoneOffset();
    const buckets = Array.from({ length: 24 }, () => 0);
    data.hourly_utc.forEach(({ hour, failed }) => {
      const localMins = hour * 60 - tzOffsetMinutes;
      const localHour = Math.floor(((localMins % 1440) + 1440) % 1440 / 60);
      buckets[localHour] += failed;
    });
    const max = Math.max(...buckets);
    if (max === 0) return null;
    return buckets.indexOf(max);
  }, [data]);

  const failureRateColor = data
    ? parseFloat(data.failure_rate) >= 30 ? 'var(--red)'
    : parseFloat(data.failure_rate) >= 10 ? '#ffb74d'
    : 'var(--text)'
    : 'var(--text)';

  return (
    <div className={styles.page}>

      <DashboardHeader
        title="ERROR & RELIABILITY"
        subtitle="FAILURE PATTERNS, ERROR TYPES & USER RELIABILITY"
        range={range}
        onRangeChange={setRange}
        ranges={RANGES}
      />

      <FetchErrorBanner error={error} />

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        <StatCard
          label="TOTAL FAILURES"
          value={loading ? '…' : data?.total_failures.toLocaleString()}
          sublabel={`of ${loading ? '…' : data?.total_jobs.toLocaleString()} total jobs`}
          accent="var(--red)"
          info="Number of jobs that ended with status = failed in the selected range."
        />
        <StatCard
          label="FAILURE RATE"
          value={loading ? '…' : `${data?.failure_rate}%`}
          sublabel={`last ${range === 'all' ? 'all time' : range}`}
          accent={failureRateColor}
          info="Failed jobs as a percentage of all jobs submitted. Above 30% is a signal that something systematic is wrong (cookie expiry, IP blocks, or proxy gaps)."
        />
        <StatCard
          label="MOST COMMON ERROR"
          value={loading ? '…' : (data?.most_common_error ?? 'none')}
          sublabel="by count across all failed jobs"
          accent={data?.most_common_error ? (ERROR_COLORS[data.most_common_error] || 'var(--text)') : 'var(--text-muted)'}
          info="The error category appearing most often across all failed jobs. Use this to triage: 429 = slow down, 401/403 = check cookies, Proxy Error = SOAX coverage gap."
        />
        <StatCard
          label="WORST HOUR"
          value={loading ? '…' : (worstHour != null ? `${String(worstHour).padStart(2, '0')}:00` : '—')}
          sublabel="local time · highest failure count"
          accent="#ffb74d"
          info="The local hour of day with the highest number of failures. Clusters during business hours suggest LinkedIn's anti-bot is most aggressive then."
        />
      </div>

      {/* Charts row */}
      {!loading && data && (
        <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 300 }}>
            <Panel title="FAILURE RATE OVER TIME" subtitle="DAILY · UTC DATES">
              <FailureLineChart daily={data.daily} />
            </Panel>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Panel title="ERROR BREAKDOWN">
              <ErrorDonutChart errorTypes={data.error_types} />
            </Panel>
          </div>
        </div>
      )}

      {/* Hourly bar */}
      {!loading && data && (
        <div style={{ flexShrink: 0 }}>
          <Panel title="FAILURES BY HOUR OF DAY" subtitle="LOCAL TIME · HOVER FOR DETAIL">
            <HourlyBarChart hourlyUtc={data.hourly_utc} />
          </Panel>
        </div>
      )}

      {/* Top users */}
      {!loading && data && (
        <div style={{ flexShrink: 0 }}>
          <TopUsersTable users={data.top_users} />
        </div>
      )}

      {!loading && !error && data?.total_failures === 0 && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 8,
        }}>
          <span style={{ color: 'var(--green)', fontSize: 11, letterSpacing: 1.4 }}>NO FAILURES</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 9, opacity: 0.5, letterSpacing: 1 }}>
            ALL JOBS COMPLETED SUCCESSFULLY IN THIS RANGE
          </span>
        </div>
      )}
    </div>
  );
}
