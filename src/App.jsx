import React, { useState, useCallback, useEffect } from 'react';
import { useLogs } from './hooks/useLogs.js';
import { JobsSidebar } from './components/JobsSidebar.jsx';
import { LogFilters } from './components/LogFilters.jsx';
import { LogStream } from './components/LogStream.jsx';
import { AppDashboard } from './pages/AppDashboard.jsx';
import { GeoDashboard } from './pages/GeoDashboard.jsx';
import { ProxyDashboard } from './pages/ProxyDashboard.jsx';
import { ErrorsDashboard } from './pages/ErrorsDashboard.jsx';
import { ScrapeDashboard } from './pages/ScrapeDashboard.jsx';
import { LoginPage } from './pages/LoginPage.jsx';

const NAV_ITEMS = ['LIVE LOGS', 'APP DASHBOARD', 'GEO INTELLIGENCE', 'PROXY PERFORMANCE', 'ERRORS', 'SCRAPE PERFORMANCE'];

function Dashboard() {
  const [activePage, setActivePage] = useState('LIVE LOGS');

  const {
    logs,
    liveMode,
    toggleLive,
    filters,
    updateFilter,
    page,
    totalPages,
    loading,
    goToPage,
  } = useLogs();

  const handleSelectJob = useCallback(
    (jobId) => updateFilter('jobId', jobId),
    [updateFilter],
  );

  function handleLogout() {
    localStorage.removeItem('auth_token');
    window.dispatchEvent(new Event('auth:logout'));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── Top nav ── */}
      <header style={{
        height: 'var(--header-height)',
        minHeight: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        paddingLeft: 20,
        paddingRight: 20,
        gap: 36,
        flexShrink: 0,
      }}>
        {/* Brand */}
        <span style={{
          color: 'var(--green)',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 2,
          whiteSpace: 'nowrap',
        }}>
          LI_SCRAPER
        </span>

        {/* Nav tabs */}
        <nav style={{ display: 'flex', gap: 28, alignItems: 'center', height: '100%', flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = item === activePage;
            return (
              <span
                key={item}
                onClick={() => setActivePage(item)}
                style={{
                  fontSize: 11,
                  letterSpacing: 1.2,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--green)' : 'var(--text-dim)',
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: active ? '2px solid var(--green)' : '2px solid transparent',
                  paddingTop: 2,
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                {item}
              </span>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 3,
            color: 'var(--text-muted)',
            fontSize: 10,
            letterSpacing: 1.2,
            padding: '5px 12px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          LOGOUT
        </button>
      </header>

      {/* ── Body ── */}
      {activePage === 'LIVE LOGS' ? (
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'var(--sidebar-width) 1fr',
          overflow: 'hidden',
        }}>
          <JobsSidebar
            selectedJobId={filters.jobId}
            onSelectJob={handleSelectJob}
            range={filters.range}
            statusFilter={filters.level}
            search={filters.search}
          />

          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <LogFilters
              filters={filters}
              onFilter={updateFilter}
              liveMode={liveMode}
              onToggleLive={toggleLive}
            />
            <LogStream
              logs={logs}
              liveMode={liveMode}
              loading={loading}
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              jobId={filters.jobId}
            />
          </div>
        </div>
      ) : activePage === 'APP DASHBOARD' ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <AppDashboard />
        </div>
      ) : activePage === 'GEO INTELLIGENCE' ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <GeoDashboard />
        </div>
      ) : activePage === 'PROXY PERFORMANCE' ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <ProxyDashboard />
        </div>
      ) : activePage === 'ERRORS' ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <ErrorsDashboard />
        </div>
      ) : activePage === 'SCRAPE PERFORMANCE' ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <ScrapeDashboard />
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 10,
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1.4 }}>
            {activePage}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, opacity: 0.5 }}>
            COMING SOON
          </span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('auth_token'));

  useEffect(() => {
    function onLogout() { setAuthed(false); }
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  return <Dashboard />;
}
