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
  const canvasRef = useRef(null);

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

  const drawBoundingBoxes = (detectedFaces) => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !detectedFaces.length) return;

    // Set canvas internal resolution to match the displayed image size
    const displayW = img.clientWidth;
    const displayH = img.clientHeight;
    canvas.width = displayW;
    canvas.height = displayH;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, displayW, displayH);

    detectedFaces.forEach(face => {
      if (!face.normalized) return;
      const { x, y, width, height } = face.normalized;

      // Map normalized (0..1) coordinates to displayed pixel coordinates
      const pad = 0.12;
      const bx = Math.max(0, (x - width * pad)) * displayW;
      const by = Math.max(0, (y - height * pad)) * displayH;
      const bw = Math.min(displayW - bx, (width * (1 + pad * 2)) * displayW);
      const bh = Math.min(displayH - by, (height * (1 + pad * 2)) * displayH);

      // Glow effect
      ctx.shadowColor = 'rgba(0, 255, 102, 0.6)';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);

      // Semi-transparent fill
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0, 255, 102, 0.08)';
      ctx.fillRect(bx, by, bw, bh);

      // Label
      const label = 'TARGET_ACQUIRED';
      ctx.font = '800 9px monospace';
      const textW = ctx.measureText(label).width + 12;
      ctx.fillStyle = '#00ff66';
      ctx.fillRect(bx, by - 18, textW, 16);
      ctx.fillStyle = '#000';
      ctx.fillText(label, bx + 6, by - 6);
    });
  };

  const handleImageLoad = async () => {
    if (!imgRef.current) return;
    
    addLog('[+] Yüz taraması başlatıldı...');
    addLog('[+] Hedef aranıyor...');
    
    try {
      const detectedFaces = await detectFace(imgRef.current);
      if (detectedFaces && detectedFaces.length > 0) {
        setFaces(detectedFaces);
        drawBoundingBoxes(detectedFaces);
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
            
            {/* Canvas overlay drawn to exactly match the displayed image size */}
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                borderRadius: '8px',
              }}
            />

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
