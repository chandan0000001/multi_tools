import React, { useState, useRef } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  FileText,
  Merge,
  Scissors,
  Image as ImageIcon,
  RotateCw,
  Download,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react';

type PdfMode = 'merge' | 'split' | 'images' | 'organize';

interface SelectedFile {
  file: File;
  name: string;
  size: number;
}

export const PdfTools: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'pdf-tools')!;
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<PdfMode>('merge');
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Split options
  const [splitRanges, setSplitRanges] = useState('1-2, 3');
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);

  // Rotate options
  const [rotationDegrees, setRotationDegrees] = useState<number>(90);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles: SelectedFile[] = [];
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        newFiles.push({ file, name: file.name, size: file.size });
      }
    }

    if (newFiles.length === 0) {
      showToast('Please select valid PDF files', 'error');
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);

    // Check page count of first file if in split or rotate mode
    try {
      const arrayBuffer = await newFiles[0].file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setPdfPageCount(pdfDoc.getPageCount());
    } catch {
      // Ignore if load fails for preview
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles: SelectedFile[] = [];
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      if (file.type.startsWith('image/')) {
        newFiles.push({ file, name: file.name, size: file.size });
      }
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  // Reorder files
  const moveFile = (index: number, direction: 'up' | 'down') => {
    const updated = [...files];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= files.length) return;
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setFiles(updated);
  };

  // 1. Merge Mode Handler
  const handleMerge = async () => {
    if (files.length < 2) {
      showToast('Please select at least 2 PDF files to merge', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const item of files) {
        const fileBytes = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged-document-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('PDF files merged and downloaded!');
    } catch (err: any) {
      showToast(`Merge failed: ${err.message || 'Corrupted PDF file'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Split Mode Handler
  const handleSplit = async () => {
    if (files.length === 0) {
      showToast('Please upload a PDF file to split', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      const fileBytes = await files[0].file.arrayBuffer();
      const srcPdf = await PDFDocument.load(fileBytes);
      const totalPages = srcPdf.getPageCount();

      // Parse range: e.g. "1-2, 3"
      const ranges = splitRanges.split(',').map((r) => r.trim());
      const pagesToExtract: number[] = [];

      for (const range of ranges) {
        if (range.includes('-')) {
          const [startStr, endStr] = range.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
              pagesToExtract.push(p - 1); // 0-indexed
            }
          }
        } else {
          const p = parseInt(range, 10);
          if (!isNaN(p) && p >= 1 && p <= totalPages) {
            pagesToExtract.push(p - 1);
          }
        }
      }

      if (pagesToExtract.length === 0) {
        showToast('Invalid page ranges provided', 'error');
        setIsProcessing(false);
        return;
      }

      const newPdf = await PDFDocument.create();
      const copied = await newPdf.copyPages(srcPdf, pagesToExtract);
      copied.forEach((p) => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extracted-pages-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Extracted ${pagesToExtract.length} page(s) successfully!`);
    } catch (err: any) {
      showToast(`Split failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Images to PDF Handler
  const handleImagesToPdf = async () => {
    if (files.length === 0) {
      showToast('Please add at least one image', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of files) {
        const imgBytes = await item.file.arrayBuffer();
        let embeddedImage;
        if (item.file.type === 'image/jpeg' || item.name.endsWith('.jpg') || item.name.endsWith('.jpeg')) {
          embeddedImage = await pdfDoc.embedJpg(imgBytes);
        } else {
          // PNG or convert via canvas to png
          embeddedImage = await pdfDoc.embedPng(imgBytes);
        }

        const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: embeddedImage.width,
          height: embeddedImage.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `images-to-doc-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Converted images into PDF document!');
    } catch (err: any) {
      showToast(`Conversion failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Rotate PDF Pages Handler
  const handleRotate = async () => {
    if (files.length === 0) {
      showToast('Please upload a PDF file to rotate', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      const fileBytes = await files[0].file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();
      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotationDegrees) % 360));
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rotated-${files[0].name}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Rotated ${pages.length} page(s) by ${rotationDegrees}°!`);
    } catch (err: any) {
      showToast(`Rotate failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'merge', label: 'Merge PDFs', icon: Merge },
          { id: 'split', label: 'Split / Extract Pages', icon: Scissors },
          { id: 'images', label: 'Images to PDF', icon: ImageIcon },
          { id: 'organize', label: 'Rotate & Reorder', icon: RotateCw },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setMode(item.id as PdfMode);
                setFiles([]);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                mode === item.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'bg-white dark:bg-surface-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => {
          if (mode === 'images') imageInputRef.current?.click();
          else fileInputRef.current?.click();
        }}
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-3xl p-8 text-center cursor-pointer bg-white/50 dark:bg-surface-900/50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={mode === 'merge'}
          accept="application/pdf"
          className="hidden"
          onChange={handlePdfUpload}
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/png, image/jpeg"
          className="hidden"
          onChange={handleImageUpload}
        />
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto mb-3">
          <Upload className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          {mode === 'images' ? 'Click to select JPG / PNG images' : 'Click to select PDF document(s)'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Everything processes 100% locally via pdf-lib in your browser. No files are uploaded.
        </p>
      </div>

      {/* Mode Specific Controls & Actions */}
      {files.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Selected Document(s): {files.length}
            </span>
            <button
              onClick={() => setFiles([])}
              className="text-xs text-rose-500 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Queue
            </button>
          </div>

          {/* Files List with order controls */}
          <div className="space-y-2">
            {files.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-brand-500 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                  <span className="text-slate-400">({(item.size / 1024).toFixed(1)} KB)</span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {mode === 'merge' && (
                    <>
                      <button
                        onClick={() => moveFile(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:text-brand-500 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveFile(idx, 'down')}
                        disabled={idx === files.length - 1}
                        className="p-1 hover:text-brand-500 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Mode 2: Split Controls */}
          {mode === 'split' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Page Extraction Range</span>
                {pdfPageCount && (
                  <span className="text-brand-500 font-mono">Total Document Pages: {pdfPageCount}</span>
                )}
              </div>
              <input
                type="text"
                value={splitRanges}
                onChange={(e) => setSplitRanges(e.target.value)}
                placeholder="e.g. 1-3, 5, 7-9"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
              <span className="text-[11px] text-slate-400 block">
                Comma-separated page numbers or ranges (e.g. 1-5, 8).
              </span>
            </div>
          )}

          {/* Mode 4: Rotate Controls */}
          {mode === 'organize' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Rotation Angle
              </span>
              <div className="flex gap-2">
                {[90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => setRotationDegrees(deg)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      rotationDegrees === deg
                        ? 'bg-brand-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Rotate +{deg}°
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              disabled={isProcessing}
              onClick={() => {
                if (mode === 'merge') handleMerge();
                else if (mode === 'split') handleSplit();
                else if (mode === 'images') handleImagesToPdf();
                else if (mode === 'organize') handleRotate();
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing in Browser...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    {mode === 'merge' && 'Merge & Download PDF'}
                    {mode === 'split' && 'Extract & Download Pages'}
                    {mode === 'images' && 'Create PDF from Images'}
                    {mode === 'organize' && 'Apply Rotation & Download'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <RelatedTools currentTool={tool} />
    </div>
  );
};
