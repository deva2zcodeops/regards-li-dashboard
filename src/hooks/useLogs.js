import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch, API_BASE } from '../utils/apiFetch.js';
import { LOG_BUFFER_MAX } from '../constants.js';

const WS_BASE = API_BASE.replace(/^http/, 'ws');

const WS_RECONNECT_DELAY_MS = 3000;

export function useLogs() {
  const [liveMode, setLiveMode] = useState(true);
  const [logs, setLogs] = useState([]);
  const [isArchived, setIsArchived] = useState(false);
  const [filters, setFilters] = useState({
    range: '7d',
    level: 'ALL',
    jobId: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const wsRef = useRef(null);
  const generationRef = useRef(0);
  const retryTimersRef = useRef([]);

  const disconnectWs = useCallback(() => {
    generationRef.current += 1; // invalidate all pending retries/reconnects
    retryTimersRef.current.forEach(clearTimeout);
    retryTimersRef.current = [];
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsConnected(false);
  }, []);

  // connectWs has empty deps — it's a stable reference so it can safely call itself
  // recursively inside the onclose reconnect handler.
  const connectWs = useCallback((range, jobId) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const generation = generationRef.current;

    const params = new URLSearchParams({ range });
    if (jobId) params.set('job_id', jobId);
    const token = localStorage.getItem('auth_token');
    if (token) params.set('token', token);

    const ws = new WebSocket(`${WS_BASE}/ws/logs?${params}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (generationRef.current !== generation) return;
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      if (generationRef.current !== generation) return;
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === 'initial') {
        if (msg.logs.length > 0) {
          setLogs(msg.logs);
        } else if (jobId) {
          // Empty initial batch — check archive directly
          (async () => {
            try {
              const archiveRes = await apiFetch(`/api/archives/${jobId}/view`);
              if (archiveRes.ok) {
                const archiveData = await archiveRes.json();
                if (generationRef.current !== generation) return;
                if (archiveData.logs?.length > 0) {
                  setLogs(archiveData.logs);
                  setIsArchived(true);
                }
              }
            } catch { /* no archive — leave empty */ }
          })();
        }
      } else if (msg.type === 'log') {
        // Live log arrived — cancel any pending retries
        retryTimersRef.current.forEach(clearTimeout);
        retryTimersRef.current = [];
        setLogs((prev) => {
          const next = [...prev, msg.log];
          return next.length > LOG_BUFFER_MAX ? next.slice(-LOG_BUFFER_MAX) : next;
        });
      }
    };

    ws.onerror = () => {
      console.warn('[ws] Connection error');
    };

    ws.onclose = () => {
      if (generationRef.current !== generation) return;
      wsRef.current = null;
      setWsConnected(false);
      // Reconnect after backoff — connectWs is stable so this self-reference is safe
      const timer = setTimeout(() => {
        if (generationRef.current !== generation) return;
        connectWs(range, jobId);
      }, WS_RECONNECT_DELAY_MS);
      retryTimersRef.current.push(timer);
    };
  }, []); // stable — only reads refs and state setters

  const fetchLogs = useCallback(async (range, jobId, targetPage = 1) => {
    setLoading(true);
    setFetchError(null);
    setIsArchived(false);
    try {
      const params = new URLSearchParams({ range, page: String(targetPage), limit: '50' });
      if (jobId) params.set('job_id', jobId);

      const res = await apiFetch(`/api/logs?${params}`);
      const data = await res.json();

      if (!data.logs?.length && jobId && targetPage === 1) {
        // No DB logs — fall back to archive
        try {
          const archiveRes = await apiFetch(`/api/archives/${jobId}/view`);
          if (archiveRes.ok) {
            const archiveData = await archiveRes.json();
            if (archiveData.logs?.length > 0) {
              setLogs(archiveData.logs);
              setIsArchived(true);
              return;
            }
          }
        } catch { /* archive not found — fall through */ }
      }

      setLogs(data.logs || []);
      setPage(data.page);
      setTotalPages(data.pages);
    } catch (err) {
      console.error('[useLogs] fetch error:', err);
      setFetchError(err.message || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { range, jobId } = filters;
    setLogs([]);
    setIsArchived(false);
    setFetchError(null);
    if (liveMode) {
      disconnectWs();
      connectWs(range, jobId);
    } else {
      disconnectWs();
      fetchLogs(range, jobId, 1);
    }
    return () => disconnectWs();
  }, [liveMode, filters.range, filters.jobId, connectWs, disconnectWs, fetchLogs]);

  const toggleLive = useCallback(() => {
    setLiveMode((m) => !m);
  }, []);

  const updateFilter = useCallback((key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }, []);

  const goToPage = useCallback((p) => {
    if (!liveMode) fetchLogs(filters.range, filters.jobId, p);
  }, [liveMode, fetchLogs, filters.range, filters.jobId]);

  return {
    logs,
    isArchived,
    liveMode,
    toggleLive,
    filters,
    updateFilter,
    page,
    totalPages,
    loading,
    goToPage,
    wsConnected,
    fetchError,
  };
}
