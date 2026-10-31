import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  ShieldCheck,
  Info,
  Loader2,
  ArrowRight,
  X,
  Plus,
  ZoomIn,
  FileText,
} from 'lucide-react';
import { useToast } from '../../../../context/ToastContext';
import { ProcessedResult } from '../../types';
import {
  CompressionLevel,
  compressPdfDocument,
} from './compressEngine';
import { renderPdfPageThumbnail } from '../../../../utils/pdfRenderer';

export interface CompressPdfWorkspaceProps {
  onSuccess: (result: ProcessedResult) => void;
  initialFile?: File | null;
}

export const CompressPdfWorkspace: React.FC<CompressPdfWorkspaceProps> = ({
  onSuccess,
  initialFile = null,
}) => {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(initialFile);
  const [cachedBytes, setCachedBytes] = useState<Uint8Array | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('recommended');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [zoomModalImage, setZoomModalImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Immediately buffer bytes into memory on selection to prevent mobile permission loss
  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      showToast('Please select a valid PDF file', 'error');
      return;
    }
    setFile(selectedFile);
    setThumbnail(null);

    try {
      const ab = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(ab);
      setCachedBytes(bytes);

      try {
        const thumb = await renderPdfPageThumbnail(bytes, 1, 150);
        if (thumb) {
          setThumbnail(thumb);
        }
      } catch {
        // ignore
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    if (initialFile && !cachedBytes) {
      handleFileSelect(initialFile);
    }
  }, [initialFile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setCachedBytes(null);
    setThumbnail(null);
    setProgressText('');
    showToast('Removed file');
  };

  const handleCompress = async () => {
    if (!file) {
      showToast('Please select a PDF file first', 'error');
      return;
    }

    setIsProcessing(true);
    setProgressText('Preparing document...');
    try {
      let bytes = cachedBytes;
      if (!bytes) {
        const ab = await file.arrayBuffer();
        bytes = new Uint8Array(ab);
      }

      const res = await compressPdfDocument(bytes, compressionLevel, (curr, total) => {
        setProgressText(`Compressing page ${curr} of ${total}...`);
      });

      if (!res.success || !res.bytes) {
        showToast(res.error || 'Failed to compress PDF', 'error');
        setIsProcessing(false);
        return;
      }

      const blob = new Blob([res.bytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const cleanBaseName = file.name.replace(/\.pdf$/i, '');
      const filename = `compressed-${cleanBaseName}-${Date.now()}.pdf`;

      onSuccess({
        blob,
        downloadUrl,
        filename,
        size: blob.size,
        mimeType: 'application/pdf',
      });

      const origKb = (res.originalSize / 1024).toFixed(0);
      const newKb = (res.compressedSize / 1024).toFixed(0);
      showToast(`Compressed PDF: ${origKb} KB → ${newKb} KB (${res.savingsPercent}% saved)!`);
    } catch (err: any) {
      showToast(`Compression error: ${err?.message || 'Failed to process document'}`, 'error');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Zoom Modal */}
      {zoomModalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setZoomModalImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-surface-900 rounded-3xl overflow-hidden shadow-2xl p-2 sm:p-4 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomModalImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomModalImage}
              alt="Preview"
              className="max-h-[82vh] w-auto object-contain rounded-2xl mx-auto shadow-inner"
            />
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 1. INITIAL UPLOAD STATE */}
      {!file && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
          className="relative min-h-[500px] rounded-3xl bg-white dark:bg-surface-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center p-8 sm:p-16 text-center space-y-6"
        >
          <div className="space-y-3 max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Compress PDF
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              Reduce file size while optimizing for maximal PDF quality.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-rose-600/30 transition-all cursor-pointer group"
            >
              <Upload className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />
              <span>Select PDF file</span>
            </button>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium">
              or drop PDF here
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" /> 100% Client-Side Privacy
            </span>
            <span>•</span>
            <span>Zero Data Leakage</span>
            <span>•</span>
            <span>No File Limits</span>
          </div>
        </div>
      )}

      {/* 2. SPLIT-SCREEN WORKSPACE */}
      {file && (
        <div className="flex flex-col lg:flex-row min-h-[720px] bg-slate-100 dark:bg-surface-950 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md relative">
          {/* LEFT CANVAS */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            className="flex-1 p-5 sm:p-10 flex flex-col relative overflow-y-auto min-h-[500px] bg-slate-50/70 dark:bg-slate-900/40"
          >
            {/* Floating Top Control */}
            <div className="absolute top-5 right-5 z-20 flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change or replace file"
                className="relative w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition-all cursor-pointer group"
              >
                <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[20px] text-center rounded-full bg-slate-900 text-[10px] font-extrabold text-white border-2 border-white dark:border-slate-800 shadow-sm">
                  1
                </span>
              </button>
            </div>

            {/* Document Header Strip */}
            <div className="flex items-center justify-between bg-white/95 dark:bg-surface-900/95 backdrop-blur-xs border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 shadow-xs mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="text-[11px] text-slate-400 shrink-0 hidden sm:inline">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-white hover:bg-rose-600 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-2xs transition-all cursor-pointer"
                title="Remove this PDF and choose another"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Remove PDF</span>
              </button>
            </div>

            {/* Canvas Centered Card */}
            <div className="flex-1 flex flex-col justify-center items-center py-8">
              <div className="relative bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-xl flex flex-col items-center max-w-xs w-full transition-all hover:border-slate-300 dark:hover:border-slate-600">
                {/* Quick Cross Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  title="Remove this PDF"
                  aria-label={`Remove ${file.name}`}
                  className="absolute -top-3 -right-3 z-30 w-8 h-8 rounded-full bg-white dark:bg-surface-800 text-rose-500 hover:text-white hover:bg-rose-600 border-2 border-slate-100 dark:border-slate-700 shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>

                {/* Card Thumbnail Area */}
                <div className="aspect-[3/4] w-48 sm:w-56 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center p-3 border border-slate-100 dark:border-slate-800 relative group overflow-hidden shadow-inner">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={file.name}
                      className="max-h-full max-w-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="text-center space-y-2.5 p-3 flex flex-col items-center justify-center">
                      <FileText className="w-16 h-16 text-rose-500 opacity-60" />
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        PDF Document
                      </span>
                    </div>
                  )}

                  {thumbnail && (
                    <button
                      type="button"
                      onClick={() => setZoomModalImage(thumbnail)}
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <ZoomIn className="w-5 h-5" />
                      <span>Preview</span>
                    </button>
                  )}
                </div>

                {/* Card Title & Meta */}
                <div className="text-center space-y-1 w-full truncate mt-4">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate" title={file.name}>
                    {file.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-full lg:w-88 xl:w-96 bg-white dark:bg-surface-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shrink-0 shadow-sm space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Compress PDF
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">
                    1 file(s)
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    title="Remove file and select another"
                    className="px-2 py-0.5 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 dark:text-rose-400 dark:hover:bg-rose-600 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-rose-200 dark:border-rose-900/60 shadow-2xs"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Info Banner */}
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2.5 leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
                <div>Extreme compression reduces size drastically. Recommended gives the best balance.</div>
              </div>

              {/* Compression Levels */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Compression level
                </label>

                <div className="space-y-2.5 text-xs">
                  <label
                    onClick={() => setCompressionLevel('extreme')}
                    className={`p-3.5 rounded-2xl border cursor-pointer block transition-all ${
                      compressionLevel === 'extreme'
                        ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-2 ring-rose-400/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="comp-level"
                        checked={compressionLevel === 'extreme'}
                        onChange={() => setCompressionLevel('extreme')}
                        className="accent-rose-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          Extreme compression
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Less quality, high compression (~80-90% reduction)
                        </div>
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setCompressionLevel('recommended')}
                    className={`p-3.5 rounded-2xl border cursor-pointer block transition-all ${
                      compressionLevel === 'recommended'
                        ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-2 ring-rose-400/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="comp-level"
                        checked={compressionLevel === 'recommended'}
                        onChange={() => setCompressionLevel('recommended')}
                        className="accent-rose-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          Recommended compression
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Good quality, good compression (~60-75% reduction)
                        </div>
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setCompressionLevel('less')}
                    className={`p-3.5 rounded-2xl border cursor-pointer block transition-all ${
                      compressionLevel === 'less'
                        ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-2 ring-rose-400/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="comp-level"
                        checked={compressionLevel === 'less'}
                        onChange={() => setCompressionLevel('less')}
                        className="accent-rose-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          Less compression
                        </div>
                        <div className="text-[11px] text-slate-500">
                          High quality, gentle compression
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Compress Action Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {progressText && (
                <div className="text-center text-xs font-semibold text-rose-600 dark:text-rose-400 animate-pulse">
                  {progressText}
                </div>
              )}
              <button
                type="button"
                onClick={handleCompress}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-rose-600/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Compressing PDF...</span>
                  </>
                ) : (
                  <>
                    <span>Compress PDF</span>
                    <ArrowRight className="w-5 h-5 bg-white/20 rounded-full p-0.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
