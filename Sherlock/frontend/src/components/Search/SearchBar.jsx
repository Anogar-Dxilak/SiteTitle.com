import { useState } from 'react';
import { Search, Zap } from 'lucide-react';

export default function SearchBar({ onSearch, loading = false, placeholder = 'Enter username...' }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSearch(query.trim());
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-bar__input-wrapper">
        <Search className="search-bar__icon" size={20} />
        <input
          type="text"
          className="search-bar__input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          id="search-input"
          autoComplete="off"
          spellCheck="false"
        />
        <button
          type="submit"
          className="search-bar__button"
          disabled={!query.trim() || loading}
          id="search-button"
        >
          {loading ? (
            <>
              <div className="loading-spinner__ring" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Searching...
            </>
          ) : (
            <>
              <Zap size={16} />
              Hunt
            </>
          )}
        </button>
      </div>
    </form>
  );
}
