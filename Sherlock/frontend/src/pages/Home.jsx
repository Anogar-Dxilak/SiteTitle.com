import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Image, Users, Zap, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import GlassCard from '../components/Common/GlassCard';
import { getStats, getHistory } from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    // Load stats and recent searches
    getStats().then(setStats).catch(() => {});
    getHistory(5).then(data => setRecentSearches(data.items || [])).catch(() => {});
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="page-content">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '48px' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: '20px',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              margin: '0 auto 24px',
              boxShadow: 'var(--shadow-glow-cyan)',
            }}
          >
            🔍
          </motion.div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            marginBottom: '12px',
            letterSpacing: '-0.5px',
          }}>
            Welcome to <span className="text-gradient">SHERLOCK</span>
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            Advanced OSINT tool for discovering social media profiles. 
            Search by username or face photo across 10+ platforms.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={itemVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <GlassCard
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/search')}
            id="quick-username-search"
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '14px',
                background: 'var(--accent-cyan-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Search size={24} color="var(--accent-cyan)" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                  Username Search
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Search for a username across Instagram, Twitter, GitHub, and 7 more platforms simultaneously.
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '12px',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}>
                  Start Searching <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/search?tab=face')}
            id="quick-face-search"
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '14px',
                background: 'var(--accent-magenta-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Image size={24} color="var(--accent-magenta)" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                  Face Search
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Upload a face photo and find matching profiles using Yandex reverse image search.
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '12px',
                  color: 'var(--accent-magenta)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}>
                  Upload Photo <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Statistics
          </h2>
          <div className="stats-grid">
            {[
              { label: 'Total Searches', value: stats?.total_searches || 0, icon: <Search size={20} />, color: 'var(--accent-cyan)', bgColor: 'var(--accent-cyan-dim)' },
              { label: 'Profiles Found', value: stats?.total_profiles_found || 0, icon: <Users size={20} />, color: 'var(--accent-green)', bgColor: 'var(--accent-green-dim)' },
              { label: 'Username Searches', value: stats?.username_searches || 0, icon: <Zap size={20} />, color: 'var(--accent-blue)', bgColor: 'var(--accent-blue-dim)' },
              { label: 'Avg Duration', value: `${stats?.average_duration_ms || 0}ms`, icon: <Clock size={20} />, color: 'var(--accent-purple)', bgColor: 'var(--accent-purple-dim)' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div
                  className="stat-card__icon"
                  style={{ background: stat.bgColor, color: stat.color }}
                >
                  {stat.icon}
                </div>
                <div className="stat-card__value" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="stat-card__label">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <motion.div variants={itemVariants} style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Recent Searches
              </h2>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => navigate('/history')}
              >
                View All <ArrowRight size={14} />
              </button>
            </div>
            <GlassCard>
              {recentSearches.map((item, i) => (
                <div
                  key={item.search_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: i < recentSearches.length - 1 ? '1px solid var(--border-color)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      background: item.search_type === 'username' ? 'var(--accent-cyan-dim)' : 'var(--accent-magenta-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                    }}>
                      {item.search_type === 'username' ? '🔍' : '📷'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
                        {item.query}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'var(--accent-green)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {item.total_found}/{item.total_checked} found
                    </span>
                  </div>
                </div>
              ))}
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
