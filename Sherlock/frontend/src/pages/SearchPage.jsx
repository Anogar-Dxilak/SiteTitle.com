import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Image, User, Scan, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

import SearchBar from '../components/Search/SearchBar';
import PhotoUpload from '../components/Search/PhotoUpload';
import ResultCard from '../components/Results/ResultCard';
import FaceResultCard from '../components/Results/FaceResultCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import GlassCard from '../components/Common/GlassCard';
import { useSearch } from '../hooks/useSearch';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'face' ? 'face' : 'username';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const {
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
  } = useSearch();

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
    if (file) {
      reset();
    }
  }, [reset]);

  const handleUsernameSearch = useCallback((username) => {
    toast.loading(`Searching for "${username}"...`, { id: 'search' });
    
    // Try WebSocket first, fall back to REST
    try {
      searchByUsernameRealtime(username);
    } catch {
      searchByUsername(username);
    }
  }, [searchByUsernameRealtime, searchByUsername]);

  const handleFaceSearch = useCallback(async () => {
    if (!selectedFile) {
      toast.error('Please upload a photo first');
      return;
    }
    
    toast.loading('Searching by face...', { id: 'search' });
    try {
      await searchFace(selectedFile);
      toast.success('Face search complete!', { id: 'search' });
    } catch {
      toast.error('Face search failed', { id: 'search' });
    }
  }, [selectedFile, searchFace]);

  // Dismiss search toast when results arrive or error occurs
  useEffect(() => {
    if (!loading) {
      toast.dismiss('search');
    }
  }, [loading]);

  // Determine what results to show
  const platformResults = liveResults.length > 0 ? liveResults : (results?.platform_results || []);
  const faceResults = results?.face_results || [];
  const foundResults = platformResults.filter(r => r.status === 'found');
  const otherResults = platformResults.filter(r => r.status !== 'found');

  const handleExport = () => {
    const data = activeTab === 'username' ? platformResults : faceResults;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sherlock-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Results exported!');
  };

  return (
    <div className="page-content">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
            <span className="text-gradient">New Investigation</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Choose your search method and start hunting for profiles.
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'username' ? 'tab--active' : ''}`}
            onClick={() => { setActiveTab('username'); reset(); }}
            id="tab-username"
          >
            <User size={18} />
            Username Search
          </button>
          <button
            className={`tab ${activeTab === 'face' ? 'tab--active' : ''}`}
            onClick={() => { setActiveTab('face'); reset(); }}
            id="tab-face"
          >
            <Scan size={18} />
            Face Search
          </button>
        </div>

        {/* Search Input Area */}
        <GlassCard style={{ marginBottom: '24px' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'username' ? (
              <motion.div
                key="username"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <SearchBar
                  onSearch={handleUsernameSearch}
                  loading={loading}
                  placeholder="Enter a username to search (e.g., johndoe)"
                />
                <div className="disclaimer" style={{ marginTop: '16px' }}>
                  <AlertTriangle size={14} className="disclaimer__icon" />
                  <span>
                    This tool searches for publicly available profiles only. 
                    Use responsibly and in compliance with applicable laws.
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="face"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <PhotoUpload
                  onFileSelect={handleFileSelect}
                  loading={loading}
                />
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                  <button
                    className="btn btn--primary btn--lg"
                    onClick={handleFaceSearch}
                    disabled={!selectedFile || loading}
                    id="face-search-button"
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner__ring" style={{ width: 18, height: 18, borderWidth: 2 }} />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Scan size={20} />
                        Search by Face
                      </>
                    )}
                  </button>
                </div>
                <div className="disclaimer" style={{ marginTop: '16px' }}>
                  <AlertTriangle size={14} className="disclaimer__icon" />
                  <span>
                    Face search uses Yandex reverse image search. Results depend on publicly indexed images.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Loading State */}
        {loading && liveResults.length === 0 && (
          <LoadingSpinner text={searchStatus || 'Scanning platforms...'} />
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '16px 20px',
              background: 'var(--accent-red-dim)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-red)',
              marginBottom: '24px',
            }}
          >
            ⚠️ {error}
          </motion.div>
        )}

        {/* Username Results */}
        {activeTab === 'username' && platformResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Summary */}
            <div className="search-summary">
              <div className="search-summary__left">
                <div className="search-summary__query">
                  @{results?.query || liveResults[0]?.username}
                </div>
                <div className="search-summary__stats">
                  <span className="search-summary__stat">
                    <strong style={{ color: 'var(--accent-green)' }}>{foundResults.length}</strong> found
                  </span>
                  <span className="search-summary__stat">
                    <strong>{platformResults.length}</strong> checked
                  </span>
                  {results?.duration_ms && (
                    <span className="search-summary__stat">
                      <strong>{results.duration_ms}ms</strong> duration
                    </span>
                  )}
                </div>
              </div>
              {platformResults.length > 0 && (
                <button className="btn btn--ghost btn--sm" onClick={handleExport}>
                  <Download size={14} /> Export
                </button>
              )}
            </div>

            {/* Found Results */}
            {foundResults.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '0.85rem',
                  color: 'var(--accent-green)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  marginBottom: '12px',
                }}>
                  ✅ Found ({foundResults.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {foundResults.map((result, i) => (
                    <ResultCard key={result.platform} result={result} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Not Found / Other */}
            {otherResults.length > 0 && (
              <div>
                <h3 style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  marginBottom: '12px',
                }}>
                  Other Results ({otherResults.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {otherResults.map((result, i) => (
                    <ResultCard key={result.platform} result={result} index={i} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Face Results */}
        {activeTab === 'face' && faceResults.length > 0 && (() => {
          const socialFaceResults = faceResults.filter(r => r.is_social_profile);
          const webFaceResults = faceResults.filter(r => !r.is_social_profile);

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="search-summary" style={{ marginBottom: '24px' }}>
                <div className="search-summary__left">
                  <div className="search-summary__query">Visual Search Analysis</div>
                  <div className="search-summary__stats">
                    {socialFaceResults.length > 0 && (
                      <span className="search-summary__stat">
                        <strong style={{ color: 'var(--accent-green)' }}>{socialFaceResults.length}</strong> social profiles
                      </span>
                    )}
                    <span className="search-summary__stat">
                      <strong>{faceResults.length}</strong> total matches found
                    </span>
                  </div>
                </div>
                <button className="btn btn--ghost btn--sm" onClick={handleExport}>
                  <Download size={14} /> Export Results
                </button>
              </div>

              {/* Social Profiles Section */}
              {socialFaceResults.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <h3 style={{
                    fontSize: '0.85rem',
                    color: 'var(--accent-cyan)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span>🎯</span> Matched Social Profiles ({socialFaceResults.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {socialFaceResults.map((result, i) => (
                      <FaceResultCard key={`social-${result.url}-${i}`} result={result} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Web Results Section */}
              {webFaceResults.length > 0 && (
                <div>
                  <h3 style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span>🌐</span> Matching Web Pages & Media ({webFaceResults.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {webFaceResults.map((result, i) => (
                      <FaceResultCard key={`web-${result.url}-${i}`} result={result} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* Face Search Empty State */}
        {activeTab === 'face' && results && faceResults.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <GlassCard style={{ textAlign: 'center', padding: '32px 24px', marginTop: '20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📷</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Otomatik Eşleşme Bulunamadı</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto' }}>
                Yüklediğiniz fotoğraf için Yandex üzerinde doğrudan eşleşen bir sayfa bulunamadı. Farklı ve net bir vesikalık veya yüz fotoğrafı deneyebilirsiniz.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
