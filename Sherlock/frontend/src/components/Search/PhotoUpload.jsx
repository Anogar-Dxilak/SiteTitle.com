import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { initDetector, detectFace } from '../../services/faceDetection';

export default function PhotoUpload({ onFileSelect, loading = false }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [faces, setFaces] = useState([]);
  const [statusLogs, setStatusLogs] = useState([]);
  const imgRef = useRef(null);

  // Pre-load detector on component mount
  useEffect(() => {
    initDetector().catch(console.error);
  }, []);

  const addLog = (msg) => {
    setStatusLogs(prev => [...prev, msg]);
  };

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setFaces([]);
      setStatusLogs(['[+] Fotoğraf sisteme yüklendi...']);
      onFileSelect(selectedFile);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: loading,
  });

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setFaces([]);
    setStatusLogs([]);
    onFileSelect(null);
  };

  const handleImageLoad = async () => {
    if (!imgRef.current) return;
    
    addLog('[+] Yüz taraması başlatıldı...');
    addLog('[+] Hedef aranıyor...');
    
    try {
      const detectedFaces = await detectFace(imgRef.current);
      if (detectedFaces && detectedFaces.length > 0) {
        setFaces(detectedFaces);
        addLog(`[+] Hedef yüz başarıyla izole edildi.`);
        addLog('[+] Biyometrik vektör çıkarımı tamamlandı.');
        addLog('[+] Açık kaynak (OSINT) veri tabanlarında arama hazır.');
      } else {
        addLog('[-] Yüz tespit edilemedi. Lütfen net bir fotoğraf yükleyin.');
      }
    } catch (err) {
      console.error(err);
      addLog('[-] Tarama sırasında hata oluştu.');
    }
  };

  return (
    <div
      {...getRootProps()}
      className={`photo-upload ${isDragActive ? 'photo-upload--active' : ''} ${file ? 'photo-upload--has-file' : ''}`}
      id="photo-upload-zone"
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      <input {...getInputProps()} />
      
      {!file ? (
        <>
          <div className="photo-upload__icon">
            {isDragActive ? <ImageIcon size={48} /> : <Upload size={48} />}
          </div>
          <p className="photo-upload__text">
            {isDragActive ? (
              'Drop the photo here...'
            ) : (
              <>
                <strong>Click to upload</strong> or drag and drop a face photo
              </>
            )}
          </p>
          <p className="photo-upload__subtext">
            JPG, PNG or WebP • Max 10MB
          </p>
        </>
      ) : (
        <div className="photo-upload__preview-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img 
              ref={imgRef} 
              src={preview} 
              alt="Upload preview" 
              onLoad={handleImageLoad}
              style={{ display: 'block', maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} 
            />
            
            {/* Draw bounding boxes based on normalized percentage coordinates */}
            {faces.map((face, idx) => {
              if (!face.normalized) return null;
              
              const { x, y, width, height } = face.normalized;
              
              // Add slight padding for visual framing
              const padX = width * 0.12;
              const padY = height * 0.15;
              
              const leftPct = Math.max(0, (x - padX) * 100);
              const topPct = Math.max(0, (y - padY) * 100);
              const widthPct = Math.min(100 - leftPct, (width + padX * 2) * 100);
              const heightPct = Math.min(100 - topPct, (height + padY * 2) * 100);
              
              return (
                <div 
                  key={idx}
                  style={{
                    position: 'absolute',
                    border: '2px solid #00ff66',
                    boxShadow: '0 0 12px rgba(0, 255, 102, 0.6), inset 0 0 8px rgba(0, 255, 102, 0.2)',
                    backgroundColor: 'rgba(0, 255, 102, 0.08)',
                    borderRadius: '4px',
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                    pointerEvents: 'none',
                    transition: 'all 0.2s ease-out'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '-2px',
                    background: '#00ff66',
                    color: '#000',
                    fontSize: '9px',
                    fontWeight: '800',
                    letterSpacing: '1px',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap'
                  }}>
                    TARGET_ACQUIRED
                  </div>
                </div>
              );
            })}

            <button
              className="photo-upload__remove"
              onClick={removeFile}
              type="button"
              aria-label="Remove photo"
              style={{ position: 'absolute', top: '8px', right: '8px' }}
            >
              <X size={12} />
            </button>
          </div>

          <div style={{ 
            marginTop: '16px', 
            width: '100%', 
            background: 'rgba(0,0,0,0.5)', 
            padding: '12px', 
            borderRadius: '4px',
            borderLeft: '2px solid #00ff66',
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#00ff66',
            textAlign: 'left'
          }}>
            {statusLogs.map((log, i) => (
              <div key={i} style={{ opacity: 0.8 + (i * 0.05) }}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
