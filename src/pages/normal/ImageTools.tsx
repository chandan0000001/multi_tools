import React, { useState, useRef } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import {
  UploadCloud,
  Sliders,
  Download,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  Check,
  FileCheck,
} from 'lucide-react';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  // Processed state
  processedBlob: Blob | null;
  processedUrl: string | null;
  processedWidth: number;
  processedHeight: number;
  processedSize: number;
}

export const ImageTools: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'image-tools')!;
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [quality, setQuality] = useState<number>(80);
  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [scaleMode, setScaleMode] = useState<'original' | 'scale' | 'custom'>('original');
  const [scalePercent, setScalePercent] = useState<number>(80);
  const [customWidth, setCustomWidth] = useState<number>(1200);
  const [customHeight, setCustomHeight] = useState<number>(800);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: ImageItem[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        showToast(`Skipped ${file.name} (not an image)`, 'error');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            file,
            previewUrl,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            originalSize: file.size,
            processedBlob: null,
            processedUrl: null,
            processedWidth: 0,
            processedHeight: 0,
            processedSize: 0,
          },
        ]);
      };
      img.src = previewUrl;
    });
  };

  const processSingleImage = (item: ImageItem): Promise<ImageItem> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (scaleMode === 'scale') {
          width = Math.round((width * scalePercent) / 100);
          height = Math.round((height * scalePercent) / 100);
        } else if (scaleMode === 'custom' && customWidth && customHeight) {
          width = customWidth;
          height = customHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(item);
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(item);
              return;
            }
            if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
            const processedUrl = URL.createObjectURL(blob);
            resolve({
              ...item,
              processedBlob: blob,
              processedUrl,
              processedWidth: width,
              processedHeight: height,
              processedSize: blob.size,
            });
          },
          targetFormat,
          targetFormat === 'image/png' ? undefined : quality / 100
        );
      };
      img.src = item.previewUrl;
    });
  };

  const processAllImages = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    try {
      const processed = await Promise.all(images.map((item) => processSingleImage(item)));
      setImages(processed);
      showToast(`Processed ${processed.length} image(s) locally!`);
    } catch {
      showToast('Error processing images', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadProcessed = (item: ImageItem) => {
    if (!item.processedUrl || !item.processedBlob) return;
    const ext = targetFormat === 'image/png' ? 'png' : targetFormat === 'image/jpeg' ? 'jpg' : 'webp';
    const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
    const a = document.createElement('a');
    a.href = item.processedUrl;
    a.download = `${baseName}-optimized.${ext}`;
    a.click();
  };

  const downloadAll = () => {
    images.forEach((img) => {
      if (img.processedUrl) downloadProcessed(img);
    });
  };

  const clearAll = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
      if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
    });
    setImages([]);
    showToast('Cleared all images');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Settings Panel */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Optimization & Resize Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Format selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { format: 'image/webp', label: 'WebP (Best)' },
                { format: 'image/jpeg', label: 'JPEG' },
                { format: 'image/png', label: 'PNG' },
              ].map((opt) => (
                <button
                  key={opt.format}
                  onClick={() => setTargetFormat(opt.format as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold transition-colors ${
                    targetFormat === opt.format
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Compression Quality</span>
              <span className="text-brand-500 font-mono">{quality}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              disabled={targetFormat === 'image/png'}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-400 block">
              {targetFormat === 'image/png' ? 'PNG uses lossless compression' : '80% is recommended for web balance'}
            </span>
          </div>

          {/* Dimensions / Scaling Mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Resolution Sizing</label>
            <select
              value={scaleMode}
              onChange={(e) => setScaleMode(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
            >
              <option value="original">Keep Original Dimensions</option>
              <option value="scale">Scale Down by Percentage</option>
              <option value="custom">Set Custom Width / Height</option>
            </select>

            {scaleMode === 'scale' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={scalePercent}
                  onChange={(e) => setScalePercent(Number(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
                <span className="text-xs font-mono font-semibold">{scalePercent}%</span>
              </div>
            )}

            {scaleMode === 'custom' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  placeholder="Width"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  className="w-1/2 px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-center"
                />
                <span className="text-xs text-slate-400">×</span>
                <input
                  type="number"
                  placeholder="Height"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  className="w-1/2 px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-center"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Drag & Drop Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-3xl p-8 text-center cursor-pointer bg-white/50 dark:bg-surface-900/50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Drop your images here, or browse
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Supports PNG, JPEG, and WebP. Multi-file processing strictly in your local browser memory.
        </p>
      </div>

      {/* Action bar if images exist */}
      {images.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {images.length} image(s) queued
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
            <button
              onClick={processAllImages}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Optimizing...' : 'Process / Compress All'}</span>
            </button>
            {images.some((i) => i.processedUrl) && (
              <button
                onClick={downloadAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Processed</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Images List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((item) => {
          const savings =
            item.processedSize > 0
              ? Math.round(((item.originalSize - item.processedSize) / item.originalSize) * 100)
              : 0;

          return (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.processedUrl || item.previewUrl}
                  alt={item.file.name}
                  className="w-20 h-20 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700"
                />
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={item.file.name}>
                    {item.file.name}
                  </h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Original: {formatBytes(item.originalSize)} ({item.originalWidth}×{item.originalHeight})</span>
                  </div>

                  {item.processedSize > 0 ? (
                    <div className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Optimized: {formatBytes(item.processedSize)} ({savings > 0 ? `-${savings}%` : 'converted'})</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-amber-500">Ready to optimize</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {item.processedUrl ? (
                  <button
                    onClick={() => downloadProcessed(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      const res = await processSingleImage(item);
                      setImages((prev) => prev.map((i) => (i.id === item.id ? res : i)));
                      showToast('Optimized image locally!');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Process</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <RelatedTools currentTool={tool} />
    </div>
  );
};
