import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image } from 'lucide-react';

export default function PhotoUpload({ onFileSelect, loading = false }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
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
    onFileSelect(null);
  };

  return (
    <div
      {...getRootProps()}
      className={`photo-upload ${isDragActive ? 'photo-upload--active' : ''} ${file ? 'photo-upload--has-file' : ''}`}
      id="photo-upload-zone"
    >
      <input {...getInputProps()} />
      
      {!file ? (
        <>
          <div className="photo-upload__icon">
            {isDragActive ? <Image size={48} /> : <Upload size={48} />}
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
        <div className="photo-upload__preview">
          <img src={preview} alt="Upload preview" />
          <button
            className="photo-upload__remove"
            onClick={removeFile}
            type="button"
            aria-label="Remove photo"
          >
            <X size={12} />
          </button>
          <p className="photo-upload__text" style={{ marginTop: '12px' }}>
            ✅ {file.name} ({(file.size / 1024).toFixed(0)} KB)
          </p>
        </div>
      )}
    </div>
  );
}
