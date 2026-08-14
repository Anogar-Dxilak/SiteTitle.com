import { motion } from 'framer-motion';
import { ExternalLink, AlertCircle, Clock, Ban } from 'lucide-react';

const platformColors = {
  Instagram: '#E4405F',
  Twitter: '#1DA1F2',
  'Twitter / X': '#1DA1F2',
  Facebook: '#1877F2',
  LinkedIn: '#0A66C2',
  TikTok: '#ff0050',
  YouTube: '#FF0000',
  GitHub: '#8b949e',
  Reddit: '#FF4500',
  Telegram: '#0088CC',
  Discord: '#5865F2',
  HackTheBox: '#9fef00',
  TryHackMe: '#00ff66',
  DockerHub: '#2496ed',
  Medium: '#00ab6c',
  GitLab: '#fc6d26',
  Twitch: '#9146ff',
  'Dev.to': '#00ff66',
};

const platformIcons = {
  Instagram: '📷',
  Twitter: '🐦',
  'Twitter / X': '🐦',
  Facebook: '📘',
  LinkedIn: '💼',
  TikTok: '🎵',
  YouTube: '▶️',
  GitHub: '🐙',
  Reddit: '🤖',
  Telegram: '✈️',
  Discord: '🎮',
  HackTheBox: '🟩',
  TryHackMe: '🔥',
  DockerHub: '🐳',
  Medium: '📝',
  GitLab: '🦊',
  Twitch: '👾',
  'Dev.to': '💻',
};

export default function ResultCard({ result, index = 0 }) {
  const platform = result.platform || result.name || 'Unknown';
  const username = result.username || '';
  const { status, url, profile_name, bio, followers, response_time_ms } = result;
  
  const color = platformColors[platform] || '#00ff66';
  const icon = platformIcons[platform] || '🌐';
  
  const statusLabels = {
    found: 'Found',
    not_found: 'Not Found',
    error: 'Error',
    rate_limited: 'Rate Limited',
  };

  const statusIcons = {
    found: '✅',
    not_found: '❌',
    error: <AlertCircle size={14} />,
    rate_limited: <Clock size={14} />,
  };

  return (
    <motion.div
      className={`result-card result-card--${status}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
    >
      <div
        className="result-card__platform-icon"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}
      >
        {icon}
      </div>

      <div className="result-card__info">
        <div className="result-card__platform-name">{platform}</div>
        <div className="result-card__username">@{username}</div>
        {profile_name && status === 'found' && (
          <div className="result-card__bio" style={{ color: 'var(--text-secondary)' }}>
            {profile_name}
          </div>
        )}
        {bio && status === 'found' && (
          <div className="result-card__bio">{bio}</div>
        )}
      </div>

      <div className="result-card__meta">
        {followers != null && status === 'found' && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {followers >= 1000000 
              ? `${(followers / 1000000).toFixed(1)}M` 
              : followers >= 1000 
                ? `${(followers / 1000).toFixed(1)}K` 
                : followers} followers
          </span>
        )}
        
        {response_time_ms && (
          <span className="result-card__time">{response_time_ms}ms</span>
        )}

        <span className={`result-card__status result-card__status--${status}`}>
          {statusLabels[status] || status}
        </span>

        {status === 'found' && url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="result-card__link"
          >
            <ExternalLink size={14} />
            Visit
          </a>
        )}
      </div>
    </motion.div>
  );
}
