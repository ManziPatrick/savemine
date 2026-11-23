import { useEffect, useRef, useState } from 'react';
import { CameraIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

function fileFromClipboard(event) {
  const items = event.clipboardData?.items || [];
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      if (!blob) return null;
      const extension = blob.type.split('/')[1] || 'png';
      return new File([blob], `screenshot.${extension}`, { type: blob.type });
    }
  }
  return null;
}

function ProofCapture({ file, onFile, error }) {
  const uploadRef = useRef(null);
  const cameraRef = useRef(null);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    if (!file.type.startsWith('image/')) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const takeFile = (next) => {
    if (next) onFile(next);
  };

  return (
    <div
      className={`rounded-2xl border border-dashed p-4 ${error ? 'border-red-400 bg-red-50' : 'border-line bg-white'}`}
      onPaste={(event) => {
        const pasted = fileFromClipboard(event);
        if (pasted) {
          event.preventDefault();
          takeFile(pasted);
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        takeFile(event.dataTransfer.files?.[0]);
      }}
      tabIndex={0}
    >
      <input
        ref={uploadRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => takeFile(event.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => takeFile(event.target.files?.[0])}
      />

      {file ? (
        <div className="flex items-start gap-4">
          {preview ? (
            <img src={preview} alt="" className="h-24 w-24 rounded-xl object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-saffron-soft text-sm font-medium text-saffron">
              PDF
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
            <p className="mt-1 text-xs text-ink/60">{Math.max(1, Math.round(file.size / 1024))} KB</p>
            <button
              type="button"
              className="mt-3 inline-flex items-center text-sm text-red-700"
              onClick={() => onFile(null)}
            >
              <XMarkIcon className="mr-1 h-4 w-4" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <PhotoIcon className="mx-auto h-8 w-8 text-primary-700" />
          <p className="mt-2 font-medium text-ink">Drop a screenshot, or paste it here</p>
          <p className="mt-1 text-sm text-ink/60">MoMo slips, bank screens, receipts, and signed contracts.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn btn-primary" onClick={() => uploadRef.current?.click()}>
              Upload screenshot
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => cameraRef.current?.click()}>
              <CameraIcon className="mr-2 h-4 w-4" />
              Take photo
            </button>
          </div>
        </div>
      )}
      {error && <p className="error-message text-center">{error}</p>}
    </div>
  );
}

export default ProofCapture;
