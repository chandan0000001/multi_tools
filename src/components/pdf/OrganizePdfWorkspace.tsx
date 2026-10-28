import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Plus,
  RotateCw,
  Trash2,
  ZoomIn,
  ArrowLeftRight,
  GripVertical,
  Layers,
  X,
  FilePlus2,
  Download,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
  SortAsc,
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { renderPdfPageThumbnail, getPdfPageCount } from '../../utils/pdfRenderer';
import { recordToolActivity } from '../../utils/cacheManager';
import { useToast } from '../../context/ToastContext';

// Color themes for multi-file differentiation matching ILovePDF style
export const FILE_COLOR_PALETTES = [
  {
    name: 'rose',
    border: 'border-rose-400 dark:border-rose-500 hover:border-rose-500',
    cardBorder: '#fb7185',
    activeRing: 'ring-2 ring-rose-400/40',
    badge: 'bg-rose-500 text-white',
    pill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800',
  },
  {
    name: 'sky',
    border: 'border-sky-400 dark:border-sky-500 hover:border-sky-500',
    cardBorder: '#38bdf8',
    activeRing: 'ring-2 ring-sky-400/40',
    badge: 'bg-sky-500 text-white',
    pill: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-300 dark:border-sky-800',
  },
  {
    name: 'amber',
    border: 'border-amber-400 dark:border-amber-500 hover:border-amber-500',
    cardBorder: '#facc15',
    activeRing: 'ring-2 ring-amber-400/40',
    badge: 'bg-amber-500 text-white',
    pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  },
  {
    name: 'emerald',
    border: 'border-emerald-400 dark:border-emerald-500 hover:border-emerald-500',
    cardBorder: '#34d399',
    activeRing: 'ring-2 ring-emerald-400/40',
    badge: 'bg-emerald-500 text-white',
    pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  },
  {
    name: 'purple',
    border: 'border-purple-400 dark:border-purple-500 hover:border-purple-500',
    cardBorder: '#c084fc',
    activeRing: 'ring-2 ring-purple-400/40',
    badge: 'bg-purple-500 text-white',
    pill: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  },
  {
    name: 'orange',
    border: 'border-orange-400 dark:border-orange-500 hover:border-orange-500',
    cardBorder: '#fb923c',
    activeRing: 'ring-2 ring-orange-400/40',
    badge: 'bg-orange-500 text-white',
    pill: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-300 dark:border-orange-800',
  },
];

const FILE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export interface SourcePdfFile {
  id: string;
  file: File;
  name: string;
  size: number;
  letter: string;
  colorIndex: number;
  arrayBuffer: ArrayBuffer;
  pageCount: number;
}

export interface OrganizePageItem {
  id: string;
  fileId: string; // 'file-0' or 'blank'
  fileName: string;
  fileLetter: string;
  colorIndex: number;
  originalPageIndex: number; // 0-based index
  displayPageNumber: number; // 1-based display number
  rotation: number; // 0, 90, 180, 270 degrees
  isBlank?: boolean;
  thumbnailDataUrl?: string;
  isRendering?: boolean;
}

interface OrganizePdfWorkspaceProps {
  initialFiles?: File[];
  onBackToCatalogue?: () => void;
}

