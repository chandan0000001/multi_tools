import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  ShieldCheck,
  Info,
  Loader2,
  ArrowRight,
  X,
  Plus,
  SortAsc,
  ZoomIn,
  FileText,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { useToast } from '../../../../context/ToastContext';
import { ProcessedResult } from '../../types';
import { mergePdfDocuments } from './mergeEngine';
import { renderPdfPageThumbnail } from '../../../../utils/pdfRenderer';

export interface MergePdfWorkspaceProps {
  onSuccess: (result: ProcessedResult) => void;
  initialFiles?: File[];
}

export const MergePdfWorkspace: React.FC<MergePdfWorkspaceProps> = ({
  onSuccess,
  initialFiles = [],
}) => {
  const { showToast } = useToast();
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileThumbnails, setFileThumbnails] = useState<{ [name: string]: string }>({});
  const [zoomModalImage, setZoomModalImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate thumbnails for uploaded files
  useEffect(() => {
    let cancelled = false;

    async function loadThumbnails() {
      for (const f of files) {
        if (!fileThumbnails[f.name]) {
          try {
            const buf = await f.arrayBuffer();
            const thumb = await renderPdfPageThumbnail(buf, 1, 150);
            if (!cancelled && thumb) {
              setFileThumbnails((prev) => ({ ...prev, [f.name]: thumb }));
            }
          } catch {
            // Ignore error
          }
        }
      }
    }

    if (files.length > 0) {
      loadThumbnails();
    }

    return () => {
      cancelled = true;
    };
  }, [files]);

  const handleFilesSelect = (newFiles: File[]) => {
    const validPdfs = newFiles.filter(
      (f) => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf'
    );
    if (validPdfs.length === 0) {
      showToast('Please select valid PDF files', 'error');
      return;
    }
    setFiles((prev) => [...prev, ...validPdfs]);
    showToast(`Added ${validPdfs.length} file(s)`);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    const removedName = files[index]?.name;
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (removedName) {
      showToast(`Removed ${removedName}`);
    }
  };

  const handleRemoveAll = () => {
    setFiles([]);
    setFileThumbnails({});
    showToast('Removed all files');
  };

  const moveFileOrder = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;

    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const sortFilesAlphabetically = () => {
    setFiles((prev) => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
    showToast('Sorted files alphabetically (A-Z)');
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      showToast('Please select at least 2 PDF files to merge', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await mergePdfDocuments(files);
      if (!res.success || !res.bytes) {
        showToast(res.error || 'Failed to merge PDF files', 'error');
        setIsProcessing(false);
        return;
      }

      const blob = new Blob([res.bytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const filename = `merged-${Date.now()}.pdf`;

      onSuccess({
        blob,
        downloadUrl,
        filename,
        size: blob.size,
        mimeType: 'application/pdf',
      });
      showToast('Merged PDFs successfully!');
    } catch (err: any) {
      showToast(`Error: ${err?.message || 'Merge failed'}`, 'error');
    } finally {
      setIsProcessing(false);
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
        multiple
        accept="application/pdf,.pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* 1. INITIAL UPLOAD STATE */}
      {files.length === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFilesSelect(Array.from(e.dataTransfer.files));
            }
          }}
          className="relative min-h-[500px] rounded-3xl bg-white dark:bg-surface-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center p-8 sm:p-16 text-center space-y-6"
        >
          <div className="space-y-3 max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Merge PDF
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              Combine PDFs in the exact order you want with the easiest PDF merger available.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-rose-600/30 transition-all cursor-pointer group"
            >
              <Upload className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />
              <span>Select PDF files</span>
            </button>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium">
              or drop PDFs here
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
      {files.length > 0 && (
        <div className="flex flex-col lg:flex-row min-h-[720px] bg-slate-100 dark:bg-surface-950 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md relative">
          {/* LEFT / CENTER CANVAS */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFilesSelect(Array.from(e.dataTransfer.files));
              }
            }}
            className="flex-1 p-5 sm:p-10 flex flex-col relative overflow-y-auto min-h-[500px] bg-slate-50/70 dark:bg-slate-900/40"
          >
            {/* Floating Top Controls */}
            <div className="absolute top-5 right-5 z-20 flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Add more files"
                className="relative w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition-all cursor-pointer group"
              >
                <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[20px] text-center rounded-full bg-slate-900 text-[10px] font-extrabold text-white border-2 border-white dark:border-slate-800 shadow-sm">
                  {files.length}
                </span>
              </button>

              <button
                type="button"
                onClick={sortFilesAlphabetically}
                title="Sort A-Z"
                className="w-10 h-10 rounded-full bg-white dark:bg-surface-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <SortAsc className="w-4 h-4" />
              </button>
            </div>

            {/* Merge Cards Grid */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-2">
                  {files.map((item, idx) => (
                    <div
                      key={idx}
                      className="group relative bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 shadow-md hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between"
                    >
                      {/* Quick Cross Remove Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        title="Remove this PDF"
                        aria-label={`Remove ${item.name}`}
                        className="absolute -top-2.5 -right-2.5 z-20 w-7 h-7 rounded-full bg-white dark:bg-surface-800 text-rose-500 hover:text-white hover:bg-rose-600 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      {/* Hover Zoom Preview Button */}
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-surface-900/90 backdrop-blur-xs p-1 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                        {fileThumbnails[item.name] && (
                          <button
                            type="button"
                            onClick={() => setZoomModalImage(fileThumbnails[item.name])}
                            title="Zoom preview"
                            className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Thumbnail */}
                      <div className="aspect-[3/4] w-full bg-slate-50 dark:bg-slate-800/60 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800 relative">
                        {fileThumbnails[item.name] ? (
                          <img
                            src={fileThumbnails[item.name]}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center space-y-2 text-slate-400">
                            <FileText className="w-10 h-10 text-rose-500 opacity-60" />
                            <span className="text-[11px] font-mono">PDF Document</span>
                          </div>
                        )}
                      </div>

                      {/* Footer Info & Ordering */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="truncate mr-2">
                          <p className="font-bold text-slate-900 dark:text-white truncate" title={item.name}>
                            {item.name}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {(item.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveFileOrder(idx, 'left')}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Move Left"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === files.length - 1}
                            onClick={() => moveFileOrder(idx, 'right')}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Move Right"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-full lg:w-88 xl:w-96 bg-white dark:bg-surface-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shrink-0 shadow-sm space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Merge PDF
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">
                    {files.length} file(s)
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveAll}
                    title="Remove all files"
                    className="px-2 py-0.5 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 dark:text-rose-400 dark:hover:bg-rose-600 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-rose-200 dark:border-rose-900/60 shadow-2xs"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Info banner */}
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2.5 leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
                <div>To change the order of your PDFs, use the arrow buttons or drag cards on the canvas.</div>
              </div>

              {/* File List Summary */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Files Sequence ({files.length}):
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate" title={f.name}>
                          {f.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {(f.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Merge Action Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleMerge}
                disabled={isProcessing || files.length < 2}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-rose-600/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Merging PDFs...</span>
                  </>
                ) : (
                  <>
                    <span>Merge PDF</span>
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
