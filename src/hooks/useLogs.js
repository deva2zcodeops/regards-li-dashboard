import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch, API_BASE } from '../utils/apiFetch.js';

const WS_BASE = API_BASE.replace(/^http/, 'ws');

// When a job_id is selected and the initial WS batch is empty, the drain
// thread may not have flushed logs to DB yet. Retry the REST endpoint up
// to RETRY_ATTEMPTS times before giving up.
const RETRY_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [500, 1000, 2000, 3000];

export function useLogs() {
  const [liveMode, setLiveMode] = useState(true);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    range: '7d',
    level: 'ALL',
    jobId: '',
    search: '',
  });
  // Static mode pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const retryTimersRef = useRef([]);

  // ── WebSocket connection ───────────────────────────────────
  const connectWs = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const params = new URLSearchParams({ range: filters.range });
    if (filters.jobId) params.set('job_id', filters.jobId);
    const token = localStorage.getItem('auth_token');
    if (token) params.set('token', token);

    const ws = new WebSocket(`${WS_BASE}/ws/logs?${params}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'initial') {
        if (msg.logs.length > 0) {
          setLogs(msg.logs);
        } else if (filters.jobId) {
          // Empty initial batch with a specific job selected — the drain
          // thread likely hasn't flushed yet. Retry via REST with backoff.
          retryTimersRef.current.forEach(clearTimeout);
          retryTimersRef.current = [];

          let attempt = 0;
          const retry = async () => {
            if (attempt >= RETRY_ATTEMPTS) return;
            const delay = RETRY_DELAYS_MS[attempt++];
            const timer = setTimeout(async () => {
              try {
                const params = new URLSearchParams({
                  range: filters.range,
                  job_id: filters.jobId,
                  limit: '200',
                });
                const res = await apiFetch(`/api/logs?${params}`);
                const data = await res.json();
                if (data.logs?.length > 0) {
                  setLogs(data.logs);
                } else {
                  retry();
                }
              } catch {
                retry();
              }
            }, delay);
            retryTimersRef.current.push(timer);
          };
          retry();
        }
      } else if (msg.type === 'log') {
        // Clear any pending retries — live logs are now flowing
        retryTimersRef.current.forEach(clearTimeout);
        retryTimersRef.current = [];
        setLogs((prev) => [...prev, msg.log]);
      }
    };

    ws.onerror = () => {
      console.warn('[ws] Connection error');
    };

    ws.onclose = () => {
      wsRef.current = null;
    };
  }, [filters]);

  const disconnectWs = useCallback(() => {
    retryTimersRef.current.forEach(clearTimeout);
    retryTimersRef.current = [];
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // ── Static fetch ──────────────────────────────────────────
  const fetchLogs = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        range: filters.range,
        page: String(targetPage),
        limit: '50',
      });
      if (filters.jobId) params.set('job_id', filters.jobId);

      const res = await apiFetch(`/api/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs);
      setPage(data.page);
      setTotalPages(data.pages);
    } catch (err) {
      console.error('[useLogs] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ── Mode switching ────────────────────────────────────────
  useEffect(() => {
    setLogs([]);
    if (liveMode) {
      disconnectWs();
      connectWs();
    } else {
      disconnectWs();
      fetchLogs(1);
    }
    return () => disconnectWs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMode, filters]);

  const toggleLive = useCallback(() => {
    setLiveMode((m) => !m);
  }, []);

  const updateFilter = useCallback((key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }, []);

  const goToPage = useCallback((p) => {
    if (!liveMode) fetchLogs(p);
  }, [liveMode, fetchLogs]);

  return {
    logs,
    liveMode,
    toggleLive,
    filters,
    updateFilter,
    page,
    totalPages,
    loading,
    goToPage,
    wsRef,
  };
}