export const OrganizePdfWorkspace: React.FC<OrganizePdfWorkspaceProps> = ({
  initialFiles = [],
  onBackToCatalogue,
}) => {
  const { showToast } = useToast();
  const [files, setFiles] = useState<SourcePdfFile[]>([]);
  const [pages, setPages] = useState<OrganizePageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingPages, setIsRenderingPages] = useState(false);
  const [zoomPage, setZoomPage] = useState<OrganizePageItem | null>(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial files if provided
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && files.length === 0) {
      handleAppendFiles(initialFiles);
    }
  }, [initialFiles]);

  // Process newly added files into pages and trigger thumbnail renders
  const handleAppendFiles = async (newFilesList: File[]) => {
    const pdfFiles = newFilesList.filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length === 0) {
      showToast('Please select valid PDF documents', 'error');
      return;
    }

    setIsRenderingPages(true);
    const addedSourceFiles: SourcePdfFile[] = [];
    const newPageItems: OrganizePageItem[] = [];

    let currentFileIndex = files.length;

    for (const file of pdfFiles) {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const letter = FILE_LETTERS[currentFileIndex % FILE_LETTERS.length];
      const colorIndex = currentFileIndex % FILE_COLOR_PALETTES.length;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pageCount = await getPdfPageCount(arrayBuffer);

        const sourceFile: SourcePdfFile = {
          id: fileId,
          file,
          name: file.name,
          size: file.size,
          letter,
          colorIndex,
          arrayBuffer,
          pageCount,
        };
        addedSourceFiles.push(sourceFile);

        for (let p = 0; p < pageCount; p++) {
          newPageItems.push({
            id: `${fileId}-p${p + 1}-${Math.random().toString(36).slice(2, 6)}`,
            fileId,
            fileName: file.name,
            fileLetter: letter,
            colorIndex,
            originalPageIndex: p,
            displayPageNumber: p + 1,
            rotation: 0,
            isBlank: false,
            thumbnailDataUrl: '',
            isRendering: true,
          });
        }

        currentFileIndex++;
      } catch (err) {
        console.error('Failed to parse PDF file:', file.name, err);
        showToast(`Could not read ${file.name}`, 'error');
      }
    }

    setFiles((prev) => [...prev, ...addedSourceFiles]);
    setPages((prev) => [...prev, ...newPageItems]);
    setIsRenderingPages(false);
    showToast(`Loaded ${addedSourceFiles.length} file(s) with ${newPageItems.length} page(s)`, 'success');

    // Asynchronously render thumbnails for all new pages
    renderThumbnailsForPages(addedSourceFiles, newPageItems);
  };

  const renderThumbnailsForPages = async (
    sourceFiles: SourcePdfFile[],
    pageItems: OrganizePageItem[]
  ) => {
    const fileBufferMap = new Map<string, ArrayBuffer>();
    sourceFiles.forEach((f) => fileBufferMap.set(f.id, f.arrayBuffer));

    for (const pageItem of pageItems) {
      const buffer = fileBufferMap.get(pageItem.fileId);
      if (!buffer) continue;

      try {
        const thumbUrl = await renderPdfPageThumbnail(buffer, pageItem.originalPageIndex + 1, 0.45);
        setPages((prev) =>
          prev.map((p) => (p.id === pageItem.id ? { ...p, thumbnailDataUrl: thumbUrl, isRendering: false } : p))
        );
      } catch (err) {
        console.warn('Thumbnail generation failed for page', pageItem.id, err);
        setPages((prev) =>
          prev.map((p) => (p.id === pageItem.id ? { ...p, isRendering: false } : p))
        );
      }
    }
  };

  // Rotate a single page clockwise by 90 degrees
  const handleRotatePage = (pageId: string) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id === pageId) {
          const nextRot = (p.rotation + 90) % 360;
          return { ...p, rotation: nextRot };
        }
        return p;
      })
    );
  };

  // Delete a specific page
  const handleDeletePage = (pageId: string) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
    showToast('Page removed from document');
  };

  // Insert a blank page at given index
  const handleInsertBlankPage = (index: number) => {
    const blankItem: OrganizePageItem = {
      id: `blank-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fileId: 'blank',
      fileName: 'Blank Page',
      fileLetter: '+',
      colorIndex: 0,
      originalPageIndex: -1,
      displayPageNumber: 0,
      rotation: 0,
      isBlank: true,
      thumbnailDataUrl: '',
      isRendering: false,
    };

    setPages((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, blankItem);
      return copy;
    });
    showToast('Inserted blank page');
  };

  // Quick move left / right
  const handleMovePage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    setPages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Drag and Drop handlers
  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (dropIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setPages((prev) => {
      const copy = [...prev];
      const [draggedItem] = copy.splice(draggedIndex, 1);
      copy.splice(dropIndex, 0, draggedItem);
      return copy;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Floating Action: Sort Alphabetically (A-Z) by source file name
  const handleSortAlphabetical = () => {
    setPages((prev) => {
      const copy = [...prev];
      copy.sort((a, b) => {
        if (a.fileName === b.fileName) {
          return a.originalPageIndex - b.originalPageIndex;
        }
        return a.fileName.localeCompare(b.fileName);
      });
      return copy;
    });
    showToast('Sorted pages alphabetically by file');
  };

  // Floating Action: Sort Naturally (1-9) matching source files order
  const handleSortNatural = () => {
    setPages((prev) => {
      const copy = [...prev];
      const fileOrderMap = new Map<string, number>();
      files.forEach((f, idx) => fileOrderMap.set(f.id, idx));

      copy.sort((a, b) => {
        const orderA = fileOrderMap.get(a.fileId) ?? 999;
        const orderB = fileOrderMap.get(b.fileId) ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.originalPageIndex - b.originalPageIndex;
      });
      return copy;
    });
    showToast('Restored natural document order');
  };

  // Floating Action: Interleave Pages (1-1 2-2) across documents
  const handleSortInterleave = () => {
    if (files.length <= 1) {
      // Reverse if single document
      setPages((prev) => [...prev].reverse());
      showToast('Reversed page order');
      return;
    }

    setPages((prev) => {
      const pagesByFile: Record<string, OrganizePageItem[]> = {};
      files.forEach((f) => (pagesByFile[f.id] = []));
      prev.forEach((p) => {
        if (pagesByFile[p.fileId]) {
          pagesByFile[p.fileId].push(p);
        }
      });

      const maxLen = Math.max(...Object.values(pagesByFile).map((arr) => arr.length));
      const interleaved: OrganizePageItem[] = [];

      for (let i = 0; i < maxLen; i++) {
        for (const f of files) {
          if (pagesByFile[f.id] && pagesByFile[f.id][i]) {
            interleaved.push(pagesByFile[f.id][i]);
          }
        }
      }

      // Add any remaining blank pages
      prev.filter((p) => p.isBlank).forEach((p) => interleaved.push(p));
      return interleaved;
    });
    showToast('Interleaved pages across documents');
  };

  // Sidebar: Remove entire file and all its pages
  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setPages((prev) => prev.filter((p) => p.fileId !== fileId));
    showToast('Removed document and all associated pages');
  };

  // Sidebar: Reset all files
  const handleResetAll = () => {
    setFiles([]);
    setPages([]);
    showToast('Workspace reset to empty');
  };

  // Core Processing: Build & Download Final Organized PDF
  const handleExecuteOrganize = async () => {
    if (pages.length === 0) {
      showToast('Please add at least one page to organize', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const outputPdf = await PDFDocument.create();

      // Pre-load all source PDFDocument instances to avoid redundant parsing
      const loadedDocsMap = new Map<string, PDFDocument>();
      for (const src of files) {
        try {
          const doc = await PDFDocument.load(src.arrayBuffer);
          loadedDocsMap.set(src.id, doc);
        } catch (e) {
          console.error('Error loading source PDF in organize execution:', src.name, e);
        }
      }

      for (const pageItem of pages) {
        if (pageItem.isBlank) {
          // Standard A4 blank page (595.28 x 841.89 points)
          outputPdf.addPage([595.28, 841.89]);
          continue;
        }

        const sourceDoc = loadedDocsMap.get(pageItem.fileId);
        if (!sourceDoc) continue;

        const [copiedPage] = await outputPdf.copyPages(sourceDoc, [pageItem.originalPageIndex]);
        const currentAngle = copiedPage.getRotation().angle;
        const totalAngle = (currentAngle + pageItem.rotation) % 360;
        copiedPage.setRotation(degrees(totalAngle));
        outputPdf.addPage(copiedPage);
      }

      const pdfBytes = await outputPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const outputName = `organized-document-${Date.now()}.pdf`;

      // Trigger instant browser download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = outputName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      // Record activity in CacheManager so cache counter increments immediately!
      recordToolActivity('pdf-tools', 'organize', {
        outputFile: outputName,
        pageCount: pages.length,
        sourceFilesCount: files.length,
        fileNames: files.map((f) => f.name),
        sizeBytes: pdfBytes.length,
      });

      showToast(`Organized PDF generated successfully (${pages.length} pages)`, 'success');
    } catch (err: any) {
      console.error('Error organizing PDF:', err);
      showToast(err.message || 'Failed to assemble organized PDF', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // If no files yet, render empty state dropzone
  if (files.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-rose-500" />
              <span>Organize PDF</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sort, rotate, delete, or add blank pages to one or multiple PDF documents with complete privacy.
            </p>
          </div>
          {onBackToCatalogue && (
            <button
              onClick={onBackToCatalogue}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              &larr; All Tools
            </button>
          )}
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleAppendFiles(Array.from(e.dataTransfer.files));
            }
          }}
          className="border-2 border-dashed border-rose-300 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 rounded-3xl p-12 sm:p-16 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
        >
          <div className="w-16 h-16 rounded-3xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
            Select your PDF Documents
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5">
            Select one or multiple PDF files to sort, combine, rotate, and organize pages. 100% in-browser processing.
          </p>
          <button
            type="button"
            className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-md shadow-rose-500/25 transition-all"
          >
            Select PDF Files
          </button>
          <span className="text-[11px] text-slate-400 mt-3 font-medium">or drop PDFs here</span>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleAppendFiles(Array.from(e.target.files));
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Active Workspace with Canvas and Sidebar
  return (
    <div className="space-y-4">
      {/* Hidden file input for adding more files */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleAppendFiles(Array.from(e.target.files));
          }
        }}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left / Center Canvas Area */}
        <div className="flex-1 w-full relative bg-slate-100/60 dark:bg-surface-900/60 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 min-h-[580px]">
          {/* Canvas Floating Action Buttons on the Right Side (ILovePDF Style) */}
          <div className="absolute right-3 top-4 sm:right-5 sm:top-5 z-20 flex flex-col gap-2.5">
            {/* Red Floating Add Files Button with badge */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Add more PDF files"
              className="relative w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
              <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900 text-white ring-2 ring-white dark:ring-surface-900">
                {files.length}
              </span>
            </button>

            {/* Sort A-Z */}
            <button
              onClick={handleSortAlphabetical}
              title="Sort Alphabetically (A-Z)"
              className="w-10 h-10 rounded-full bg-white dark:bg-surface-800 hover:bg-slate-50 dark:hover:bg-surface-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-[10px] font-bold shadow-md hover:scale-105 transition-all"
            >
              <span>A</span>
              <span className="text-[9px] -mt-1 text-slate-400">Z</span>
            </button>

            {/* Sort 1-9 Natural */}
            <button
              onClick={handleSortNatural}
              title="Sort Naturally (1-9)"
              className="w-10 h-10 rounded-full bg-white dark:bg-surface-800 hover:bg-slate-50 dark:hover:bg-surface-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-[10px] font-bold shadow-md hover:scale-105 transition-all"
            >
              <span>1</span>
              <span className="text-[9px] -mt-1 text-slate-400">9</span>
            </button>

            {/* Interleave / Alternate (1-1 2-2) */}
            <button
              onClick={handleSortInterleave}
              title={files.length > 1 ? "Interleave Pages (1-1 2-2)" : "Reverse Page Order"}
              className="w-10 h-10 rounded-full bg-white dark:bg-surface-800 hover:bg-slate-50 dark:hover:bg-surface-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-[9px] font-extrabold shadow-md hover:scale-105 transition-all leading-tight"
            >
              <span>1-1</span>
              <span className="text-[8px] text-slate-400">2-2</span>
            </button>
          </div>

          {/* Canvas Sub-header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pr-14">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Document Pages Workspace
              </span>
              <p className="text-[11px] text-slate-400">
                Drag pages to reorder, hover to rotate or delete, or click (+) to insert blank pages.
              </p>
            </div>
            {isRenderingPages && (
              <div className="flex items-center gap-2 text-xs font-medium text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-xl">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating high-res thumbnails...</span>
              </div>
            )}
          </div>

          {/* Page Thumbnails Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-y-6 gap-x-4">
            {pages.map((page, index) => {
              const palette = FILE_COLOR_PALETTES[page.colorIndex % FILE_COLOR_PALETTES.length];
              const isDragged = draggedIndex === index;
              const isOver = dragOverIndex === index;

              return (
                <div key={page.id} className="relative group">
                  {/* The Page Card */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(index, e)}
                    onDragOver={(e) => handleDragOver(index, e)}
                    onDrop={(e) => handleDrop(index, e)}
                    className={`relative rounded-2xl bg-white dark:bg-surface-900 shadow-sm border-2 transition-all cursor-grab active:cursor-grabbing flex flex-col items-center overflow-hidden ${
                      isDragged ? 'opacity-40 scale-95 border-dashed border-rose-500' : ''
                    } ${isOver ? 'ring-4 ring-rose-400/50 scale-105' : ''}`}
                    style={{ borderColor: palette.cardBorder }}
                  >
                    {/* Hover Controls Toolbar (Zoom, Rotate, Delete) */}
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-md rounded-xl p-1 text-white shadow-md">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomPage(page);
                        }}
                        title="Zoom Page Preview"
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotatePage(page.id);
                        }}
                        title="Rotate 90° Clockwise"
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(page.id);
                        }}
                        title="Delete Page"
                        className="p-1 hover:bg-rose-500 rounded-lg transition-colors text-rose-300 hover:text-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Source File Letter Tag (Top Left) */}
                    <div className="absolute top-2 left-2 z-10">
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm ${palette.badge}`}
                      >
                        {page.fileLetter}
                      </span>
                    </div>

                    {/* Page Thumbnail Preview */}
                    <div className="w-full h-44 sm:h-48 p-3 flex items-center justify-center bg-slate-50 dark:bg-surface-950/50 overflow-hidden">
                      {page.isBlank ? (
                        <div className="w-28 h-36 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-surface-900 flex flex-col items-center justify-center text-slate-400 text-center p-2">
                          <FileText className="w-6 h-6 mb-1 opacity-50" />
                          <span className="text-[10px] font-semibold">Blank Page</span>
                        </div>
                      ) : page.thumbnailDataUrl ? (
                        <img
                          src={page.thumbnailDataUrl}
                          alt={`Page ${page.displayPageNumber}`}
                          className="max-h-full max-w-full object-contain rounded shadow-sm transition-transform duration-200"
                          style={{ transform: `rotate(${page.rotation}deg)` }}
                        />
                      ) : (
                        <div className="w-28 h-36 bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-400 p-2 shadow-sm animate-pulse">
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                          <div className="w-4/5 h-2 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                          <div className="w-3/4 h-2 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                          <span className="text-[9px] font-medium text-slate-400">Loading...</span>
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Page Number & Move Controls */}
                    <div className="w-full py-1.5 px-3 bg-white dark:bg-surface-900 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovePage(index, 'left');
                        }}
                        disabled={index === 0}
                        title="Move Left"
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 text-slate-500"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {page.isBlank ? 'Blank' : page.displayPageNumber}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovePage(index, 'right');
                        }}
                        disabled={index === pages.length - 1}
                        title="Move Right"
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 text-slate-500"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inter-page "+" Insert Blank Page Button */}
                  <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleInsertBlankPage(index)}
                      title="Insert blank page here"
                      className="w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar ("Organize PDF") */}
        <div className="w-full lg:w-80 shrink-0 space-y-5 bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
          {/* Sidebar Title & Reset All */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Organize PDF
            </h3>
            <button
              onClick={handleResetAll}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline"
            >
              Reset all
            </button>
          </div>

          {/* Files List Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Files:</span>
              <span>{files.length} loaded</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {files.map((file, idx) => {
                const palette = FILE_COLOR_PALETTES[file.colorIndex % FILE_COLOR_PALETTES.length];
                return (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs font-medium shadow-sm transition-all ${palette.pill}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 opacity-50 shrink-0" />
                      <span className="font-bold shrink-0">{file.letter}:</span>
                      <span className="truncate" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      title="Remove file"
                      className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 shrink-0 text-slate-500 hover:text-rose-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document Stats Breakdown */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-surface-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>Total Output Pages:</span>
              <span className="font-bold text-slate-900 dark:text-white">{pages.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Rotated Pages:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {pages.filter((p) => p.rotation !== 0).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Blank Insertions:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {pages.filter((p) => p.isBlank).length}
              </span>
            </div>
          </div>

          {/* Big Signature Red Button (ILovePDF Style) */}
          <button
            onClick={handleExecuteOrganize}
            disabled={isProcessing || pages.length === 0}
            className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Assembling PDF...</span>
              </>
            ) : (
              <>
                <span>Organize</span>
                <span className="text-xl leading-none">&rarr;</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Zoom / Full Preview Modal */}
      {zoomPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-xl w-full bg-white dark:bg-surface-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Page Preview: {zoomPage.fileName}
                </h4>
                <span className="text-xs text-slate-500">
                  Page {zoomPage.isBlank ? 'Blank' : zoomPage.displayPageNumber} • Rotation: {zoomPage.rotation}°
                </span>
              </div>
              <button
                onClick={() => setZoomPage(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-[460px] flex items-center justify-center bg-slate-50 dark:bg-surface-950 rounded-2xl p-4 overflow-hidden">
              {zoomPage.isBlank ? (
                <div className="w-48 h-64 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400">
                  <span>Blank Page</span>
                </div>
              ) : zoomPage.thumbnailDataUrl ? (
                <img
                  src={zoomPage.thumbnailDataUrl}
                  alt="Full preview"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-md transition-transform"
                  style={{ transform: `rotate(${zoomPage.rotation}deg)` }}
                />
              ) : (
                <span className="text-sm text-slate-400">Preview rendering...</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleRotatePage(zoomPage.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate 90°</span>
              </button>

              <button
                onClick={() => setZoomPage(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
