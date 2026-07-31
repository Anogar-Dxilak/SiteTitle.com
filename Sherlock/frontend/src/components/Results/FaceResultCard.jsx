import { motion } from 'framer-motion';
import { ExternalLink, UserCheck, Globe } from 'lucide-react';

export default function FaceResultCard({ result, index = 0 }) {
  const {
    platform = 'Web Page',
    platform_icon = '🌐',
    title,
    username,
    url,
    thumbnail_url,
    description,
    is_social_profile,
  } = result;

  return (
    <motion.div
      className={`result-card ${is_social_profile ? 'result-card--found' : ''}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      style={{
        borderColor: is_social_profile ? 'var(--accent-cyan)' : 'var(--border-color)',
        background: is_social_profile ? 'rgba(6, 182, 212, 0.04)' : 'var(--bg-card)',
      }}
    >
      {/* Thumbnail / Avatar */}
      {thumbnail_url ? (
        <div style={{
          width: 56,
          height: 56,
          borderRadius: is_social_profile ? '50%' : 'var(--radius-md)',
          overflow: 'hidden',
          flexShrink: 0,
          border: `2px solid ${is_social_profile ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
          background: '#0d1322',
        }}>
          <img
            src={thumbnail_url}
            alt={title || 'Match'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      ) : (
        <div style={{
          width: 56,
          height: 56,
          borderRadius: is_social_profile ? '50%' : 'var(--radius-md)',
          background: is_social_profile ? 'var(--accent-cyan-dim)' : 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          flexShrink: 0,
        }}>
          {platform_icon}
        </div>
      )}

      {/* Info */}
      <div className="result-card__info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '1.1rem' }}>{platform_icon}</span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: is_social_profile ? 'var(--accent-cyan)' : 'var(--text-muted)',
          }}>
            {platform} {is_social_profile && '• Social Profile'}
          </span>
        </div>

        <div className="result-card__platform-name" style={{ fontSize: '1rem', fontWeight: 700 }}>
          {title || 'Matching Result'}
        </div>

        {username && (
          <div className="result-card__username" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
            @{username}
          </div>
        )}

        {description && (
          <div className="result-card__bio" style={{ marginTop: '4px' }}>{description}</div>
        )}
      </div>

      {/* Action */}
      <div className="result-card__meta">
        {is_social_profile && (
          <span style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'var(--accent-green-dim)',
            color: 'var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <UserCheck size={12} /> Profile Match
          </span>
        )}

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn ${is_social_profile ? 'btn--primary' : 'btn--ghost'} btn--sm`}
          style={{ textDecoration: 'none' }}
        >
          <ExternalLink size={14} />
          {is_social_profile ? 'Visit Profile' : 'Open Page'}
        </a>
      </div>
    </motion.div>
  );
}
