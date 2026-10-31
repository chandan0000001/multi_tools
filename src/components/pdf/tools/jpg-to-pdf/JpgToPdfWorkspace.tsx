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
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '../../../../context/ToastContext';
import { ProcessedResult } from '../../types';
import {
  ImageToConvert,
  JpgToPdfOptions,
  convertImagesToPdf,
} from './jpgToPdfEngine';

export interface JpgToPdfWorkspaceProps {
  onSuccess: (result: ProcessedResult) => void;
  initialFiles?: File[];
}

export const JpgToPdfWorkspace: React.FC<JpgToPdfWorkspaceProps> = ({
  onSuccess,
  initialFiles = [],
}) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<ImageToConvert[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('fit');
  const [margin, setMargin] = useState<'none' | 'small' | 'big'>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoomModalImage, setZoomModalImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read files safely into memory immediately upon upload to prevent Android ContentProvider permission expiration
  const processAndAddFiles = async (newFiles: File[]) => {
    const validImages = newFiles.filter(
      (f) => f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp|svg|tiff)$/i.test(f.name)
    );

    if (validImages.length === 0) {
      showToast('Please select valid image files (JPG, PNG, WebP, etc.)', 'error');
      return;
    }

    const loadedItems: ImageToConvert[] = await Promise.all(
      validImages.map(async (file) => {
        let bytes: Uint8Array | undefined;
        let dataUrl: string | undefined;

        // 1. Try reading ArrayBuffer immediately
        try {
          const ab = await file.arrayBuffer();
          bytes = new Uint8Array(ab);
        } catch {
          // ignore
        }

        // 2. Try reading DataURL immediately
        try {
          dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
        } catch {
          // ignore
        }

        return {
          file,
          name: file.name,
          size: file.size,
          bytes,
          dataUrl,
        };
      })
    );

    setItems((prev) => [...prev, ...loadedItems]);
    showToast(`Added ${loadedItems.length} image(s)`);
  };

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && items.length === 0) {
      processAndAddFiles(initialFiles);
    }
  }, [initialFiles]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndAddFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveItem = (index: number) => {
    const removedName = items[index]?.name;
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (removedName) {
      showToast(`Removed ${removedName}`);
    }
  };

  const handleRemoveAll = () => {
    setItems([]);
    showToast('Removed all images');
  };

  const moveOrder = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const sortAlphabetically = () => {
    setItems((prev) => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
    showToast('Sorted images alphabetically (A-Z)');
  };

  const handleConvert = async () => {
    if (items.length === 0) {
      showToast('Please select at least 1 image to convert', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const options: JpgToPdfOptions = {
        orientation,
        pageSize,
        margin,
      };

      const res = await convertImagesToPdf(items, options);
      if (!res.success || !res.bytes) {
        showToast(res.error || 'Failed to convert images to PDF', 'error');
        setIsProcessing(false);
        return;
      }

      const blob = new Blob([res.bytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const filename = `images-to-pdf-${Date.now()}.pdf`;

      onSuccess({
        blob,
        downloadUrl,
        filename,
        size: blob.size,
        mimeType: 'application/pdf',
      });
      showToast(`Converted ${items.length} image(s) into PDF!`);
    } catch (err: any) {
      showToast(`Conversion error: ${err?.message || 'Failed to process images'}`, 'error');
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
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* 1. INITIAL UPLOAD STATE */}
      {items.length === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              processAndAddFiles(Array.from(e.dataTransfer.files));
            }
          }}
          className="relative min-h-[500px] rounded-3xl bg-white dark:bg-surface-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center p-8 sm:p-16 text-center space-y-6"
        >
          <div className="space-y-3 max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              JPG to PDF
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              Set page orientation, page margins, and combine multiple images into a single PDF.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-rose-600/30 transition-all cursor-pointer group"
            >
              <Upload className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />
              <span>Select JPG images</span>
            </button>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium">
              or drop images here
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
      {items.length > 0 && (
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
                processAndAddFiles(Array.from(e.dataTransfer.files));
              }
            }}
            className="flex-1 p-5 sm:p-10 flex flex-col relative overflow-y-auto min-h-[500px] bg-slate-50/70 dark:bg-slate-900/40"
          >
            {/* Floating Top Controls */}
            <div className="absolute top-5 right-5 z-20 flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Add more images"
                className="relative w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition-all cursor-pointer group"
              >
                <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[20px] text-center rounded-full bg-slate-900 text-[10px] font-extrabold text-white border-2 border-white dark:border-slate-800 shadow-sm">
                  {items.length}
                </span>
              </button>

              <button
                type="button"
                onClick={sortAlphabetically}
                title="Sort A-Z"
                className="w-10 h-10 rounded-full bg-white dark:bg-surface-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <SortAsc className="w-4 h-4" />
              </button>
            </div>

            {/* Image Cards Grid */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="group relative bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 shadow-md hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between"
                    >
                      {/* Quick Cross Remove Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItem(idx);
                        }}
                        title="Remove this image"
                        aria-label={`Remove ${item.name}`}
                        className="absolute -top-2.5 -right-2.5 z-20 w-7 h-7 rounded-full bg-white dark:bg-surface-800 text-rose-500 hover:text-white hover:bg-rose-600 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      {/* Hover Zoom Preview Button */}
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-surface-900/90 backdrop-blur-xs p-1 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                        {item.dataUrl && (
                          <button
                            type="button"
                            onClick={() => setZoomModalImage(item.dataUrl!)}
                            title="Zoom preview"
                            className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Thumbnail Area */}
                      <div className="aspect-[3/4] w-full bg-slate-50 dark:bg-slate-800/60 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800 relative">
                        {item.dataUrl ? (
                          <img
                            src={item.dataUrl}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center space-y-2 text-slate-400">
                            <ImageIcon className="w-10 h-10 text-rose-500 opacity-60" />
                            <span className="text-[11px] font-mono">Image</span>
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
                            onClick={() => moveOrder(idx, 'left')}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Move Left"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === items.length - 1}
                            onClick={() => moveOrder(idx, 'right')}
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
                  JPG to PDF
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">
                    {items.length} file(s)
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveAll}
                    title="Remove all images"
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
                <div>Set page orientation, page margins, and combine multiple images into a single PDF.</div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                {/* Page Orientation */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Page orientation:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        orientation === 'portrait'
                          ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      Portrait
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        orientation === 'landscape'
                          ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      Landscape
                    </button>
                  </div>
                </div>

                {/* Page Size */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Page size:
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="fit">Fit (Same page size as image)</option>
                    <option value="a4">A4 (297x210 mm)</option>
                    <option value="letter">US Letter</option>
                  </select>
                </div>

                {/* Margins */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Margin:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                    {(['none', 'small', 'big'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMargin(m)}
                        className={`py-1.5 rounded-lg border text-center capitalize transition-all cursor-pointer ${
                          margin === m
                            ? 'border-rose-500 text-rose-600 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {m === 'none' ? 'No Margin' : m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Convert Action Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleConvert}
                disabled={isProcessing || items.length === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-rose-600/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Converting Images...</span>
                  </>
                ) : (
                  <>
                    <span>Convert to PDF</span>
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
