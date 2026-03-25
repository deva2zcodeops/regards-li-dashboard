import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useLogs } from './hooks/useLogs.js';
import { JobsSidebar } from './components/JobsSidebar.jsx';
import { LogFilters } from './components/LogFilters.jsx';
import { LogStream } from './components/LogStream.jsx';
import { AppDashboard } from './pages/AppDashboard.jsx';
import { GeoDashboard } from './pages/GeoDashboard.jsx';
import { ProxyDashboard } from './pages/ProxyDashboard.jsx';
import { ErrorsDashboard } from './pages/ErrorsDashboard.jsx';
import { ScrapeDashboard } from './pages/ScrapeDashboard.jsx';
import { ArchivesDashboard } from './pages/ArchivesDashboard.jsx';
import { LoginPage } from './pages/LoginPage.jsx';

const NAV_ITEMS = [
  { label: 'LIVE LOGS',          path: '/' },
  { label: 'APP DASHBOARD',      path: '/app' },
  { label: 'GEO INTELLIGENCE',   path: '/geo' },
  { label: 'PROXY PERFORMANCE',  path: '/proxy' },
  { label: 'ERRORS',             path: '/errors' },
  { label: 'SCRAPE PERFORMANCE', path: '/scrape' },
  { label: 'LOG ARCHIVES',       path: '/archives' },
];

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation(); // used for active nav highlight

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

  const handleViewJobLogs = useCallback((jobId) => {
    updateFilter('jobId', jobId);
    navigate('/');
  }, [updateFilter, navigate]);

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
          {NAV_ITEMS.map(({ label, path }) => {
            const active = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);
            return (
              <NavLink
                key={path}
                to={path}
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
                  textDecoration: 'none',
                }}
              >
                {label}
              </NavLink>
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
      <Routes>
        <Route path="/" element={
          <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'var(--sidebar-width) 1fr',
            overflow: 'hidden',
            minHeight: 0,
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
        } />
        <Route path="/app"      element={<div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}><AppDashboard onViewJobLogs={handleViewJobLogs} /></div>} />
        <Route path="/geo"      element={<div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}><GeoDashboard /></div>} />
        <Route path="/proxy"    element={<div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}><ProxyDashboard /></div>} />
        <Route path="/errors"   element={<div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}><ErrorsDashboard /></div>} />
        <Route path="/scrape"   element={<div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}><ScrapeDashboard /></div>} />
        <Route path="/archives" element={<div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}><ArchivesDashboard /></div>} />
      </Routes>
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

  return (
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
}
