import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Trash2, Search, Image, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/Common/GlassCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { getHistory, clearHistory, getStats } from '../services/api';
import { toast } from 'react-hot-toast';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [historyData, statsData] = await Promise.all([
        getHistory(50),
        getStats(),
      ]);
      setHistory(historyData.items || []);
      setStats(statsData);
    } catch {
      // API may not be running
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClear = async () => {
    try {
      await clearHistory();
      setHistory([]);
      setStats(null);
      toast.success('History cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <LoadingSpinner text="Loading history..." />
      </div>
    );
  }

  return (
    <div className="page-content">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
              <span className="text-gradient">Search History</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Your recent investigations and search results.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn--ghost btn--sm" onClick={fetchData}>
              <RefreshCw size={14} /> Refresh
            </button>
            {history.length > 0 && (
              <button className="btn btn--danger btn--sm" onClick={handleClear}>
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="stats-grid" style={{ marginBottom: '32px' }}>
            <div className="stat-card">
              <div className="stat-card__icon" style={{ background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)' }}>
                <Search size={20} />
              </div>
              <div className="stat-card__value" style={{ color: 'var(--accent-cyan)' }}>
                {stats.total_searches}
              </div>
              <div className="stat-card__label">Total Searches</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__icon" style={{ background: 'var(--accent-green-dim)', color: 'var(--accent-green)' }}>
                <Search size={20} />
              </div>
              <div className="stat-card__value" style={{ color: 'var(--accent-green)' }}>
                {stats.total_profiles_found}
              </div>
              <div className="stat-card__label">Profiles Found</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__icon" style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}>
                <Clock size={20} />
              </div>
              <div className="stat-card__value" style={{ color: 'var(--accent-purple)' }}>
                {stats.average_duration_ms}ms
              </div>
              <div className="stat-card__label">Avg Duration</div>
            </div>
          </div>
        )}

        {/* History List */}
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📋</div>
            <h3 className="empty-state__title">No search history yet</h3>
            <p className="empty-state__text">
              Start a new investigation to see your search history here.
            </p>
            <button
              className="btn btn--primary"
              style={{ marginTop: '20px' }}
              onClick={() => navigate('/search')}
            >
              <Search size={16} /> Start Searching
            </button>
          </div>
        ) : (
          <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
            {history.map((item, i) => (
              <motion.div
                key={item.search_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 24px',
                  borderBottom: i < history.length - 1 ? '1px solid var(--border-color)' : 'none',
                  transition: 'background var(--transition-fast)',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: item.search_type === 'username' ? 'var(--accent-cyan-dim)' : 'var(--accent-magenta-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {item.search_type === 'username' ? (
                      <Search size={18} color="var(--accent-cyan)" />
                    ) : (
                      <Image size={18} color="var(--accent-magenta)" />
                    )}
                  </div>
                  <div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                    }}>
                      {item.query}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.search_type === 'username' ? 'Username Search' : 'Face Search'} • {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    background: item.total_found > 0 ? 'var(--accent-green-dim)' : 'rgba(100,116,139,0.1)',
                    color: item.total_found > 0 ? 'var(--accent-green)' : 'var(--text-muted)',
                  }}>
                    {item.total_found}/{item.total_checked} found
                  </span>
                  {item.duration_ms && (
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {item.duration_ms}ms
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </GlassCard>
        )}
      </motion.div>
    </div>
  );
}
