import { NavLink, useLocation } from 'react-router-dom';
import { Search, Home, Clock, Settings, Shield } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Search, label: 'Search' },
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/history', icon: Clock, label: 'History' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__logo">🔍</div>
        <div className="sidebar__brand">
          <h1>SHERLOCK</h1>
          <span>OSINT Tool v1.0</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section-title">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <item.icon className="sidebar__link-icon" size={20} />
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar__section-title" style={{ marginTop: '24px' }}>
          Supported Platforms
        </div>
        {[
          { name: 'Instagram', icon: '📷', color: '#E4405F' },
          { name: 'Twitter / X', icon: '🐦', color: '#1DA1F2' },
          { name: 'Facebook', icon: '📘', color: '#1877F2' },
          { name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
          { name: 'TikTok', icon: '🎵', color: '#000' },
          { name: 'YouTube', icon: '▶️', color: '#FF0000' },
          { name: 'GitHub', icon: '🐙', color: '#181717' },
          { name: 'Reddit', icon: '🤖', color: '#FF4500' },
          { name: 'Telegram', icon: '✈️', color: '#0088CC' },
          { name: 'Discord', icon: '🎮', color: '#5865F2' },
        ].map((platform) => (
          <div
            key={platform.name}
            className="sidebar__link"
            style={{ cursor: 'default', fontSize: '0.8rem' }}
          >
            <span style={{ fontSize: '1rem' }}>{platform.icon}</span>
            {platform.name}
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="disclaimer" style={{ padding: '10px', fontSize: '0.7rem' }}>
          <Shield size={14} className="disclaimer__icon" />
          <span>For educational & research purposes only</span>
        </div>
        <div className="sidebar__footer-text" style={{ marginTop: '8px' }}>
          © 2026 Sherlock OSINT
        </div>
      </div>
    </aside>
  );
}
