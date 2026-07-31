import { useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';

const pageTitles = {
  '/': 'Dashboard',
  '/search': 'New Search',
  '/results': 'Search Results',
  '/history': 'Search History',
};

export default function Navbar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Sherlock';

  return (
    <nav className="navbar">
      <div className="navbar__title">{title}</div>
      <div className="navbar__actions">
        <div className="navbar__status">
          <div className="navbar__status-dot" />
          <span>System Online</span>
        </div>
      </div>
    </nav>
  );
}
