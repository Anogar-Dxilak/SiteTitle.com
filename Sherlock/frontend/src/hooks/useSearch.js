import { useState, useCallback, useRef } from 'react';
import { searchUsername, searchByFace, createSearchWebSocket } from '../services/api';

export function useSearch() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveResults, setLiveResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState(null);
  const wsRef = useRef(null);

  // REST-based username search (Fast & Reliable)
  const searchByUsername = useCallback(async (username, platforms = null) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setLiveResults([]);
    
    try {
      const data = await searchUsername(username, platforms);
      setResults(data);
      return data;
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Search failed or timed out';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time username search via WebSocket with automatic REST fallback
  const searchByUsernameRealtime = useCallback((username, platforms = null) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setLiveResults([]);
    setSearchStatus('Starting search...');

    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
    }

    let isCompleted = false;

    try {
      const ws = createSearchWebSocket('username');
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ username, platforms }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status') {
            setSearchStatus(data.message);
          } else if (data.type === 'result') {
            setLiveResults(prev => [...prev, data.data]);
          } else if (data.type === 'complete') {
            isCompleted = true;
            setLoading(false);
            setSearchStatus(null);
            setResults({
              search_id: data.search_id,
              total_found: data.total_found,
              total_checked: data.total_checked,
              duration_ms: data.duration_ms,
            });
          } else if (data.type === 'error') {
            setError(data.message);
            setLoading(false);
          }
        } catch {
          // JSON parse error
        }
      };

      ws.onerror = () => {
        if (!isCompleted) {
          // Fallback to REST API on WebSocket error
          searchByUsername(username, platforms).catch(() => {});
        }
      };

      ws.onclose = () => {
        if (!isCompleted) {
          setLoading(false);
        }
      };
    } catch {
      // If WebSocket creation fails, fallback to REST API
      searchByUsername(username, platforms).catch(() => {});
    }
  }, [searchByUsername]);

  // Face photo search
  const searchFace = useCallback(async (file, engines = null) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setLiveResults([]);
    setSearchStatus('Analysing face and searching platforms...');
    
    try {
      const data = await searchByFace(file, engines);
      setResults(data);
      return data;
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Face search failed or timed out';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
      setSearchStatus(null);
    }
  }, []);

  const cancelSearch = useCallback(() => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    setLoading(false);
    setSearchStatus(null);
  }, []);

  const reset = useCallback(() => {
    setResults(null);
    setLiveResults([]);
    setError(null);
    setLoading(false);
    setSearchStatus(null);
    cancelSearch();
  }, [cancelSearch]);

  return {
    results,
    liveResults,
    loading,
    error,
    searchStatus,
    searchByUsername,
    searchByUsernameRealtime,
    searchFace,
    cancelSearch,
    reset,
  };
}
