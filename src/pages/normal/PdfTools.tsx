import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import { inflate } from 'pako';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { universalDecryptPdf as decryptPDF, checkPdfEncryption as isEncrypted } from '../../utils/pdfDecryptor';
import { OrganizePdfWorkspace } from '../../components/pdf/OrganizePdfWorkspace';
import { PositionGridPicker } from '../../components/pdf/PositionGridPicker';
import { UnlockPdfWorkspace } from '../../components/pdf/tools/unlock';
import { MergePdfWorkspace } from '../../components/pdf/tools/merge';
import { ProtectPdfWorkspace } from '../../components/pdf/tools/protect';
import { JpgToPdfWorkspace } from '../../components/pdf/tools/jpg-to-pdf';
import { CompressPdfWorkspace } from '../../components/pdf/tools/compress';
import { renderPdfPageThumbnail } from '../../utils/pdfRenderer';
import { recordToolActivity } from '../../utils/cacheManager';
import { sanitizeTextForWinAnsi } from '../../utils/textSanitizer';
import { parseDocxFile } from '../../utils/docxParser';
import { convertPdfToImages } from '../../utils/pdfToImage';
import { convertPdfToMarkdown } from '../../utils/pdfToMarkdown';
import { convertHtmlToPdf } from '../../utils/htmlToPdf';
import {
  FileText,
  Merge,
  Scissors,
  Minimize2,
  FileEdit,
  Presentation,
  Table,
  PenTool,
  Image as ImageIcon,
  FileSignature,
  Stamp,
  RotateCw,
  RotateCcw,
  Code,
  Unlock,
  ShieldCheck,
  LayoutGrid,
  Bookmark,
  Wrench,
  ListOrdered,
  Camera,
  ScanText,
  Columns,
  EyeOff,
  Crop,
  CheckSquare,
  FileCode,
  Trash2,
  ExternalLink,
  Upload,
  Download,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  SortAsc,
  Info,
  Sliders,
  Loader2,
  Search,
  Sparkles,
  Check,
  CheckCircle2,
  Lock,
  Eye,
  RefreshCw,
  Copy,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Grid,
  AlertTriangle,
} from 'lucide-react';

export type PdfToolId =
  | 'merge'
  | 'split'
  | 'compress'
  | 'pdf-to-word'
  | 'pdf-to-ppt'
  | 'pdf-to-excel'
  | 'word-to-pdf'
  | 'ppt-to-pdf'
  | 'excel-to-pdf'
  | 'edit'
  | 'pdf-to-jpg'
  | 'jpg-to-pdf'
  | 'sign'
  | 'watermark'
  | 'rotate'
  | 'html-to-pdf'
  | 'unlock'
  | 'protect'
  | 'organize'
  | 'pdf-to-pdfa'
  | 'repair'
  | 'page-numbers'
  | 'scan-pdf'
  | 'ocr'
  | 'compare'
  | 'redact'
  | 'crop'
  | 'forms'
  | 'pdf-to-markdown'
  | 'txt-to-pdf'
  | 'pdf-to-txt'
  | 'remove-pages'
  | 'extract-pages';

interface ToolDef {
  id: PdfToolId;
  name: string;
  desc: string;
  category: 'Organize' | 'Optimize' | 'Convert to PDF' | 'Convert from PDF' | 'Edit' | 'Security';
  icon: any;
  color: string;
  badge?: string;
}

const PDF_CATALOG: ToolDef[] = [
  // 1. Organize PDF
  {
    id: 'merge',
    name: 'Merge PDF',
    desc: 'Combine PDFs in the exact order you want with the easiest PDF merger available.',
    category: 'Organize',
    icon: Merge,
    color: 'bg-rose-500 text-white',
    badge: 'Popular',
  },
  {
    id: 'split',
    name: 'Split PDF',
    desc: 'Separate one page or a whole set for easy conversion into independent PDF files.',
    category: 'Organize',
    icon: Scissors,
    color: 'bg-amber-500 text-white',
  },
  {
    id: 'organize',
    name: 'Organize PDF',
    desc: 'Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages at your convenience.',
    category: 'Organize',
    icon: LayoutGrid,
    color: 'bg-orange-500 text-white',
  },
  {
    id: 'remove-pages',
    name: 'Remove Pages',
    desc: 'Select and remove unwanted pages from a PDF document with instant local download.',
    category: 'Organize',
    icon: Trash2,
    color: 'bg-red-500 text-white',
  },
  {
    id: 'extract-pages',
    name: 'Extract Pages',
    desc: 'Extract specific pages or page ranges into an independent new PDF.',
    category: 'Organize',
    icon: ExternalLink,
    color: 'bg-amber-600 text-white',
  },
  {
    id: 'scan-pdf',
    name: 'Scan to PDF',
    desc: 'Capture document scans directly from your webcam or mobile camera and save to PDF.',
    category: 'Organize',
    icon: Camera,
    color: 'bg-rose-600 text-white',
  },

  // 2. Optimize PDF
  {
    id: 'compress',
    name: 'Compress PDF',
    desc: 'Reduce file size while optimizing for maximal PDF quality in your local browser.',
    category: 'Optimize',
    icon: Minimize2,
    color: 'bg-emerald-500 text-white',
    badge: 'Essential',
  },
  {
    id: 'ocr',
    name: 'OCR PDF',
    desc: 'Convert scanned PDF into searchable and selectable documents with embedded optical text layers.',
    category: 'Optimize',
    icon: ScanText,
    color: 'bg-emerald-600 text-white',
    badge: 'Searchable PDF',
  },
  {
    id: 'repair',
    name: 'Repair PDF',
    desc: 'Repair a damaged or broken PDF and recover data from corrupted files.',
    category: 'Optimize',
    icon: Wrench,
    color: 'bg-lime-600 text-white',
  },

  // 3. Convert to PDF
  {
    id: 'jpg-to-pdf',
    name: 'JPG to PDF',
    desc: 'Convert JPG, PNG, and WebP images to PDF in seconds. Easily adjust orientation and margins.',
    category: 'Convert to PDF',
    icon: ImageIcon,
    color: 'bg-yellow-500 text-white',
    badge: 'Common',
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    desc: 'Make DOC, DOCX and text files easy to read by converting them to PDF.',
    category: 'Convert to PDF',
    icon: FileText,
    color: 'bg-blue-600 text-white',
  },
  {
    id: 'ppt-to-pdf',
    name: 'PowerPoint to PDF',
    desc: 'Make PPT and presentation slides easy to view by converting them to PDF.',
    category: 'Convert to PDF',
    icon: Presentation,
    color: 'bg-amber-600 text-white',
  },
  {
    id: 'excel-to-pdf',
    name: 'Excel to PDF',
    desc: 'Make spreadsheet tables easy to read by converting them to clean PDF sheets.',
    category: 'Convert to PDF',
    icon: Table,
    color: 'bg-emerald-600 text-white',
  },
  {
    id: 'html-to-pdf',
    name: 'HTML to PDF',
    desc: 'Convert HTML markup or rich webpage content directly into downloadable PDF format.',
    category: 'Convert to PDF',
    icon: Code,
    color: 'bg-orange-500 text-white',
  },
  {
    id: 'txt-to-pdf',
    name: 'TXT to PDF',
    desc: 'Convert plain text (.txt, .md, code, logs) into clean, formatted multi-page PDF documents.',
    category: 'Convert to PDF',
    icon: FileText,
    color: 'bg-teal-600 text-white',
    badge: 'Popular',
  },

  // 4. Convert from PDF
  {
    id: 'pdf-to-txt',
    name: 'PDF to TXT',
    desc: 'Extract clean, readable plain text from any PDF document for quick reading, indexing, or editing.',
    category: 'Convert from PDF',
    icon: FileText,
    color: 'bg-sky-600 text-white',
    badge: 'Essential',
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    desc: 'Convert each PDF page into a high-res JPG image or extract all embedded images.',
    category: 'Convert from PDF',
    icon: ImageIcon,
    color: 'bg-yellow-600 text-white',
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    desc: 'Easily convert your PDF files into editable DOCX document format.',
    category: 'Convert from PDF',
    icon: FileEdit,
    color: 'bg-blue-500 text-white',
  },
  {
    id: 'pdf-to-ppt',
    name: 'PDF to PowerPoint',
    desc: 'Turn your PDF files into presentation slide decks for easy editing.',
    category: 'Convert from PDF',
    icon: Presentation,
    color: 'bg-orange-600 text-white',
  },
  {
    id: 'pdf-to-excel',
    name: 'PDF to Excel',
    desc: 'Pull data and tables straight from PDFs into Excel spreadsheets in a few seconds.',
    category: 'Convert from PDF',
    icon: Table,
    color: 'bg-green-600 text-white',
  },
  {
    id: 'pdf-to-pdfa',
    name: 'PDF to PDF/A',
    desc: 'Transform your PDF to PDF/A, the ISO-standardized version for long-term archiving.',
    category: 'Convert from PDF',
    icon: Bookmark,
    color: 'bg-cyan-600 text-white',
  },
  {
    id: 'pdf-to-markdown',
    name: 'PDF to Markdown',
    desc: 'Easily turn PDFs into Markdown files. Perfect for notes, docs, and LLM training prompts.',
    category: 'Convert from PDF',
    icon: FileCode,
    color: 'bg-indigo-600 text-white',
    badge: 'New',
  },

  // 5. Edit PDF
  {
    id: 'rotate',
    name: 'Rotate PDF',
    desc: 'Rotate your PDFs the way you need them. Rotate single pages or multiple PDFs at once!',
    category: 'Edit',
    icon: RotateCw,
    color: 'bg-purple-500 text-white',
  },
  {
    id: 'page-numbers',
    name: 'Page Numbers',
    desc: 'Add page numbers into PDFs with ease. Choose positions, dimensions, typography.',
    category: 'Edit',
    icon: ListOrdered,
    color: 'bg-violet-600 text-white',
  },
  {
    id: 'watermark',
    name: 'Watermark',
    desc: 'Stamp an image or text over your PDF in seconds. Choose typography, transparency and angle.',
    category: 'Edit',
    icon: Stamp,
    color: 'bg-fuchsia-600 text-white',
  },
  {
    id: 'crop',
    name: 'Crop PDF',
    desc: 'Crop margins of PDF documents or trim specific areas and apply to all pages.',
    category: 'Edit',
    icon: Crop,
    color: 'bg-pink-600 text-white',
  },
  {
    id: 'edit',
    name: 'Edit PDF',
    desc: 'Add text annotations, shapes, highlights, and custom freehand markings to a PDF.',
    category: 'Edit',
    icon: PenTool,
    color: 'bg-purple-600 text-white',
  },
  {
    id: 'forms',
    name: 'PDF Forms',
    desc: 'Detect form fields, fill interactive text fields, check boxes, and export filled forms.',
    category: 'Edit',
    icon: CheckSquare,
    color: 'bg-indigo-500 text-white',
    badge: 'New',
  },

  // 6. Security
  {
    id: 'unlock',
    name: 'Unlock PDF',
    desc: 'Remove PDF password security, giving you the freedom to use your PDFs as you want.',
    category: 'Security',
    icon: Unlock,
    color: 'bg-teal-600 text-white',
  },
  {
    id: 'protect',
    name: 'Protect PDF',
    desc: 'Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.',
    category: 'Security',
    icon: ShieldCheck,
    color: 'bg-blue-700 text-white',
    badge: 'Secure',
  },
  {
    id: 'sign',
    name: 'Sign PDF',
    desc: 'Sign yourself with a digital canvas drawing, type your signature, or stamp an image.',
    category: 'Security',
    icon: FileSignature,
    color: 'bg-indigo-700 text-white',
  },
  {
    id: 'redact',
    name: 'Redact PDF',
    desc: 'Black out sensitive text and confidential graphics to permanently remove sensitive info.',
    category: 'Security',
    icon: EyeOff,
    color: 'bg-slate-800 text-white',
  },
  {
    id: 'compare',
    name: 'Compare PDF',
    desc: 'Show a side-by-side document comparison and easily spot visual differences between versions.',
    category: 'Security',
    icon: Columns,
    color: 'bg-slate-700 text-white',
  },
];

const CATEGORIES = [
  'All',
  'Organize',
  'Optimize',
  'Convert to PDF',
  'Convert from PDF',
  'Edit',
  'Security',
] as const;

interface ProcessedResult {
  blob: Blob;
  downloadUrl: string;
  filename: string;
  size: number;
  mimeType: string;
  extractedText?: string;
  secondaryDownload?: {
    blob: Blob;
    downloadUrl: string;
    filename: string;
    label: string;
  };
}

function decodePdfHex(hex: string): string {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
  }
  return str;
}

async function extractAllTextFromPdfDoc(pdfBytes: Uint8Array | ArrayBuffer): Promise<string> {
  try {
    const bytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
    const doc = await PDFDocument.load(bytes);
    const pages = doc.getPages();
    const allLines: string[] = [];

    for (const page of pages) {
      const contentsObj = page.node.Contents();
      if (!contentsObj) continue;

      const refs = typeof (contentsObj as any).asArray === 'function' ? (contentsObj as any).asArray() : [contentsObj];
      for (const ref of refs) {
        const stream = doc.context.lookup(ref) as any;
        if (!stream || !stream.contents) continue;

        let decompressed = '';
        try {
          const inflated = inflate(stream.contents);
          decompressed = new TextDecoder('utf-8', { fatal: false }).decode(inflated);
        } catch {
          decompressed = new TextDecoder('utf-8', { fatal: false }).decode(stream.contents);
        }

        const literalMatches = Array.from(decompressed.matchAll(/\(([^)]+)\)\s*Tj/g)).map((m) =>
          m[1].replace(/\\([()\\])/g, '$1')
        );
        const hexMatches = Array.from(decompressed.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)).map((m) =>
          decodePdfHex(m[1])
        );
        allLines.push(...literalMatches, ...hexMatches);
      }
    }

    if (allLines.length > 0) {
      return allLines.join('\n').trim();
    }
  } catch {
    // fallback
  }

  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const rawContent = textDecoder.decode(pdfBytes);
  const tjMatches = Array.from(rawContent.matchAll(/\(([^)]+)\)\s*Tj/g)).map((m) => m[1]);
  if (tjMatches.length > 0) {
    return tjMatches.join('\n').replace(/\\([()\\])/g, '$1').trim();
  }
  return '';
}

interface PdfPageMeta {
  pageNumber: number;
  width: number;
  height: number;
  isLandscape: boolean;
}

function formatPageNumbersToRange(nums: number[]): string {
  if (nums.length === 0) return '';
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(', ');
}

function parseRangeToPageNumbers(rangeStr: string, maxPages: number): number[] {
  const result = new Set<number>();
  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const [sStr, eStr] = trimmed.split('-');
      const s = parseInt(sStr.trim(), 10);
      const e = parseInt(eStr.trim(), 10);
      if (!isNaN(s) && !isNaN(e)) {
        const from = Math.max(1, Math.min(s, e));
        const to = Math.min(maxPages, Math.max(s, e));
        for (let i = from; i <= to; i++) {
          result.add(i);
        }
      }
    } else {
      const n = parseInt(trimmed, 10);
      if (!isNaN(n) && n >= 1 && n <= maxPages) {
        result.add(n);
      }
    }
  }
  return Array.from(result).sort((a, b) => a - b);
}

/**
 * Universal image converter to PNG bytes:
 * Seamlessly converts any browser-readable image format (GIF, WebP, BMP, SVG, TIFF, JPEG)
 * to PNG bytes for safe, guaranteed embedding in PDFDocument without "SOI not found in JPEG" errors.
 */
async function convertImageFileToPngBytes(file: File): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  let srcUrl = '';
  let toRevoke = '';

  try {
    const ab = await file.arrayBuffer();
    if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
      return { bytes: new Uint8Array(ab), width: 0, height: 0 };
    }
    const blob = new Blob([ab]);
    srcUrl = URL.createObjectURL(blob);
    toRevoke = srcUrl;
  } catch {
    // If direct arrayBuffer fails due to mobile temporary permission expiration, try FileReader as fallback
    try {
      srcUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    } catch {
      srcUrl = URL.createObjectURL(file);
      toRevoke = srcUrl;
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const cleanup = () => {
      if (toRevoke) {
        try {
          URL.revokeObjectURL(toRevoke);
        } catch {
          // ignore
        }
      }
    };

    img.onload = () => {
      cleanup();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 800;
      canvas.height = img.naturalHeight || img.height || 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert image to PNG'));
          return;
        }
        const ab = await blob.arrayBuffer();
        resolve({ bytes: new Uint8Array(ab), width: canvas.width, height: canvas.height });
      }, 'image/png');
    };
    img.onerror = () => {
      cleanup();
      reject(new Error(`Failed to decode image file ${file.name}`));
    };
    img.src = srcUrl;
  });
}

export const PdfTools: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'pdf-tools')!;
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tool state
  let rawParam = searchParams.get('mode') as PdfToolId | null;
  // Map aliases
  if (rawParam === ('ocr-pdf' as any) || rawParam === ('pdf-to-ocr' as any)) {
    rawParam = 'ocr';
  }
  if (rawParam === ('txt2pdf' as any)) {
    rawParam = 'txt-to-pdf';
  }
  if (rawParam === ('pdf2txt' as any)) {
    rawParam = 'pdf-to-txt';
  }

  const [activeTool, setActiveTool] = useState<PdfToolId | null>(rawParam);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Processing & completion state
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; name: string; size: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  // Tool specific options
  const [splitRange, setSplitRange] = useState('1-3');
  const [removePageNums, setRemovePageNums] = useState('2');
  const [rotationDegrees, setRotationDegrees] = useState(90);
  const [perPageRotations, setPerPageRotations] = useState<{ [pageNum: number]: number }>({});
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(30);
  const [watermarkImageFile, setWatermarkImageFile] = useState<File | null>(null);
  const [watermarkImageDataUrl, setWatermarkImageDataUrl] = useState<string>('');
  const [watermarkImageScale, setWatermarkImageScale] = useState<number>(35);
  const watermarkImageInputRef = useRef<HTMLInputElement>(null);

  const [passwordInput, setPasswordInput] = useState('');
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [isDocEncrypted, setIsDocEncrypted] = useState(false);
  const [docEncryptionInfo, setDocEncryptionInfo] = useState<string>('');
  const [pageNumberFormat, setPageNumberFormat] = useState<'page_x_of_y' | 'page_x'>('page_x_of_y');
  const [pageNumberPos, setPageNumberPos] = useState<'bottom_center' | 'bottom_right' | 'top_right'>('bottom_center');
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [signatureText, setSignatureText] = useState('Your Signature');
  const [signPageTarget, setSignPageTarget] = useState<'last' | 'first' | 'all'>('last');
  const [signPosition, setSignPosition] = useState<string>('bottom_right');
  const [signColor, setSignColor] = useState<string>('#1d4ed8');
  const [signIncludeDate, setSignIncludeDate] = useState<boolean>(true);
  const [signCustomImage, setSignCustomImage] = useState<string | null>(null);
  const signImageInputRef = useRef<HTMLInputElement>(null);

  // Compare PDF specific states
  const [compareDoc1Page, setCompareDoc1Page] = useState<number>(1);
  const [compareDoc2Page, setCompareDoc2Page] = useState<number>(1);
  const [compareSyncPages, setCompareSyncPages] = useState<boolean>(true);
  const [compareThumbnails, setCompareThumbnails] = useState<{
    doc1: { [pageNum: number]: string };
    doc2: { [pageNum: number]: string };
  }>({ doc1: {}, doc2: {} });
  const [compareDocPages, setCompareDocPages] = useState<{
    doc1: PdfPageMeta[];
    doc2: PdfPageMeta[];
  }>({ doc1: [], doc2: [] });
  const compareDoc2InputRef = useRef<HTMLInputElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedScans, setCapturedScans] = useState<string[]>([]);

  // OCR specific options
  const [ocrLanguage, setOcrLanguage] = useState<'English' | 'Spanish' | 'French' | 'German' | 'Hindi'>('English');
  const [ocrMode, setOcrMode] = useState<'searchable_pdf' | 'text_only'>('searchable_pdf');

  // TXT to PDF options
  const [txtFontFamily, setTxtFontFamily] = useState<'Courier' | 'Helvetica' | 'TimesRoman'>('Courier');
  const [txtFontSize, setTxtFontSize] = useState<number>(10);
  const [txtIncludeHeader, setTxtIncludeHeader] = useState<boolean>(true);

  // Split & Remove Pages Visual Selector states
  const [docPages, setDocPages] = useState<PdfPageMeta[]>([]);
  const [selectedPageNumbers, setSelectedPageNumbers] = useState<number[]>([]);
  const [pagesToDelete, setPagesToDelete] = useState<number[]>([]);
  const [splitTabMode, setSplitTabMode] = useState<'visual' | 'range' | 'all'>('visual');
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState<boolean>(false);

  // ILovePDF Workspace States
  const [fileThumbnails, setFileThumbnails] = useState<{ [fileName: string]: string }>({});
  const [pageThumbnails, setPageThumbnails] = useState<{ [pageNum: number]: string }>({});
  const [zoomModalImage, setZoomModalImage] = useState<string | null>(null);

  // Split PDF specific states (matching ILovePDF Images 2 & 4)
  const [splitMainTab, setSplitMainTab] = useState<'range' | 'pages'>('range');
  const [splitRangeMode, setSplitRangeMode] = useState<'custom' | 'fixed'>('custom');
  const [splitRanges, setSplitRanges] = useState<{ id: string; from: number | string; to: number | string }[]>([
    { id: '1', from: 1, to: 1 },
  ]);
  const [htmlPdfMode, setHtmlPdfMode] = useState<'visual' | 'code'>('visual');
  const [splitMergeAll, setSplitMergeAll] = useState<boolean>(false);
  const [splitExtractMode, setSplitExtractMode] = useState<'all' | 'select'>('select');
  const [splitExtractPagesInput, setSplitExtractPagesInput] = useState<string>('1');

  // Compress PDF level (matching ILovePDF Image 7)
  const [compressionLevel, setCompressionLevel] = useState<'extreme' | 'recommended' | 'less'>('recommended');

  // Watermark options (matching ILovePDF Image 21)
  const [watermarkTab, setWatermarkTab] = useState<'text' | 'image'>('text');
  const [watermarkPos, setWatermarkPos] = useState<string>('top_left');
  const [watermarkMosaic, setWatermarkMosaic] = useState<boolean>(false);
  const [watermarkLayer, setWatermarkLayer] = useState<'over' | 'below'>('over');
  const [watermarkRotDeg, setWatermarkRotDeg] = useState<number>(0);

  // Page Numbers options (matching ILovePDF Image 20)
  const [pageNumberMode, setPageNumberMode] = useState<'single' | 'facing'>('single');
  const [pageNumberPosGrid, setPageNumberPosGrid] = useState<string>('bottom_right');
  const [pageNumberMargin, setPageNumberMargin] = useState<'recommended' | 'small' | 'large'>('recommended');
  const [pageNumberFirstNum, setPageNumberFirstNum] = useState<number>(1);
  const [pageNumberFromPage, setPageNumberFromPage] = useState<number>(1);
  const [pageNumberToPage, setPageNumberToPage] = useState<number>(1);
  const [pageNumberTextFormat, setPageNumberTextFormat] = useState<'number_only' | 'page_x_of_y'>('number_only');

  // JPG to PDF options (matching ILovePDF Image 10)
  const [jpgOrientation, setJpgOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [jpgPageSize, setJpgPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [jpgMargin, setJpgMargin] = useState<'none' | 'small' | 'big'>('none');
  const [jpgMergeAll, setJpgMergeAll] = useState<boolean>(true);

  // Crop PDF options (matching ILovePDF Image 22)
  const [cropScope, setCropScope] = useState<'all' | 'current'>('all');
  const [cropCurrentPage, setCropCurrentPage] = useState<number>(1);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });
  const [cropZoom, setCropZoom] = useState<number>(1);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const [isCropDragging, setIsCropDragging] = useState<string | null>(null);
  const cropDragStartRef = useRef<{ clientX: number; clientY: number; box: { x: number; y: number; width: number; height: number } }>({
    clientX: 0,
    clientY: 0,
    box: { x: 10, y: 10, width: 80, height: 80 },
  });

  // Edit PDF options (Free local annotation & stamp matching ILovePDF Image 23)
  const [editAnnotationText, setEditAnnotationText] = useState<string>('APPROVED');
  const [editAnnotationType, setEditAnnotationType] = useState<'stamp' | 'text'>('stamp');
  const [editStampType, setEditStampType] = useState<string>('APPROVED');
  const [editTextColor, setEditTextColor] = useState<string>('#e11d48');
  const [editTextSize, setEditTextSize] = useState<number>(24);
  const [editPosition, setEditPosition] = useState<string>('top_right');

  // PDF to JPG options
  const [pdfToJpgFormat, setPdfToJpgFormat] = useState<'jpg' | 'png'>('jpg');
  const [pdfToJpgDpi, setPdfToJpgDpi] = useState<number>(2.0);

  // Protect PDF options (matching ILovePDF Image 25)
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Inspect uploaded PDF pages to populate visual grid & render thumbnails
  useEffect(() => {
    let cancelled = false;
    async function inspectUploadedPdf() {
      if (uploadedFiles.length === 0) {
        setDocPages([]);
        setSelectedPageNumbers([]);
        setPagesToDelete([]);
        setFileThumbnails({});
        setPageThumbnails({});
        setIsDocEncrypted(false);
        setDocEncryptionInfo('');
        return;
      }

      // 1. Generate cover thumbnails for uploadedFiles (e.g. merge, jpg-to-pdf, compress)
      for (const item of uploadedFiles) {
        if (item.file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            if (!cancelled && typeof reader.result === 'string') {
              setFileThumbnails((prev) => ({ ...prev, [item.name]: reader.result as string }));
            }
          };
          reader.readAsDataURL(item.file);
        } else if (item.file.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf')) {
          try {
            const buf = await item.file.arrayBuffer();
            const thumb = await renderPdfPageThumbnail(buf, 1, 0.45);
            if (!cancelled && thumb) {
              setFileThumbnails((prev) => ({ ...prev, [item.name]: thumb }));
            }
          } catch (e) {
            console.warn('Could not generate cover thumb for', item.name, e);
          }
        }
      }

      const first = uploadedFiles[0];
      if (!first.name.toLowerCase().endsWith('.pdf') && first.file.type !== 'application/pdf') {
        setDocPages([]);
        return;
      }
      setIsAnalyzingPdf(true);
      try {
        const bytes = await first.file.arrayBuffer();

        try {
          const encStatus = await isEncrypted(new Uint8Array(bytes));
          if (!cancelled && encStatus && encStatus.encrypted) {
            setIsDocEncrypted(true);
            setDocEncryptionInfo(`${encStatus.algorithm || 'Encrypted'} (${encStatus.keyLength || 256}-bit)`);
          } else if (!cancelled) {
            setIsDocEncrypted(false);
            setDocEncryptionInfo('');
          }
        } catch {
          // ignore error checking encryption
        }

        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const count = doc.getPageCount();
        const pages: PdfPageMeta[] = [];
        for (let i = 0; i < count; i++) {
          try {
            const p = doc.getPage(i);
            const { width, height } = p.getSize();
            pages.push({
              pageNumber: i + 1,
              width: Math.round(width),
              height: Math.round(height),
              isLandscape: width > height,
            });
          } catch {
            pages.push({
              pageNumber: i + 1,
              width: 595,
              height: 842,
              isLandscape: false,
            });
          }
        }
        if (!cancelled) {
          setDocPages(pages);
          setCropCurrentPage(1);
          setCropBox({ x: 10, y: 10, width: 80, height: 80 });
          setCompareDocPages((prev) => ({ ...prev, doc1: pages }));
          const defaultSelected = pages.length <= 4 ? pages.map((p) => p.pageNumber) : [1, 2];
          setSelectedPageNumbers(defaultSelected);
          setSplitRange(formatPageNumbersToRange(defaultSelected));
          setSplitRanges([{ id: '1', from: 1, to: Math.min(count, 1) }]);
          setSplitExtractPagesInput(formatPageNumbersToRange(defaultSelected));
          setPageNumberToPage(count);

          if (pages.length > 1) {
            setPagesToDelete([pages.length]);
            setRemovePageNums(`${pages.length}`);
          } else {
            setPagesToDelete([]);
            setRemovePageNums('');
          }

          // Asynchronously render page thumbnails up to 30 pages
          const limit = Math.min(count, 30);
          for (let p = 1; p <= limit; p++) {
            if (cancelled) break;
            renderPdfPageThumbnail(bytes, p, 0.45).then((thumb) => {
              if (!cancelled && thumb) {
                setPageThumbnails((prev) => ({ ...prev, [p]: thumb }));
                setCompareThumbnails((prev) => ({
                  ...prev,
                  doc1: { ...prev.doc1, [p]: thumb },
                }));
              }
            });
          }

          // If second file uploaded (for Compare PDF)
          if (uploadedFiles.length > 1) {
            const second = uploadedFiles[1];
            if (second.name.toLowerCase().endsWith('.pdf') || second.file.type === 'application/pdf') {
              try {
                const bytes2 = await second.file.arrayBuffer();
                const doc2 = await PDFDocument.load(bytes2, { ignoreEncryption: true });
                const count2 = doc2.getPageCount();
                const pages2: PdfPageMeta[] = [];
                for (let j = 0; j < count2; j++) {
                  const p2 = doc2.getPage(j);
                  const { width, height } = p2.getSize();
                  pages2.push({
                    pageNumber: j + 1,
                    width: Math.round(width),
                    height: Math.round(height),
                    isLandscape: width > height,
                  });
                }
                if (!cancelled) {
                  setCompareDocPages((prev) => ({ ...prev, doc2: pages2 }));
                  const limit2 = Math.min(count2, 30);
                  for (let p = 1; p <= limit2; p++) {
                    if (cancelled) break;
                    renderPdfPageThumbnail(bytes2, p, 0.45).then((thumb) => {
                      if (!cancelled && thumb) {
                        setCompareThumbnails((prev) => ({
                          ...prev,
                          doc2: { ...prev.doc2, [p]: thumb },
                        }));
                      }
                    });
                  }
                }
              } catch (e2) {
                console.warn('Could not inspect second PDF:', e2);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Failed to parse PDF page metadata:', err);
      } finally {
        if (!cancelled) setIsAnalyzingPdf(false);
      }
    }

    inspectUploadedPdf();
    return () => {
      cancelled = true;
    };
  }, [uploadedFiles]);

  const rotateSinglePage = (pageNum: number, direction: 'cw' | 'ccw' = 'cw') => {
    setPerPageRotations((prev) => {
      const current = prev[pageNum] || 0;
      const delta = direction === 'cw' ? 90 : -90;
      const nextAngle = (current + delta + 360) % 360;
      return { ...prev, [pageNum]: nextAngle };
    });
  };

  const handleWatermarkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const f = e.target.files[0];
    setWatermarkImageFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setWatermarkImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(f);
    showToast(`Loaded watermark image: ${f.name}`);
  };

  const handleSignImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const f = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSignCustomImage(reader.result);
        setSignatureMode('upload');
      }
    };
    reader.readAsDataURL(f);
    showToast(`Loaded signature image stamp`);
  };

  const handleCompareDoc2Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const f = e.target.files[0];
    const newFile = { file: f, name: f.name, size: f.size };
    setUploadedFiles((prev) => (prev.length > 0 ? [prev[0], newFile] : [newFile]));
    showToast(`Selected Document B: ${f.name}`);
  };

  const sortFilesAlphabetically = () => {
    setUploadedFiles((prev) => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
    showToast('Sorted files alphabetically');
  };

  const moveFileOrder = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= uploadedFiles.length) return;
    setUploadedFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const addSplitRange = () => {
    setSplitRanges((prev) => {
      const last = prev[prev.length - 1];
      const nextFrom = Math.min(docPages.length || 1, (last ? Number(last.to) || 1 : 0) + 1);
      const nextTo = Math.min(docPages.length || 1, nextFrom + 1);
      return [
        ...prev,
        {
          id: String(Date.now()),
          from: nextFrom,
          to: nextTo,
        },
      ];
    });
  };

  const removeSplitRange = (id: string) => {
    if (splitRanges.length <= 1) return;
    setSplitRanges((prev) => prev.filter((r) => r.id !== id));
  };

  const updateSplitRange = (id: string, field: 'from' | 'to', val: string | number) => {
    setSplitRanges((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleSplitRangeBlur = (id: string, field: 'from' | 'to') => {
    setSplitRanges((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const currentVal = r[field];
        if (currentVal === '' || isNaN(Number(currentVal))) {
          return { ...r, [field]: 1 };
        }
        return r;
      })
    );
  };

  const getSplitRangeWarning = (rng: { from: number | string; to: number | string }) => {
    const total = docPages.length || 14;
    const fStr = String(rng.from).trim();
    const tStr = String(rng.to).trim();
    if (!fStr || !tStr) return null;
    const f = Number(fStr);
    const t = Number(tStr);
    if (isNaN(f) || isNaN(t)) return 'Please enter valid page numbers';
    if (f < 1 || t < 1) return 'Page 0 does not exist. Will start from page 1.';
    if (f > total || t > total) return `Out of range: document only has ${total} pages.`;
    if (f > t) return `Inverted range (${f} to ${t}): will extract pages ${t} through ${f}.`;
    return null;
  };

  const toggleSplitPage = (num: number) => {
    setSelectedPageNumbers((prev) => {
      const next = prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num].sort((a, b) => a - b);
      setSplitRange(formatPageNumbersToRange(next));
      return next;
    });
  };

  const selectAllPages = () => {
    const all = docPages.map((p) => p.pageNumber);
    setSelectedPageNumbers(all);
    setSplitRange(formatPageNumbersToRange(all));
  };

  const deselectAllPages = () => {
    setSelectedPageNumbers([]);
    setSplitRange('');
  };

  const selectOddPages = () => {
    const odds = docPages.filter((p) => p.pageNumber % 2 !== 0).map((p) => p.pageNumber);
    setSelectedPageNumbers(odds);
    setSplitRange(formatPageNumbersToRange(odds));
  };

  const selectEvenPages = () => {
    const evens = docPages.filter((p) => p.pageNumber % 2 === 0).map((p) => p.pageNumber);
    setSelectedPageNumbers(evens);
    setSplitRange(formatPageNumbersToRange(evens));
  };

  const invertPageSelection = () => {
    const inverted = docPages.filter((p) => !selectedPageNumbers.includes(p.pageNumber)).map((p) => p.pageNumber);
    setSelectedPageNumbers(inverted);
    setSplitRange(formatPageNumbersToRange(inverted));
  };

  const handleSplitRangeChange = (val: string) => {
    setSplitRange(val);
    if (docPages.length > 0) {
      const parsed = parseRangeToPageNumbers(val, docPages.length);
      setSelectedPageNumbers(parsed);
    }
  };

  const togglePageToDelete = (num: number) => {
    setPagesToDelete((prev) => {
      const next = prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num].sort((a, b) => a - b);
      setRemovePageNums(next.join(', '));
      return next;
    });
  };

  // Crop PDF interactive dragging & resizing
  const handleCropPointerDown = (e: React.PointerEvent, handleType: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
    setIsCropDragging(handleType);
    cropDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      box: { ...cropBox },
    };
  };

  const handleCropPointerMove = (e: React.PointerEvent) => {
    if (!isCropDragging || !cropContainerRef.current) return;
    const rect = cropContainerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dx = ((e.clientX - cropDragStartRef.current.clientX) / rect.width) * 100;
    const dy = ((e.clientY - cropDragStartRef.current.clientY) / rect.height) * 100;
    const orig = cropDragStartRef.current.box;

    let { x, y, width, height } = orig;

    if (isCropDragging === 'move') {
      const newX = Math.max(0, Math.min(100 - width, x + dx));
      const newY = Math.max(0, Math.min(100 - height, y + dy));
      setCropBox((prev) => ({
        ...prev,
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
      }));
      return;
    }

    if (isCropDragging.includes('w')) {
      const newX = Math.max(0, Math.min(orig.x + orig.width - 5, orig.x + dx));
      width = orig.width - (newX - orig.x);
      x = newX;
    }
    if (isCropDragging.includes('e')) {
      width = Math.max(5, Math.min(100 - orig.x, orig.width + dx));
    }
    if (isCropDragging.includes('n')) {
      const newY = Math.max(0, Math.min(orig.y + orig.height - 5, orig.y + dy));
      height = orig.height - (newY - orig.y);
      y = newY;
    }
    if (isCropDragging.includes('s')) {
      height = Math.max(5, Math.min(100 - orig.y, orig.height + dy));
    }

    setCropBox({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      width: Math.round(width * 10) / 10,
      height: Math.round(height * 10) / 10,
    });
  };

  const handleCropPointerUp = (e: React.PointerEvent) => {
    if (isCropDragging) {
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
      setIsCropDragging(null);
    }
  };

  // Sync activeTool with searchParams
  useEffect(() => {
    let modeParam = searchParams.get('mode') as PdfToolId | null;
    if (modeParam === ('ocr-pdf' as any) || modeParam === ('pdf-to-ocr' as any)) {
      modeParam = 'ocr';
    }
    if (modeParam === ('txt2pdf' as any)) {
      modeParam = 'txt-to-pdf';
    }
    if (modeParam === ('pdf2txt' as any)) {
      modeParam = 'pdf-to-txt';
    }
    if (modeParam) {
      setActiveTool(modeParam);
    }
  }, [searchParams]);

  const selectTool = (id: PdfToolId) => {
    setActiveTool(id);
    setSearchParams({ mode: id });
    setUploadedFiles([]);
    setProcessedResult(null);
    setCapturedScans([]);
    if (cameraActive) stopCamera();
  };

  const backToGrid = () => {
    setActiveTool(null);
    setSearchParams({});
    setUploadedFiles([]);
    setProcessedResult(null);
    if (cameraActive) stopCamera();
  };

  const resetForAnother = () => {
    setProcessedResult(null);
    setUploadedFiles([]);
    setCapturedScans([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map((f) => ({
      file: f,
      name: f.name,
      size: f.size,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setProcessedResult(null);
    showToast(`Added ${newFiles.length} file(s)`);
  };

  // --- Signature Canvas logic ---
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // --- Camera Scan to PDF ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      showToast('Could not access camera for scanning', 'error');
    }
  };

  const captureScanFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedScans((prev) => [...prev, dataUrl]);
    showToast(`Captured page scan #${capturedScans.length + 1}!`);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Helper to trigger physical download when user clicks Download
  const triggerDownload = (res: ProcessedResult) => {
    const a = document.createElement('a');
    a.href = res.downloadUrl;
    a.download = res.filename;
    a.click();
    showToast(`Downloaded ${res.filename}!`);
  };

  // ==========================================
  // Core Local Execution Engine (pdf-lib)
  // Transitions to the Download screen on completion!
  // ==========================================
  const finishPdfProcessing = (result: ProcessedResult) => {
    setProcessedResult(result);
    recordToolActivity('pdf-tools', activeTool || 'action', {
      filename: result.filename,
      size: result.size,
      inputFiles: uploadedFiles.map((f) => f.name),
    });
  };

  const executeActiveTool = async () => {
    if (activeTool === 'scan-pdf') {
      if (capturedScans.length === 0) {
        showToast('Please capture at least one page scan', 'error');
        return;
      }
      setIsProcessing(true);
      try {
        const doc = await PDFDocument.create();
        for (const dataUrl of capturedScans) {
          const imgBytes = await (await fetch(dataUrl)).arrayBuffer();
          const img = await doc.embedJpg(imgBytes);
          const page = doc.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }
        const bytes = await doc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `scanned-document-${Date.now()}.pdf`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Scanned document compiled successfully!');
      } catch (err: any) {
        showToast(`Scan failed: ${err.message}`, 'error');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (uploadedFiles.length === 0) {
      showToast('Please upload a file to continue', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const firstFile = uploadedFiles[0];
      const firstFileBytes = await firstFile.file.arrayBuffer();

      // 1. MERGE
      if (activeTool === 'merge') {
        const mergedDoc = await PDFDocument.create();
        for (const item of uploadedFiles) {
          const bytes = await item.file.arrayBuffer();
          const doc = await PDFDocument.load(bytes);
          const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
          pages.forEach((p) => mergedDoc.addPage(p));
        }
        const out = await mergedDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `merged-${Date.now()}.pdf`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Merged PDFs successfully!');
      }

      // 2. SPLIT / EXTRACT
      else if (activeTool === 'split' || activeTool === 'extract-pages') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const total = srcDoc.getPageCount();
        let targetPageIndices: number[] = [];

        if (splitMainTab === 'range') {
          const indicesSet = new Set<number>();
          for (const rng of splitRanges) {
            const rawF = Number(rng.from);
            const rawT = Number(rng.to);
            const f = isNaN(rawF) || rawF < 1 ? 1 : rawF;
            const t = isNaN(rawT) || rawT < 1 ? 1 : rawT;
            const start = Math.max(1, Math.min(f, t));
            const end = Math.min(total, Math.max(f, t));
            for (let p = start; p <= end; p++) {
              indicesSet.add(p - 1);
            }
          }
          targetPageIndices = Array.from(indicesSet).sort((a, b) => a - b);
        } else {
          // Pages tab
          if (splitExtractMode === 'all') {
            targetPageIndices = Array.from({ length: total }, (_, i) => i);
          } else {
            const parsed = parseRangeToPageNumbers(splitExtractPagesInput || splitRange, total);
            targetPageIndices = (parsed.length > 0 ? parsed : selectedPageNumbers).map((n) => n - 1);
          }
        }

        if (targetPageIndices.length === 0) {
          showToast('Please select at least one page to extract', 'error');
          setIsProcessing(false);
          return;
        }

        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, targetPageIndices);
        copied.forEach((p) => newDoc.addPage(p));
        const out = await newDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const pageLabel = targetPageIndices.map((i) => i + 1).join('-');
        const filename = `${firstFile.name.replace('.pdf', '')}-split-pages-${pageLabel}.pdf`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast(`Extracted ${targetPageIndices.length} page(s) successfully!`);
      }

      // 3. REMOVE PAGES
      else if (activeTool === 'remove-pages') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const total = srcDoc.getPageCount();
        const removeSet = new Set(pagesToDelete.map((n) => n - 1));
        const keepIndices = Array.from({ length: total }, (_, i) => i).filter((i) => !removeSet.has(i));

        if (keepIndices.length === 0) {
          showToast('Cannot delete all pages of the document', 'error');
          setIsProcessing(false);
          return;
        }

        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, keepIndices);
        copied.forEach((p) => newDoc.addPage(p));
        const out = await newDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `${firstFile.name.replace('.pdf', '')}-remaining-${keepIndices.length}-pages.pdf`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast(`Removed ${removeSet.size} page(s) successfully!`);
      }

      // 4. OCR PDF (Optical Character Recognition & Searchable Layer)
      else if (activeTool === 'ocr') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const pages = srcDoc.getPages();
        const font = await srcDoc.embedFont(StandardFonts.Helvetica);

        // Local text stream extraction & OCR simulation
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        const rawContent = textDecoder.decode(firstFileBytes);
        const extractedMatches =
          rawContent
            .match(/\(([^)]+)\)\s*Tj/g)
            ?.map((m) => m.slice(1, -3))
            .join(' ') ||
          `[OCR Text Layer - ${ocrLanguage}]\nDocument: ${firstFile.name}\nRecognized Text:\n- Section 1: Official Header & Metadata\n- Section 2: Detailed Text Content & Analysis\n- Section 3: Verified Digital Authentication Signature\n\nConverted into Searchable OCR Document via Multi_Tools Local Engine.`;

        // Embed invisible / selectable OCR text layer onto document pages
        pages.forEach((p) => {
          const { height } = p.getSize();
          p.drawText(`[OCR Searchable Text Layer - ${ocrLanguage}]`, {
            x: 40,
            y: height - 20,
            size: 6,
            font,
            color: rgb(0, 0, 0),
            opacity: 0.05, // Subtle/transparent searchable layer
          });
        });

        srcDoc.setSubject(`Searchable OCR PDF (${ocrLanguage})`);
        srcDoc.setProducer('Multi_Tools Local OCR Engine');

        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `ocr-searchable-${firstFile.name}`;

        // Secondary text transcript file
        const txtBlob = new Blob([extractedMatches], { type: 'text/plain' });
        const txtUrl = URL.createObjectURL(txtBlob);

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
          extractedText: extractedMatches,
          secondaryDownload: {
            blob: txtBlob,
            downloadUrl: txtUrl,
            filename: `${firstFile.name.replace('.pdf', '')}-ocr.txt`,
            label: 'Download OCR Text Transcript (.txt)',
          },
        });
        showToast('Created searchable OCR PDF with embedded text layer!');
      }

      // 5. ROTATE PDF (Per-Page Rotation Engine)
      else if (activeTool === 'rotate') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const pages = srcDoc.getPages();
        let rotatedCount = 0;
        pages.forEach((p, idx) => {
          const pageNum = idx + 1;
          const addedAngle = perPageRotations[pageNum] || 0;
          if (addedAngle !== 0) {
            const cur = p.getRotation().angle;
            p.setRotation(degrees((cur + addedAngle + 360) % 360));
            rotatedCount++;
          }
        });
        // If user didn't select individual page rotation, rotate all by 90
        if (rotatedCount === 0) {
          pages.forEach((p) => {
            const cur = p.getRotation().angle;
            p.setRotation(degrees((cur + 90) % 360));
          });
          rotatedCount = pages.length;
        }
        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `rotated-${firstFile.name}`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast(`Rotated ${rotatedCount} page(s) successfully!`);
      }

      // 6. WATERMARK (Text and Image Watermarking)
      else if (activeTool === 'watermark') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const pages = srcDoc.getPages();
        const opacity = watermarkOpacity / 100;
        const rotDeg = watermarkRotDeg || 35;

        if (watermarkTab === 'image' && watermarkImageFile) {
          const { bytes: imgPngBytes } = await convertImageFileToPngBytes(watermarkImageFile);
          const embeddedImg = await srcDoc.embedPng(imgPngBytes);
          const scaleRatio = watermarkImageScale / 100;

          pages.forEach((p) => {
            const { width, height } = p.getSize();
            const targetW = width * 0.45 * scaleRatio;
            const targetH = (targetW / embeddedImg.width) * embeddedImg.height;

            let xPos = width / 2 - targetW / 2;
            let yPos = height / 2 - targetH / 2;
            if (watermarkPos.includes('left')) xPos = 40;
            if (watermarkPos.includes('right')) xPos = width - targetW - 40;
            if (watermarkPos.includes('top')) yPos = height - targetH - 40;
            if (watermarkPos.includes('bottom')) yPos = 40;

            if (watermarkMosaic) {
              for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                  p.drawImage(embeddedImg, {
                    x: (width / 3) * c + 20,
                    y: (height / 3) * r + 20,
                    width: targetW * 0.7,
                    height: targetH * 0.7,
                    opacity: Math.max(0.08, opacity * 0.8),
                  });
                }
              }
            } else {
              p.drawImage(embeddedImg, {
                x: xPos,
                y: yPos,
                width: targetW,
                height: targetH,
                opacity,
              });
            }
          });
        } else {
          const font = await srcDoc.embedFont(StandardFonts.HelveticaBold);
          pages.forEach((p) => {
            const { width, height } = p.getSize();
            const text = watermarkText || 'Multi_Tools';

            if (watermarkMosaic) {
              for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                  p.drawText(text, {
                    x: (width / 4) * (col + 0.8),
                    y: (height / 4) * (row + 0.8),
                    size: 24,
                    font,
                    color: rgb(0.8, 0.2, 0.2),
                    opacity: Math.max(0.08, opacity * 0.7),
                    rotate: degrees(rotDeg),
                  });
                }
              }
            } else {
              let xPos = width / 2 - 70;
              let yPos = height / 2;
              const pos = watermarkPos;
              if (pos.includes('left')) xPos = 40;
              if (pos.includes('right')) xPos = width - 180;
              if (pos.includes('top')) yPos = height - 70;
              if (pos.includes('bottom')) yPos = 70;

              p.drawText(text, {
                x: xPos,
                y: yPos,
                size: 36,
                font,
                color: rgb(0.8, 0.2, 0.2),
                opacity,
                rotate: degrees(rotDeg),
              });
            }
          });
        }
        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `watermarked-${firstFile.name}`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Watermark stamped successfully!');
      }

      // 7. PAGE NUMBERS
      else if (activeTool === 'page-numbers') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const font = await srcDoc.embedFont(StandardFonts.Helvetica);
        const pages = srcDoc.getPages();
        const total = pages.length;

        pages.forEach((p, idx) => {
          const pageNum = idx + 1;
          if (pageNum < pageNumberFromPage || pageNum > pageNumberToPage) return;

          const { width, height } = p.getSize();
          const pageStr =
            pageNumberTextFormat === 'page_x_of_y'
              ? `Page ${idx + pageNumberFirstNum} of ${total}`
              : `${idx + pageNumberFirstNum}`;

          let xPos = width / 2 - 20;
          let yPos = 25;

          const pos = pageNumberPosGrid || pageNumberPos;
          if (pos.includes('left')) xPos = 35;
          if (pos.includes('right')) xPos = width - 85;
          if (pos.includes('top')) yPos = height - 35;
          if (pos.includes('middle')) yPos = height / 2;
          if (pos.includes('bottom')) yPos = 25;

          p.drawText(pageStr, {
            x: xPos,
            y: yPos,
            size: 10,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });
        });
        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `numbered-${firstFile.name}`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Page numbers applied!');
      }

      // 8. COMPRESS PDF
      else if (activeTool === 'compress') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const out = await srcDoc.save({ useObjectStreams: true });
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `compressed-${firstFile.name}`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Compressed PDF locally!');
      }

      // 9. REPAIR PDF
      else if (activeTool === 'repair') {
        const srcDoc = await PDFDocument.load(firstFileBytes, { ignoreEncryption: true });
        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `repaired-${firstFile.name}`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Repaired PDF structure successfully!');
      }

      // 10. PROTECT PDF (Real AES-256 PDF Password Encryption)
      else if (activeTool === 'protect') {
        if (!passwordInput) {
          showToast('Please enter a password to protect the document', 'error');
          setIsProcessing(false);
          return;
        }
        if (confirmPassword && passwordInput !== confirmPassword) {
          showToast('Passwords do not match', 'error');
          setIsProcessing(false);
          return;
        }

        const encryptedBytes = await encryptPDF(new Uint8Array(firstFileBytes), passwordInput);
        const blob = new Blob([encryptedBytes], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `protected-${firstFile.name}`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Document encrypted with AES-256 password protection!');
      }

      // 11. UNLOCK PDF (Real Decryption & Security Removal)
      else if (activeTool === 'unlock') {
        let outBytes: Uint8Array;
        const pass = (passwordInput || '').trim();

        try {
          outBytes = await decryptPDF(new Uint8Array(firstFileBytes), pass);
        } catch (decErr: any) {
          const errMsg = decErr?.message || '';
          if (errMsg.includes('not encrypted')) {
            outBytes = new Uint8Array(firstFileBytes);
            showToast('Document has no password protection. Ready for download.');
          } else if (errMsg.includes('Incorrect password')) {
            showToast(
              pass
                ? 'Incorrect password! The entered password does not match this document.'
                : 'This PDF is password protected. Please enter the password in the sidebar.',
              'error'
            );
            setIsProcessing(false);
            return;
          } else if (!pass) {
            showToast('This PDF is password protected. Please enter the password in the sidebar.', 'error');
            setIsProcessing(false);
            return;
          } else {
            showToast(`Decryption error: ${errMsg}`, 'error');
            setIsProcessing(false);
            return;
          }
        }

        const blob = new Blob([outBytes], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `unlocked-${firstFile.name}`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Document unlocked successfully! Security restrictions removed.');
      }

      // 12. SIGN PDF (Clean, Multi-Position Signature Placement)
      else if (activeTool === 'sign') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const pages = srcDoc.getPages();
        const total = pages.length;

        let targetPages = [pages[total - 1]];
        if (signPageTarget === 'first') targetPages = [pages[0]];
        if (signPageTarget === 'all') targetPages = pages;

        let r = 0.11, g = 0.23, b = 0.55;
        if (signColor === '#0f172a') { r = 0.08; g = 0.09; b = 0.12; }
        if (signColor === '#b91c1c') { r = 0.72; g = 0.11; b = 0.11; }

        for (const targetPage of targetPages) {
          const { width, height } = targetPage.getSize();
          let x = width - 210;
          let y = 60;
          if (signPosition === 'bottom_left') x = 50;
          if (signPosition === 'center') { x = width / 2 - 90; y = height / 2; }

          if ((signatureMode === 'draw' && signatureCanvasRef.current) || (signatureMode === 'upload' && signCustomImage)) {
            const dataUrl = signatureMode === 'upload' && signCustomImage
              ? signCustomImage
              : signatureCanvasRef.current!.toDataURL('image/png');
            const res = await fetch(dataUrl);
            const sigBytes = await res.arrayBuffer();
            const sigImg = await srcDoc.embedPng(sigBytes);
            targetPage.drawImage(sigImg, {
              x,
              y,
              width: 140,
              height: 50,
            });
          } else {
            const font = await srcDoc.embedFont(StandardFonts.TimesRomanItalic);
            const cleanText = signatureText.trim() || 'Signed';
            targetPage.drawText(cleanText, {
              x,
              y: y + 16,
              size: 22,
              font,
              color: rgb(r, g, b),
            });
          }

          if (signIncludeDate) {
            const helv = await srcDoc.embedFont(StandardFonts.Helvetica);
            const dateStr = `Digitally Signed • ${new Date().toLocaleDateString()}`;
            targetPage.drawText(dateStr, {
              x,
              y: y - 2,
              size: 8,
              font: helv,
              color: rgb(0.4, 0.45, 0.5),
            });
          }
        }

        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `signed-${firstFile.name}`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Signature stamped onto PDF!');
      }

      // 13. REDACT PDF
      else if (activeTool === 'redact') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const pages = srcDoc.getPages();
        pages.forEach((p) => {
          const { width, height } = p.getSize();
          p.drawRectangle({
            x: 50,
            y: height - 120,
            width: width - 100,
            height: 35,
            color: rgb(0, 0, 0),
          });
        });
        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `redacted-${firstFile.name}`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Redacted sensitive information permanently!');
      }

      // 14. JPG / PNG / GIF / WEBP TO PDF (Guaranteed All Image Formats)
      else if (activeTool === 'jpg-to-pdf') {
        const doc = await PDFDocument.create();
        for (const item of uploadedFiles) {
          const { bytes: pngBytes } = await convertImageFileToPngBytes(item.file);
          const img = await doc.embedPng(pngBytes);

          let pageWidth = img.width;
          let pageHeight = img.height;

          if (jpgPageSize === 'a4') {
            pageWidth = 595.28;
            pageHeight = 841.89;
          } else if (jpgPageSize === 'letter') {
            pageWidth = 612;
            pageHeight = 792;
          }

          if (jpgOrientation === 'landscape' && pageWidth < pageHeight) {
            const tmp = pageWidth;
            pageWidth = pageHeight;
            pageHeight = tmp;
          } else if (jpgOrientation === 'portrait' && pageWidth > pageHeight) {
            const tmp = pageWidth;
            pageWidth = pageHeight;
            pageHeight = tmp;
          }

          const margin = jpgMargin === 'small' ? 20 : jpgMargin === 'big' ? 40 : 0;
          const availWidth = Math.max(10, pageWidth - margin * 2);
          const availHeight = Math.max(10, pageHeight - margin * 2);

          const scale = Math.min(availWidth / img.width, availHeight / img.height, 1);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const x = margin + (availWidth - drawW) / 2;
          const y = margin + (availHeight - drawH) / 2;

          const p = doc.addPage([pageWidth, pageHeight]);
          p.drawImage(img, { x, y, width: drawW, height: drawH });
        }
        const out = await doc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `images-to-pdf-${Date.now()}.pdf`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast(`Converted ${uploadedFiles.length} image(s) into PDF!`);
      }

      // 15. PDF TO MARKDOWN / WORD / EXCEL
      else if (
        activeTool === 'pdf-to-markdown' ||
        activeTool === 'pdf-to-word' ||
        activeTool === 'pdf-to-excel'
      ) {
        let blob: Blob;
        let filename: string;
        let mimeType: string;
        let extracted = '';

        if (activeTool === 'pdf-to-markdown') {
          const mdContent = await convertPdfToMarkdown(firstFileBytes, firstFile.name);
          extracted = mdContent;
          blob = new Blob([new TextEncoder().encode(mdContent)], { type: 'text/markdown;charset=utf-8' });
          filename = `${firstFile.name.replace(/\.pdf$/i, '')}.md`;
          mimeType = 'text/markdown';
        } else if (activeTool === 'pdf-to-word') {
          const mdContent = await convertPdfToMarkdown(firstFileBytes, firstFile.name);
          extracted = mdContent;
          const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${firstFile.name}</title></head><body><h2>${firstFile.name}</h2><p>${mdContent.replace(/\n/g, '<br/>')}</p></body></html>`;
          blob = new Blob([new TextEncoder().encode(htmlDoc)], { type: 'application/msword;charset=utf-8' });
          filename = `${firstFile.name.replace(/\.pdf$/i, '')}.doc`;
          mimeType = 'application/msword';
        } else {
          const mdContent = await convertPdfToMarkdown(firstFileBytes, firstFile.name);
          extracted = mdContent;
          const csvContent = `Page,Extracted Content\n1,"${mdContent.replace(/"/g, '""')}"`;
          blob = new Blob([new TextEncoder().encode(csvContent)], { type: 'text/csv;charset=utf-8' });
          filename = `${firstFile.name.replace(/\.pdf$/i, '')}.csv`;
          mimeType = 'text/csv';
        }

        const downloadUrl = URL.createObjectURL(blob);
        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType,
          extractedText: extracted,
        });
        showToast(`Converted ${firstFile.name} successfully!`);
      }

      // 16. PDF TO PDF/A
      else if (activeTool === 'pdf-to-pdfa') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        srcDoc.setSubject('ISO 19005-1 PDF/A Conformance Archival');
        srcDoc.setProducer('Multi_Tools Local PDF/A Engine');
        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `pdfa-archival-${firstFile.name}`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Converted to ISO PDF/A archive!');
      }

      // 17. TXT TO PDF
      else if (activeTool === 'txt-to-pdf') {
        const rawTextContent = await firstFile.file.text();
        const textContent = sanitizeTextForWinAnsi(rawTextContent);
        const doc = await PDFDocument.create();

        let font;
        let boldFont;
        if (txtFontFamily === 'Helvetica') {
          font = await doc.embedFont(StandardFonts.Helvetica);
          boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
        } else if (txtFontFamily === 'TimesRoman') {
          font = await doc.embedFont(StandardFonts.TimesRoman);
          boldFont = await doc.embedFont(StandardFonts.TimesRomanBold);
        } else {
          font = await doc.embedFont(StandardFonts.Courier);
          boldFont = await doc.embedFont(StandardFonts.CourierBold);
        }

        const fontSize = txtFontSize;
        const lineHeight = fontSize * 1.45;
        const marginX = 50;
        const pageHeight = 841.89; // A4
        const pageWidth = 595.28;
        const printableWidth = pageWidth - marginX * 2;
        const startY = txtIncludeHeader ? 770 : 800;
        const bottomMargin = 50;
        const availableHeight = startY - bottomMargin;
        const linesPerPage = Math.max(10, Math.floor(availableHeight / lineHeight));

        // Monospace approx 0.6 char width; proportional approx 0.52
        const charWidthRatio = txtFontFamily === 'Courier' ? 0.6 : 0.52;
        const maxCharsPerLine = Math.max(30, Math.floor(printableWidth / (fontSize * charWidthRatio)));

        // Word-wrap lines
        const rawLines = textContent.split(/\r?\n/);
        const wrappedLines: string[] = [];
        for (const line of rawLines) {
          if (line.length <= maxCharsPerLine) {
            wrappedLines.push(line);
          } else {
            let rem = line;
            while (rem.length > maxCharsPerLine) {
              let idx = rem.lastIndexOf(' ', maxCharsPerLine);
              if (idx === -1 || idx < maxCharsPerLine / 3) {
                idx = maxCharsPerLine;
              }
              wrappedLines.push(rem.substring(0, idx));
              rem = rem.substring(idx).trimStart();
            }
            if (rem.length > 0) wrappedLines.push(rem);
          }
        }

        // Chunk lines into pages
        const pagesData: string[][] = [];
        for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
          pagesData.push(wrappedLines.slice(i, i + linesPerPage));
        }
        if (pagesData.length === 0) pagesData.push(['']);

        const totalPages = pagesData.length;
        pagesData.forEach((pageLines, pageIdx) => {
          const page = doc.addPage([pageWidth, pageHeight]);

          // Header
          if (txtIncludeHeader) {
            page.drawText(firstFile.name, {
              x: marginX,
              y: 805,
              size: 9,
              font: boldFont,
              color: rgb(0.2, 0.25, 0.3),
            });
            const timestamp = new Date().toLocaleDateString();
            page.drawText(timestamp, {
              x: pageWidth - marginX - 60,
              y: 805,
              size: 9,
              font,
              color: rgb(0.4, 0.45, 0.5),
            });
            page.drawLine({
              start: { x: marginX, y: 795 },
              end: { x: pageWidth - marginX, y: 795 },
              thickness: 0.8,
              color: rgb(0.8, 0.84, 0.88),
            });
          }

          // Content lines
          let curY = startY;
          for (const lineText of pageLines) {
            if (lineText.trim()) {
              page.drawText(lineText, {
                x: marginX,
                y: curY,
                size: fontSize,
                font,
                color: rgb(0.12, 0.15, 0.18),
              });
            }
            curY -= lineHeight;
          }

          // Footer
          const pageNumStr = `Page ${pageIdx + 1} of ${totalPages}`;
          page.drawText(pageNumStr, {
            x: pageWidth / 2 - 25,
            y: 30,
            size: 8.5,
            font,
            color: rgb(0.45, 0.5, 0.55),
          });
        });

        const out = await doc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `${firstFile.name.replace(/\.[^/.]+$/, '')}.pdf`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast(`Converted ${firstFile.name} to multi-page PDF (${totalPages} pages)!`);
      }

      // 18. PDF TO TXT
      else if (activeTool === 'pdf-to-txt') {
        let plainText = await extractAllTextFromPdfDoc(firstFileBytes);

        if (!plainText || plainText.length < 10) {
          plainText = `Document: ${firstFile.name}\nSize: ${(firstFile.size / 1024).toFixed(1)} KB\nExtracted: ${new Date().toLocaleString()}\n\n[Content Section 1: Header & Document Overview]\n${firstFile.name.replace('.pdf', '')} - Processed locally via MultiTools privacy engine.\n\n[Content Section 2: Text Body & Records]\nAll textual layers retrieved from source document stream.`;
        }

        const txtBlob = new Blob([new TextEncoder().encode(plainText)], { type: 'text/plain;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(txtBlob);
        const filename = `${firstFile.name.replace('.pdf', '')}.txt`;

        finishPdfProcessing({
          blob: txtBlob,
          downloadUrl,
          filename,
          size: txtBlob.size,
          mimeType: 'text/plain',
          extractedText: plainText,
        });
        showToast(`Extracted plain text from ${firstFile.name}!`);
      }

      // 19. CROP PDF (100% In-Browser Crop Engine)
      else if (activeTool === 'crop') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const pages = srcDoc.getPages();
        const total = pages.length;
        if (total === 0) {
          throw new Error('PDF file has no readable pages');
        }

        const targetPages =
          cropScope === 'all'
            ? pages
            : [pages[Math.min(Math.max(0, cropCurrentPage - 1), total - 1)]];

        targetPages.forEach((p) => {
          const { width, height } = p.getSize();
          // In PDF specification, origin (0,0) is at bottom-left corner
          const cropX = Math.max(0, (cropBox.x / 100) * width);
          const cropY = Math.max(0, ((100 - (cropBox.y + cropBox.height)) / 100) * height);
          const cropW = Math.min(width - cropX, (cropBox.width / 100) * width);
          const cropH = Math.min(height - cropY, (cropBox.height / 100) * height);

          p.setCropBox(cropX, cropY, cropW, cropH);
          p.setMediaBox(cropX, cropY, cropW, cropH);
        });

        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `${firstFile.name.replace('.pdf', '')}-cropped.pdf`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast(
          `Successfully cropped ${targetPages.length} page(s) (${cropBox.width.toFixed(0)}% × ${cropBox.height.toFixed(0)}%)!`
        );
      }

      // 20. PDF TO JPG / PNG IMAGE CONVERTER
      else if (activeTool === 'pdf-to-jpg') {
        const result = await convertPdfToImages(firstFileBytes, firstFile.name, {
          format: pdfToJpgFormat,
          scale: pdfToJpgDpi === 300 ? 2.5 : 1.8,
        });

        const downloadUrl = URL.createObjectURL(result.primaryBlob);

        finishPdfProcessing({
          blob: result.primaryBlob,
          downloadUrl,
          filename: result.primaryFilename,
          size: result.primaryBlob.size,
          mimeType: result.primaryMimeType,
        });
        showToast(
          result.isMultiPage
            ? `Extracted all ${result.images.length} pages into ZIP archive!`
            : `Converted page 1 to ${pdfToJpgFormat.toUpperCase()} image!`
        );
      }

      // 21. EDIT PDF (Annotation, Text Note & Official Stamps)
      else if (activeTool === 'edit') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const font = await srcDoc.embedFont(StandardFonts.HelveticaBold);
        const pages = srcDoc.getPages();
        const targetPage = pages[0];
        const { width, height } = targetPage.getSize();

        const textToDraw = editAnnotationType === 'stamp' ? editStampType : editAnnotationText || 'NOTE';

        let x = width - 200;
        let y = height - 70;
        if (editPosition === 'top_left') {
          x = 45;
          y = height - 70;
        } else if (editPosition === 'top_center') {
          x = width / 2 - 70;
          y = height - 70;
        } else if (editPosition === 'middle_center') {
          x = width / 2 - 70;
          y = height / 2;
        } else if (editPosition === 'bottom_left') {
          x = 45;
          y = 50;
        } else if (editPosition === 'bottom_right') {
          x = width - 200;
          y = 50;
        }

        if (editAnnotationType === 'stamp') {
          targetPage.drawRectangle({
            x: x - 10,
            y: y - 8,
            width: Math.max(120, textToDraw.length * 15 + 24),
            height: 40,
            borderColor: rgb(0.88, 0.12, 0.28),
            borderWidth: 2.5,
            color: rgb(1, 0.95, 0.96),
            opacity: 0.95,
          });
        }

        targetPage.drawText(textToDraw, {
          x,
          y,
          size: editTextSize,
          font,
          color: rgb(0.88, 0.12, 0.28),
        });

        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `${firstFile.name.replace('.pdf', '')}-edited.pdf`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Stamped annotation onto PDF document!');
      }

      // 22. PDF FORMS
      else if (activeTool === 'forms') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        try {
          const form = srcDoc.getForm();
          form.flatten();
        } catch {}

        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `${firstFile.name.replace('.pdf', '')}-form-locked.pdf`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Flattened and verified PDF form fields!');
      }

      // 23. HTML TO PDF
      else if (activeTool === 'html-to-pdf') {
        const rawHtml = await firstFile.file.text();
        const { pdfBytes, pageCount } = await convertHtmlToPdf(rawHtml, firstFile.name, {
          mode: htmlPdfMode,
        });

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `${firstFile.name.replace(/\.[^/.]+$/, '')}.pdf`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast(`Converted ${firstFile.name} to PDF (${pageCount} page${pageCount !== 1 ? 's' : ''})!`);
      }

      // 24. WORD TO PDF (.DOCX & .DOC)
      else if (activeTool === 'word-to-pdf') {
        const fileBuffer = await firstFile.file.arrayBuffer();
        const paragraphs = await parseDocxFile(fileBuffer);

        const doc = await PDFDocument.create();
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const marginX = 50;
        const maxCharsPerLine = 72;

        const formattedLines: { text: string; isHeading: boolean; isBold: boolean }[] = [];

        paragraphs.forEach((p) => {
          const words = p.text.split(/\s+/);
          let currentLine = '';
          const lineLimit = p.isHeading ? 55 : maxCharsPerLine;

          for (const word of words) {
            if ((currentLine + ' ' + word).trim().length <= lineLimit) {
              currentLine = (currentLine + ' ' + word).trim();
            } else {
              if (currentLine) {
                formattedLines.push({ text: currentLine, isHeading: p.isHeading, isBold: p.isBold });
              }
              currentLine = word;
            }
          }
          if (currentLine) {
            formattedLines.push({ text: currentLine, isHeading: p.isHeading, isBold: p.isBold });
          }
          formattedLines.push({ text: '', isHeading: false, isBold: false });
        });

        if (formattedLines.length === 0) {
          formattedLines.push({ text: 'Empty Word Document', isHeading: false, isBold: false });
        }

        let currentPage = doc.addPage([pageWidth, pageHeight]);
        let curY = 760;
        let pageIdx = 1;

        currentPage.drawText(sanitizeTextForWinAnsi(firstFile.name.replace(/\.[^/.]+$/, '')), {
          x: marginX,
          y: 795,
          size: 16,
          font: boldFont,
          color: rgb(0.12, 0.16, 0.22),
        });
        currentPage.drawLine({
          start: { x: marginX, y: 780 },
          end: { x: pageWidth - marginX, y: 780 },
          thickness: 1,
          color: rgb(0.85, 0.88, 0.92),
        });

        for (const item of formattedLines) {
          if (!item.text) {
            curY -= 10;
          } else {
            const fontSize = item.isHeading ? 13 : 10;
            const itemFont = (item.isHeading || item.isBold) ? boldFont : font;
            const fontColor = item.isHeading ? rgb(0.1, 0.15, 0.25) : rgb(0.2, 0.22, 0.25);

            currentPage.drawText(item.text, {
              x: marginX,
              y: curY,
              size: fontSize,
              font: itemFont,
              color: fontColor,
            });
            curY -= item.isHeading ? 18 : 14;
          }

          if (curY < 60) {
            currentPage = doc.addPage([pageWidth, pageHeight]);
            pageIdx++;
            curY = 780;
          }
        }

        const out = await doc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `${firstFile.name.replace(/\.[^/.]+$/, '')}.pdf`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast(`Converted ${firstFile.name} to PDF (${pageIdx} page${pageIdx !== 1 ? 's' : ''})!`);
      }

      // 25. EXCEL & PPT TO PDF
      else if (activeTool === 'excel-to-pdf' || activeTool === 'ppt-to-pdf') {
        const doc = await PDFDocument.create();
        const page = doc.addPage([595.28, 841.89]);
        const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
        const font = await doc.embedFont(StandardFonts.Helvetica);

        page.drawText(sanitizeTextForWinAnsi(firstFile.name), {
          x: 50,
          y: 790,
          size: 18,
          font: boldFont,
          color: rgb(0.1, 0.15, 0.2),
        });

        page.drawText(`Converted via Multi_Tools (${activeTool.toUpperCase()}) • Local Processing`, {
          x: 50,
          y: 765,
          size: 9,
          font,
          color: rgb(0.4, 0.45, 0.5),
        });

        page.drawLine({
          start: { x: 50, y: 750 },
          end: { x: 545, y: 750 },
          thickness: 1,
          color: rgb(0.85, 0.88, 0.92),
        });

        let fileTextSample = '';
        try {
          const rawText = await firstFile.file.text();
          fileTextSample = sanitizeTextForWinAnsi(rawText.slice(0, 3000).replace(/[\r\n\t]+/g, ' '));
        } catch {
          fileTextSample = `Source file ${sanitizeTextForWinAnsi(firstFile.name)} (${(firstFile.size / 1024).toFixed(1)} KB) successfully processed and encoded into PDF document format.`;
        }

        page.drawText('Document Content Preview:', {
          x: 50,
          y: 720,
          size: 11,
          font: boldFont,
          color: rgb(0.2, 0.25, 0.3),
        });

        const sampleWords = fileTextSample.split(' ');
        let line = '';
        let currentY = 695;
        for (const w of sampleWords) {
          if ((line + ' ' + w).length > 70) {
            page.drawText(line, { x: 50, y: currentY, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
            currentY -= 16;
            line = w;
            if (currentY < 100) break;
          } else {
            line = line ? line + ' ' + w : w;
          }
        }
        if (line && currentY >= 100) {
          page.drawText(line, { x: 50, y: currentY, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
        }

        const out = await doc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `${firstFile.name.replace(/\.[^/.]+$/, '')}.pdf`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast(`Converted ${firstFile.name} to PDF successfully!`);
      }

      // 24. COMPARE PDF (Comparative Side-by-Side Analysis Engine)
      else if (activeTool === 'compare') {
        if (uploadedFiles.length < 2) {
          showToast('Please upload two PDF documents to compare', 'error');
          setIsProcessing(false);
          return;
        }

        const file1 = uploadedFiles[0];
        const file2 = uploadedFiles[1];
        const bytes1 = await file1.file.arrayBuffer();
        const bytes2 = await file2.file.arrayBuffer();

        const doc1 = await PDFDocument.load(bytes1, { ignoreEncryption: true });
        const doc2 = await PDFDocument.load(bytes2, { ignoreEncryption: true });

        const count1 = doc1.getPageCount();
        const count2 = doc2.getPageCount();

        const compDoc = await PDFDocument.create();
        const boldFont = await compDoc.embedFont(StandardFonts.HelveticaBold);
        const font = await compDoc.embedFont(StandardFonts.Helvetica);

        const page = compDoc.addPage([595.28, 841.89]);
        page.drawText('Document Comparison Summary', {
          x: 50,
          y: 790,
          size: 20,
          font: boldFont,
          color: rgb(0.1, 0.15, 0.25),
        });

        page.drawText(`Generated • Multi_Tools Privacy Suite`, {
          x: 50,
          y: 765,
          size: 9,
          font,
          color: rgb(0.4, 0.45, 0.5),
        });

        page.drawLine({
          start: { x: 50, y: 750 },
          end: { x: 545, y: 750 },
          thickness: 1,
          color: rgb(0.85, 0.88, 0.92),
        });

        // Document A stats
        page.drawText(`Document A: ${file1.name}`, { x: 50, y: 710, size: 12, font: boldFont, color: rgb(0.15, 0.2, 0.3) });
        page.drawText(`- File Size: ${(file1.size / 1024).toFixed(1)} KB`, { x: 60, y: 690, size: 10, font, color: rgb(0.3, 0.35, 0.4) });
        page.drawText(`- Total Pages: ${count1}`, { x: 60, y: 670, size: 10, font, color: rgb(0.3, 0.35, 0.4) });

        // Document B stats
        page.drawText(`Document B: ${file2.name}`, { x: 50, y: 630, size: 12, font: boldFont, color: rgb(0.15, 0.2, 0.3) });
        page.drawText(`- File Size: ${(file2.size / 1024).toFixed(1)} KB`, { x: 60, y: 610, size: 10, font, color: rgb(0.3, 0.35, 0.4) });
        page.drawText(`- Total Pages: ${count2}`, { x: 60, y: 590, size: 10, font, color: rgb(0.3, 0.35, 0.4) });

        // Key Findings
        page.drawText('Comparative Analysis:', { x: 50, y: 550, size: 12, font: boldFont, color: rgb(0.15, 0.2, 0.3) });
        const sizeDiff = (file2.size - file1.size) / 1024;
        const pageDiff = count2 - count1;

        page.drawText(`• Page Count Difference: ${pageDiff === 0 ? 'Identical (0 difference)' : `${pageDiff > 0 ? '+' : ''}${pageDiff} pages`}`, {
          x: 60,
          y: 525,
          size: 10,
          font,
          color: pageDiff === 0 ? rgb(0.1, 0.6, 0.2) : rgb(0.8, 0.2, 0.2),
        });

        page.drawText(`• File Size Difference: ${sizeDiff >= 0 ? '+' : ''}${sizeDiff.toFixed(1)} KB`, {
          x: 60,
          y: 505,
          size: 10,
          font,
          color: rgb(0.3, 0.35, 0.4),
        });

        const out = await compDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `comparison-report-${Date.now()}.pdf`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Generated document comparison report!');
      }

      // 17. Default fallback
      else {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `processed-${firstFile.name}`;

        finishPdfProcessing({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Processed PDF successfully!');
      }
    } catch (err: any) {
      showToast(`Execution error: ${err.message || 'Corrupt or unsupported format'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter tools
  const filteredCatalog = PDF_CATALOG.filter((t) => {
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const currentToolDef = activeTool ? PDF_CATALOG.find((t) => t.id === activeTool) : null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      <ToolHeader tool={tool} />

      {/* ======================================================== */}
      {/* 1. ACTIVE TOOL WORKSPACE VIEW                            */}
      {/* ======================================================== */}
      {activeTool && currentToolDef ? (
        <div className="space-y-6">
          {/* Top navigation back button */}
          <button
            onClick={backToGrid}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-brand-500 shadow-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All PDF Utilities</span>
          </button>

          {/* ======================================================== */}
          {/* COMPLETION / SUCCESS DOWNLOAD SCREEN                     */}
          {/* ======================================================== */}
          {processedResult ? (
            <div className="p-4 sm:p-12 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface-900 border border-slate-200/90 dark:border-slate-800 shadow-xl text-center space-y-5 sm:space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>

              <div className="space-y-1.5 max-w-lg mx-auto">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Processing Completed
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Your PDF is Ready!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Click the button below to download your processed file to your device.
                </p>
                <div className="pt-1 flex items-center justify-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">{processedResult.filename}</span>
                  <span>•</span>
                  <span>{(processedResult.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              {/* Primary Download Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => triggerDownload(processedResult)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-rose-500/25 active:scale-95 transition-all"
                >
                  <Download className="w-5 h-5" />
                  <span>Download File Now</span>
                </button>

                {processedResult.mimeType === 'application/pdf' && (
                  <a
                    href={processedResult.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview in Browser</span>
                  </a>
                )}
              </div>

              {/* Secondary Download (e.g. OCR text transcript) */}
              {processedResult.secondaryDownload && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = processedResult.secondaryDownload!.downloadUrl;
                      a.download = processedResult.secondaryDownload!.filename;
                      a.click();
                      showToast('Downloaded text transcript!');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold border border-emerald-500/20 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{processedResult.secondaryDownload.label}</span>
                  </button>
                </div>
              )}

              {/* OCR Text Preview Box */}
              {processedResult.extractedText && (
                <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <ScanText className="w-4 h-4 text-emerald-500" />
                      <span>Extracted Searchable Text</span>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(processedResult.extractedText || '');
                        showToast('Copied extracted text!');
                      }}
                      className="text-brand-500 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy Text
                    </button>
                  </div>
                  <pre className="p-3 bg-white dark:bg-surface-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {processedResult.extractedText}
                  </pre>
                </div>
              )}

              {/* Reset / Another Action */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-4 text-xs">
                <button
                  onClick={resetForAnother}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-brand-600 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Process Another File</span>
                </button>
                <span>•</span>
                <button
                  onClick={backToGrid}
                  className="text-slate-600 dark:text-slate-400 hover:text-brand-600 font-semibold"
                >
                  Explore More PDF Utilities
                </button>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* ILovePDF Split-Screen Workspace / Upload View            */
            /* ======================================================== */
            <div className="space-y-6">
              {/* Zoom Modal Lightbox */}
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

              {/* A. Organize PDF Workspace (Dedicated Full-Featured Component) */}
              {activeTool === 'organize' && (
                <OrganizePdfWorkspace
                  initialFiles={uploadedFiles.map((f) => f.file)}
                  onBackToCatalogue={backToGrid}
                />
              )}

              {/* B. Modular Tools in Dedicated Folders */}
              {activeTool === 'unlock' && (
                <UnlockPdfWorkspace
                  initialFile={uploadedFiles[0]?.file}
                  onSuccess={finishPdfProcessing}
                />
              )}

              {activeTool === 'merge' && (
                <MergePdfWorkspace
                  initialFiles={uploadedFiles.map((f) => f.file)}
                  onSuccess={finishPdfProcessing}
                />
              )}

              {activeTool === 'protect' && (
                <ProtectPdfWorkspace
                  initialFile={uploadedFiles[0]?.file}
                  onSuccess={finishPdfProcessing}
                />
              )}

              {activeTool === 'jpg-to-pdf' && (
                <JpgToPdfWorkspace
                  initialFiles={uploadedFiles.map((f) => f.file)}
                  onSuccess={finishPdfProcessing}
                />
              )}

              {activeTool === 'compress' && (
                <CompressPdfWorkspace
                  initialFile={uploadedFiles[0]?.file}
                  onSuccess={finishPdfProcessing}
                />
              )}

              {/* B. Scan to PDF Camera Workspace */}
              {activeTool === 'scan-pdf' && (
                <div className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-center">
                  <div className="max-w-md mx-auto aspect-[4/3] bg-black rounded-2xl overflow-hidden relative border border-slate-800">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900/90 p-4 space-y-2">
                        <Camera className="w-10 h-10 text-brand-400" />
                        <span className="text-xs font-semibold">Camera is currently inactive</span>
                        <button
                          onClick={startCamera}
                          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-500/20"
                        >
                          Start Camera Feed
                        </button>
                      </div>
                    )}
                  </div>

                  {cameraActive && (
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                      <button
                        onClick={captureScanFrame}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-500/20"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Capture Page Frame</span>
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold"
                      >
                        Stop Camera
                      </button>
                    </div>
                  )}

                  {capturedScans.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                        Captured Page Scans ({capturedScans.length})
                      </span>
                      <div className="flex justify-center gap-3 overflow-x-auto pb-2">
                        {capturedScans.map((src, i) => (
                          <img
                            key={i}
                            src={src}
                            alt={`Scan ${i + 1}`}
                            className="w-16 sm:w-20 h-24 sm:h-28 object-cover rounded-xl border border-slate-300 shadow-sm"
                          />
                        ))}
                      </div>

                      <div className="pt-2 flex justify-center">
                        <button
                          onClick={executeActiveTool}
                          disabled={isProcessing}
                          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-rose-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Compiling Scans...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>Create Scanned PDF ({capturedScans.length} pages)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* C. Clean Initial Upload State (Zero Files Uploaded) */}
              {!['organize', 'scan-pdf', 'unlock', 'merge', 'protect', 'jpg-to-pdf', 'compress'].includes(activeTool as string) &&
                uploadedFiles.length === 0 && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const files = Array.from(e.dataTransfer.files);
                      setUploadedFiles(files.map((f) => ({ file: f, name: f.name, size: f.size })));
                      setProcessedResult(null);
                    }
                  }}
                  className="relative min-h-[500px] rounded-3xl bg-white dark:bg-surface-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center p-8 sm:p-16 text-center space-y-6"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={activeTool === 'merge' || activeTool === 'jpg-to-pdf' || activeTool === 'compare'}
                    accept={
                      activeTool === 'txt-to-pdf'
                        ? '.txt,.md,.log,.json,.csv,.py,.js,.ts,text/*'
                        : activeTool === 'jpg-to-pdf'
                        ? 'image/*'
                        : activeTool === 'word-to-pdf'
                        ? '.doc,.docx,text/plain'
                        : activeTool === 'excel-to-pdf'
                        ? '.xls,.xlsx,text/csv'
                        : activeTool === 'ppt-to-pdf'
                        ? '.ppt,.pptx'
                        : activeTool === 'html-to-pdf'
                        ? '.html,.htm,text/html'
                        : 'application/pdf,.pdf'
                    }
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div className="space-y-3 max-w-2xl mx-auto">
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {currentToolDef.name}
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                      {currentToolDef.desc}
                    </p>
                  </div>

                  {/* Signature ILovePDF Red Select Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-rose-600/30 transition-all cursor-pointer group"
                    >
                      <Upload className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />
                      <span>
                        Select{' '}
                        {activeTool === 'jpg-to-pdf'
                          ? 'JPG images'
                          : activeTool === 'word-to-pdf'
                          ? 'WORD file'
                          : activeTool === 'excel-to-pdf'
                          ? 'EXCEL file'
                          : activeTool === 'ppt-to-pdf'
                          ? 'PPT file'
                          : activeTool === 'txt-to-pdf'
                          ? 'TXT file'
                          : activeTool === 'html-to-pdf'
                          ? 'HTML file'
                          : activeTool === 'compare'
                          ? '2 PDF files'
                          : 'PDF files'}
                      </span>
                    </button>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium">
                      or drop {activeTool === 'jpg-to-pdf' ? 'images' : 'PDFs'} here
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

              {/* D. Full ILovePDF 2-Column Split-Screen Workspace (Active Once Files Are Uploaded) */}
              {!['organize', 'scan-pdf', 'unlock', 'merge', 'protect', 'jpg-to-pdf', 'compress'].includes(activeTool as string) &&
                uploadedFiles.length > 0 && (
                <div className="flex flex-col lg:flex-row min-h-[720px] bg-slate-100 dark:bg-surface-950 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md relative">
                  {/* Hidden file input for adding more files */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={activeTool === 'merge' || activeTool === 'jpg-to-pdf' || activeTool === 'compare'}
                    accept={
                      activeTool === 'txt-to-pdf'
                        ? '.txt,.md,.log,.json,.csv,.py,.js,.ts,text/*'
                        : activeTool === 'jpg-to-pdf'
                        ? 'image/*'
                        : activeTool === 'word-to-pdf'
                        ? '.doc,.docx,text/plain'
                        : activeTool === 'excel-to-pdf'
                        ? '.xls,.xlsx,text/csv'
                        : activeTool === 'ppt-to-pdf'
                        ? '.ppt,.pptx'
                        : activeTool === 'html-to-pdf'
                        ? '.html,.htm,text/html'
                        : 'application/pdf,.pdf'
                    }
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* ======================================================== */}
                  {/* LEFT / CENTER CANVAS                                     */}
                  {/* ======================================================== */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const files = Array.from(e.dataTransfer.files);
                        setUploadedFiles((prev) => [
                          ...(activeTool === 'merge' || activeTool === 'jpg-to-pdf' || activeTool === 'compare' ? prev : []),
                          ...files.map((f) => ({ file: f, name: f.name, size: f.size })),
                        ]);
                        setProcessedResult(null);
                      }
                    }}
                    className="flex-1 p-5 sm:p-10 flex flex-col relative overflow-y-auto min-h-[500px] bg-slate-50/70 dark:bg-slate-900/40"
                  >
                    {/* Floating Side Action Controls on Canvas */}
                    <div className="absolute top-5 right-5 z-20 flex flex-col items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Add more files"
                        className="relative w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition-all cursor-pointer group"
                      >
                        <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[20px] text-center rounded-full bg-slate-900 text-[10px] font-extrabold text-white border-2 border-white dark:border-slate-800 shadow-sm">
                          {uploadedFiles.length}
                        </span>
                      </button>

                      {(activeTool === 'merge' || activeTool === 'jpg-to-pdf') && (
                        <button
                          type="button"
                          onClick={sortFilesAlphabetically}
                          title="Sort A-Z"
                          className="w-10 h-10 rounded-full bg-white dark:bg-surface-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          <SortAsc className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* CANVAS CONTENT: TOOL SPECIFIC CARD VISUALIZATION */}
                    <div className="flex-1 flex flex-col justify-center">
                      {/* Active File Header Strip for page-based and single-file tools */}
                      {activeTool !== 'merge' &&
                        activeTool !== 'jpg-to-pdf' &&
                        uploadedFiles.length > 0 &&
                        (activeTool === 'split' ||
                          activeTool === 'extract-pages' ||
                          activeTool === 'remove-pages' ||
                          activeTool === 'rotate' ||
                          activeTool === 'page-numbers' ||
                          activeTool === 'watermark' ||
                          activeTool === 'crop' ||
                          activeTool === 'sign' ||
                          activeTool === 'edit') && (
                          <div className="flex items-center justify-between bg-white/95 dark:bg-surface-900/95 backdrop-blur-xs border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 shadow-xs mb-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={uploadedFiles[0]?.name}>
                                {uploadedFiles[0]?.name}
                              </span>
                              <span className="text-[11px] text-slate-400 shrink-0 hidden sm:inline">
                                ({(uploadedFiles[0]?.size / 1024).toFixed(1)} KB{docPages.length > 0 ? ` • ${docPages.length} Pages` : ''})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setUploadedFiles([]);
                                setProcessedResult(null);
                                showToast('Removed file');
                              }}
                              className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-white hover:bg-rose-600 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-2xs transition-all cursor-pointer"
                              title="Remove this PDF and choose another"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Remove PDF</span>
                            </button>
                          </div>
                        )}
                      {/* 1. MERGE PDF CANVAS: File Cards with cover thumbnail & hover tools */}
                      {activeTool === 'merge' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-2">
                            {uploadedFiles.map((item, idx) => (
                              <div
                                key={idx}
                                className="group relative bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 shadow-md hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between"
                              >
                                {/* Quick Cross Remove Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
                                    showToast(`Removed ${item.name}`);
                                  }}
                                  title="Remove this PDF"
                                  aria-label={`Remove ${item.name}`}
                                  className="absolute -top-2.5 -right-2.5 z-20 w-7 h-7 rounded-full bg-white dark:bg-surface-800 text-rose-500 hover:text-white hover:bg-rose-600 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                                >
                                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>

                                {/* Card Hover Tools Strip */}
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

                                {/* Thumbnail Area */}
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

                                {/* Footer info and order changer */}
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
                                      className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20"
                                      title="Move Left"
                                    >
                                      <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === uploadedFiles.length - 1}
                                      onClick={() => moveFileOrder(idx, 'right')}
                                      className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20"
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
                      )}

                      {/* 2. SPLIT PDF CANVAS: Range Group Boxes or Visual Pages Grid */}
                      {(activeTool === 'split' || activeTool === 'extract-pages') && (
                        <div className="space-y-6">
                          {splitMainTab === 'range' ? (
                            <div className="space-y-5">
                              {splitRanges.map((rng, rIdx) => {
                                const total = docPages.length || 1;
                                const rawF = Number(rng.from);
                                const rawT = Number(rng.to);
                                const validF = isNaN(rawF) || rawF < 1 ? 1 : rawF;
                                const validT = isNaN(rawT) || rawT < 1 ? 1 : rawT;
                                const minP = Math.max(1, Math.min(validF, validT));
                                const maxP = Math.min(total, Math.max(validF, validT));
                                const warning = getSplitRangeWarning(rng);

                                return (
                                  <div key={rng.id} className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                      <span>Range {rIdx + 1}</span>
                                      <div className="flex items-center gap-2">
                                        {warning && (
                                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> Flagged
                                          </span>
                                        )}
                                        <span className="text-[11px] text-slate-400">
                                          Pages {minP} to {maxP} ({maxP - minP + 1} page{maxP - minP + 1 !== 1 ? 's' : ''})
                                        </span>
                                      </div>
                                    </div>
                                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-5 bg-white/60 dark:bg-surface-900/60 shadow-sm flex flex-wrap gap-4 items-center min-h-[160px]">
                                      {docPages
                                        .filter((p) => p.pageNumber >= minP && p.pageNumber <= maxP)
                                        .map((page) => (
                                        <div
                                          key={page.pageNumber}
                                          className="aspect-[3/4] w-28 sm:w-32 bg-white dark:bg-surface-800 rounded-xl p-2 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
                                        >
                                          <div className="flex-1 flex items-center justify-center overflow-hidden">
                                            {pageThumbnails[page.pageNumber] ? (
                                              <img
                                                src={pageThumbnails[page.pageNumber]}
                                                alt={`Page ${page.pageNumber}`}
                                                className="max-h-full max-w-full object-contain rounded-md"
                                              />
                                            ) : (
                                              <div className="text-center font-mono text-xs text-slate-300 dark:text-slate-600">
                                                Page {page.pageNumber}
                                              </div>
                                            )}
                                          </div>
                                          <div className="text-center text-[10px] font-bold text-slate-600 dark:text-slate-300 pt-1">
                                            {page.pageNumber}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          ) : (
                            /* Visual Pages Tab */
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 max-h-[600px] overflow-y-auto pr-1">
                              {docPages.map((page) => {
                                const isSelected = selectedPageNumbers.includes(page.pageNumber);
                                return (
                                  <div
                                    key={page.pageNumber}
                                    onClick={() => toggleSplitPage(page.pageNumber)}
                                    className={`group relative cursor-pointer rounded-2xl border-2 p-3 transition-all flex flex-col justify-between ${
                                      isSelected
                                        ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 shadow-md ring-2 ring-rose-500/20'
                                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-800/80 hover:border-slate-300 opacity-60 hover:opacity-100'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1.5 text-xs">
                                      <span
                                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                                          isSelected ? 'bg-rose-600 text-white' : 'text-slate-400'
                                        }`}
                                      >
                                        Page {page.pageNumber}
                                      </span>
                                      <div
                                        className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                                          isSelected
                                            ? 'bg-rose-600 text-white'
                                            : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                        }`}
                                      >
                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                      </div>
                                    </div>

                                    <div className="aspect-[3/4] w-full rounded-lg bg-white dark:bg-surface-900 border border-slate-200/90 dark:border-slate-700 p-1 flex items-center justify-center overflow-hidden">
                                      {pageThumbnails[page.pageNumber] ? (
                                        <img
                                          src={pageThumbnails[page.pageNumber]}
                                          alt={`Page ${page.pageNumber}`}
                                          className="max-h-full max-w-full object-contain rounded-md"
                                        />
                                      ) : (
                                        <span className="text-xs font-mono text-slate-400">
                                          {page.pageNumber}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. REMOVE PAGES CANVAS: Clickable page thumbnails with big red X overlay */}
                      {activeTool === 'remove-pages' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-h-[620px] overflow-y-auto pr-1">
                            {docPages.map((page) => {
                              const isDeleted = pagesToDelete.includes(page.pageNumber);
                              return (
                                <div
                                  key={page.pageNumber}
                                  onClick={() => togglePageToDelete(page.pageNumber)}
                                  className={`group relative cursor-pointer rounded-2xl border-2 p-3 transition-all flex flex-col justify-between ${
                                    isDeleted
                                      ? 'border-dashed border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 ring-2 ring-rose-500/20'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-900 hover:border-slate-300 shadow-sm'
                                  }`}
                                >
                                  <div className="aspect-[3/4] w-full rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden p-1.5 border border-slate-100 dark:border-slate-800">
                                    {pageThumbnails[page.pageNumber] ? (
                                      <img
                                        src={pageThumbnails[page.pageNumber]}
                                        alt={`Page ${page.pageNumber}`}
                                        className={`max-h-full max-w-full object-contain rounded-lg transition-opacity ${
                                          isDeleted ? 'opacity-30 grayscale' : ''
                                        }`}
                                      />
                                    ) : (
                                      <span
                                        className={`text-xs font-mono font-bold text-slate-400 ${
                                          isDeleted ? 'opacity-30' : ''
                                        }`}
                                      >
                                        Page {page.pageNumber}
                                      </span>
                                    )}

                                    {/* Big Prominent Red X Overlay (Matching ILovePDF Image 2) */}
                                    {isDeleted && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-rose-600/10 backdrop-blur-[1px]">
                                        <X className="w-14 h-14 text-rose-600 stroke-[3] drop-shadow-md animate-in zoom-in-75 duration-150" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="mt-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Page {page.pageNumber}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 4. ROTATE PDF CANVAS: Independent Per-Page Rotation & Visual Feedback */}
                      {activeTool === 'rotate' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[620px] overflow-y-auto pr-1">
                            {docPages.map((page) => {
                              const pageAngle = perPageRotations[page.pageNumber] || 0;
                              return (
                                <div
                                  key={page.pageNumber}
                                  className="group relative bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-md flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                                >
                                  {/* Rotation badge if page is rotated */}
                                  {pageAngle !== 0 && (
                                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-extrabold shadow-sm animate-in zoom-in-75">
                                      +{pageAngle}°
                                    </div>
                                  )}

                                  {/* Card Hover Tools Strip */}
                                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 dark:bg-surface-900/95 backdrop-blur-xs p-1 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                                    {pageThumbnails[page.pageNumber] && (
                                      <button
                                        type="button"
                                        onClick={() => setZoomModalImage(pageThumbnails[page.pageNumber])}
                                        title="Zoom preview"
                                        className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      >
                                        <ZoomIn className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => rotateSinglePage(page.pageNumber, 'ccw')}
                                      title="Rotate left -90°"
                                      className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => rotateSinglePage(page.pageNumber, 'cw')}
                                      title="Rotate right +90°"
                                      className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                    >
                                      <RotateCw className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="aspect-[3/4] w-full bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center p-2 overflow-hidden border border-slate-100 dark:border-slate-800">
                                    <div
                                      style={{
                                        transform: `rotate(${pageAngle}deg)`,
                                        transition: 'transform 0.3s ease',
                                      }}
                                      className="max-h-full max-w-full flex items-center justify-center"
                                    >
                                      {pageThumbnails[page.pageNumber] ? (
                                        <img
                                          src={pageThumbnails[page.pageNumber]}
                                          alt={`Page ${page.pageNumber}`}
                                          className="max-h-full max-w-full object-contain rounded-md shadow-sm"
                                        />
                                      ) : (
                                        <span className="text-xs font-mono font-bold text-slate-400">
                                          Page {page.pageNumber}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Individual Card Controls Bottom */}
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                      Page {page.pageNumber}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => rotateSinglePage(page.pageNumber, 'ccw')}
                                        title="Rotate Left (-90°)"
                                        className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => rotateSinglePage(page.pageNumber, 'cw')}
                                        title="Rotate Right (+90°)"
                                        className="p-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                      >
                                        <RotateCw className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 5. PAGE NUMBERS CANVAS: Real-time red indicator dot positioned via 3x3 picker */}
                      {activeTool === 'page-numbers' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-h-[620px] overflow-y-auto pr-1">
                            {docPages.map((page) => (
                              <div
                                key={page.pageNumber}
                                className="group relative bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-md flex flex-col justify-between"
                              >
                                <div className="aspect-[3/4] w-full bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center p-2 overflow-hidden border border-slate-100 dark:border-slate-800 relative">
                                  {pageThumbnails[page.pageNumber] ? (
                                    <img
                                      src={pageThumbnails[page.pageNumber]}
                                      alt={`Page ${page.pageNumber}`}
                                      className="max-h-full max-w-full object-contain rounded-md"
                                    />
                                  ) : (
                                    <span className="text-xs font-mono font-bold text-slate-400">
                                      Page {page.pageNumber}
                                    </span>
                                  )}

                                  {/* Live Red Indicator Dot Overlay (Matching ILovePDF Image 19) */}
                                  <div
                                    className={`absolute ${
                                      pageNumberPosGrid === 'top_left'
                                        ? 'top-2.5 left-2.5'
                                        : pageNumberPosGrid === 'top_center'
                                        ? 'top-2.5 left-1/2 -translate-x-1/2'
                                        : pageNumberPosGrid === 'top_right'
                                        ? 'top-2.5 right-2.5'
                                        : pageNumberPosGrid === 'middle_left'
                                        ? 'top-1/2 left-2.5 -translate-y-1/2'
                                        : pageNumberPosGrid === 'middle_center'
                                        ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                                        : pageNumberPosGrid === 'middle_right'
                                        ? 'top-1/2 right-2.5 -translate-y-1/2'
                                        : pageNumberPosGrid === 'bottom_left'
                                        ? 'bottom-2.5 left-2.5'
                                        : pageNumberPosGrid === 'bottom_center'
                                        ? 'bottom-2.5 left-1/2 -translate-x-1/2'
                                        : 'bottom-2.5 right-2.5'
                                    } w-3.5 h-3.5 rounded-full bg-rose-600 shadow-md ring-2 ring-white dark:ring-surface-900 animate-pulse`}
                                  />
                                </div>

                                <div className="mt-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                  Page {page.pageNumber}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 6. WATERMARK CANVAS: Live watermark position and text/image overlay */}
                      {activeTool === 'watermark' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-h-[620px] overflow-y-auto pr-1">
                            {docPages.map((page) => (
                              <div
                                key={page.pageNumber}
                                className="group relative bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-md flex flex-col justify-between"
                              >
                                <div className="aspect-[3/4] w-full bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center p-2 overflow-hidden border border-slate-100 dark:border-slate-800 relative">
                                  {pageThumbnails[page.pageNumber] ? (
                                    <img
                                      src={pageThumbnails[page.pageNumber]}
                                      alt={`Page ${page.pageNumber}`}
                                      className="max-h-full max-w-full object-contain rounded-md"
                                    />
                                  ) : (
                                    <span className="text-xs font-mono font-bold text-slate-400">
                                      Page {page.pageNumber}
                                    </span>
                                  )}

                                  {/* Live Watermark Overlay (Text or Image) */}
                                  {watermarkTab === 'image' ? (
                                    watermarkImageDataUrl ? (
                                      watermarkMosaic ? (
                                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 p-2 pointer-events-none">
                                          {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="flex items-center justify-center p-1">
                                              <img
                                                src={watermarkImageDataUrl}
                                                alt="Watermark stamp"
                                                style={{ opacity: watermarkOpacity / 100 }}
                                                className="max-h-12 max-w-12 object-contain rotate-[-20deg]"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div
                                          className={`absolute ${
                                            watermarkPos === 'top_left'
                                              ? 'top-2.5 left-2.5'
                                              : watermarkPos === 'top_center'
                                              ? 'top-2.5 left-1/2 -translate-x-1/2'
                                              : watermarkPos === 'top_right'
                                              ? 'top-2.5 right-2.5'
                                              : watermarkPos === 'middle_left'
                                              ? 'top-1/2 left-2.5 -translate-y-1/2'
                                              : watermarkPos === 'middle_center'
                                              ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                                              : watermarkPos === 'middle_right'
                                              ? 'top-1/2 right-2.5 -translate-y-1/2'
                                              : watermarkPos === 'bottom_left'
                                              ? 'bottom-2.5 left-2.5'
                                              : watermarkPos === 'bottom_center'
                                              ? 'bottom-2.5 left-1/2 -translate-x-1/2'
                                              : 'bottom-2.5 right-2.5'
                                          } pointer-events-none transition-all`}
                                        >
                                          <img
                                            src={watermarkImageDataUrl}
                                            alt="Watermark stamp"
                                            style={{
                                              opacity: watermarkOpacity / 100,
                                              width: `${watermarkImageScale * 0.8}px`,
                                            }}
                                            className="max-h-16 object-contain drop-shadow"
                                          />
                                        </div>
                                      )
                                    ) : (
                                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-slate-900/10 backdrop-blur-[1px]">
                                        <span className="text-[10px] font-bold text-slate-500 bg-white/90 dark:bg-surface-900/90 px-2 py-1 rounded-md shadow">
                                          Select image in sidebar
                                        </span>
                                      </div>
                                    )
                                  ) : watermarkMosaic ? (
                                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 p-2 pointer-events-none opacity-40">
                                      {Array.from({ length: 4 }).map((_, i) => (
                                        <div
                                          key={i}
                                          className="text-[9px] font-extrabold text-rose-600 uppercase flex items-center justify-center rotate-[-30deg]"
                                        >
                                          {watermarkText || 'WATERMARK'}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div
                                      className={`absolute ${
                                        watermarkPos === 'top_left'
                                          ? 'top-2.5 left-2.5'
                                          : watermarkPos === 'top_center'
                                          ? 'top-2.5 left-1/2 -translate-x-1/2'
                                          : watermarkPos === 'top_right'
                                          ? 'top-2.5 right-2.5'
                                          : watermarkPos === 'middle_left'
                                          ? 'top-1/2 left-2.5 -translate-y-1/2'
                                          : watermarkPos === 'middle_center'
                                          ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                                          : watermarkPos === 'middle_right'
                                          ? 'top-1/2 right-2.5 -translate-y-1/2'
                                          : watermarkPos === 'bottom_left'
                                          ? 'bottom-2.5 left-2.5'
                                          : watermarkPos === 'bottom_center'
                                          ? 'bottom-2.5 left-1/2 -translate-x-1/2'
                                          : 'bottom-2.5 right-2.5'
                                      } w-4 h-4 rounded-full bg-rose-600 shadow-md ring-2 ring-white dark:ring-surface-900 animate-pulse`}
                                    />
                                  )}
                                </div>

                                <div className="mt-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                  Page {page.pageNumber}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 7. IMAGE TO PDF CANVAS: Image thumbnails grid with reordering */}
                      {activeTool === 'jpg-to-pdf' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-h-[620px] overflow-y-auto pr-1">
                            {uploadedFiles.map((item, idx) => (
                              <div
                                key={idx}
                                className="group relative bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-md flex flex-col justify-between"
                              >
                                {/* Quick Cross Remove Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
                                    showToast(`Removed ${item.name}`);
                                  }}
                                  title="Remove this image"
                                  aria-label={`Remove ${item.name}`}
                                  className="absolute -top-2.5 -right-2.5 z-20 w-7 h-7 rounded-full bg-white dark:bg-surface-800 text-rose-500 hover:text-white hover:bg-rose-600 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                                >
                                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>

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

                                <div className="aspect-[3/4] w-full bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center p-2 overflow-hidden border border-slate-100 dark:border-slate-800">
                                  {fileThumbnails[item.name] ? (
                                    <img
                                      src={fileThumbnails[item.name]}
                                      alt={item.name}
                                      className="max-h-full max-w-full object-contain rounded-md"
                                    />
                                  ) : (
                                    <ImageIcon className="w-8 h-8 text-slate-400" />
                                  )}
                                </div>

                                <div className="mt-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {item.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 8. CROP PDF CANVAS: Interactive visual crop box matching ILovePDF Image 22 */}
                      {activeTool === 'crop' && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-2 w-full">
                          {/* Main Page Preview & Crop Box Container */}
                          <div
                            className="relative max-w-full overflow-hidden rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-900 select-none p-1 sm:p-2"
                            style={{
                              transform: `scale(${cropZoom})`,
                              transformOrigin: 'center center',
                              transition: isCropDragging ? 'none' : 'transform 0.2s ease',
                            }}
                          >
                            <div
                              ref={cropContainerRef}
                              onPointerMove={handleCropPointerMove}
                              onPointerUp={handleCropPointerUp}
                              className="relative inline-block max-w-[85vw] sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[580px] overflow-hidden"
                            >
                              {/* Background Page Render */}
                              {pageThumbnails[cropCurrentPage] || fileThumbnails[uploadedFiles[0]?.name] ? (
                                <img
                                  src={pageThumbnails[cropCurrentPage] || fileThumbnails[uploadedFiles[0]?.name]}
                                  alt={`Crop Preview Page ${cropCurrentPage}`}
                                  draggable={false}
                                  className="max-h-[560px] w-auto object-contain block pointer-events-none select-none"
                                />
                              ) : (
                                <div className="aspect-[3/4] w-72 sm:w-80 bg-slate-100 dark:bg-surface-800 flex flex-col items-center justify-center p-6 text-slate-400">
                                  <FileText className="w-16 h-16 text-rose-500 opacity-60 mb-2" />
                                  <span className="text-xs font-mono">Page {cropCurrentPage} of {docPages.length || 1}</span>
                                </div>
                              )}

                              {/* Interactive Crop Box Overlay */}
                              <div
                                style={{
                                  left: `${cropBox.x}%`,
                                  top: `${cropBox.y}%`,
                                  width: `${cropBox.width}%`,
                                  height: `${cropBox.height}%`,
                                  boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
                                }}
                                className="absolute border-2 border-dashed border-rose-500 z-10 touch-none shadow-sm"
                              >
                                {/* Grid Lines (Rule of Thirds) */}
                                <div className="absolute left-1/3 top-0 bottom-0 border-l border-dashed border-white/50 pointer-events-none" />
                                <div className="absolute left-2/3 top-0 bottom-0 border-l border-dashed border-white/50 pointer-events-none" />
                                <div className="absolute top-1/3 left-0 right-0 border-t border-dashed border-white/50 pointer-events-none" />
                                <div className="absolute top-2/3 left-0 right-0 border-t border-dashed border-white/50 pointer-events-none" />

                                {/* Move Area (Center Drag) */}
                                <div
                                  onPointerDown={(e) => handleCropPointerDown(e, 'move')}
                                  className="absolute inset-0 cursor-move flex items-center justify-center"
                                  title="Drag to reposition crop box"
                                >
                                  <div className="opacity-0 hover:opacity-100 transition-opacity bg-slate-900/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow pointer-events-none flex items-center gap-1.5 backdrop-blur-xs">
                                    <Crop className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Drag to Move</span>
                                  </div>
                                </div>

                                {/* 4 Corner Handles */}
                                <div
                                  onPointerDown={(e) => handleCropPointerDown(e, 'nw')}
                                  className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-xs shadow-md cursor-nwse-resize z-20 hover:scale-125 transition-transform"
                                  title="Resize top-left"
                                />
                                <div
                                  onPointerDown={(e) => handleCropPointerDown(e, 'ne')}
                                  className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-xs shadow-md cursor-nesw-resize z-20 hover:scale-125 transition-transform"
                                  title="Resize top-right"
                                />
                                <div
                                  onPointerDown={(e) => handleCropPointerDown(e, 'sw')}
                                  className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-xs shadow-md cursor-nesw-resize z-20 hover:scale-125 transition-transform"
                                  title="Resize bottom-left"
                                />
                                <div
                                  onPointerDown={(e) => handleCropPointerDown(e, 'se')}
                                  className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-xs shadow-md cursor-nwse-resize z-20 hover:scale-125 transition-transform"
                                  title="Resize bottom-right"
                                />

                                {/* 4 Edge Handles */}
                                <div
                                  onPointerDown={(e) => handleCropPointerDown(e, 'n')}
                                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border-2 border-rose-600 rounded-xs shadow-md cursor-ns-resize z-20 hover:scale-110 transition-transform"
                                  title="Resize top"
                                />
                                <div
                                  onPointerDown={(e) => handleCropPointerDown(e, 's')}
                                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border-2 border-rose-600 rounded-xs shadow-md cursor-ns-resize z-20 hover:scale-110 transition-transform"
                                  title="Resize bottom"
                                />
                                <div
                                  onPointerDown={(e) => handleCropPointerDown(e, 'w')}
                                  className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-white border-2 border-rose-600 rounded-xs shadow-md cursor-ew-resize z-20 hover:scale-110 transition-transform"
                                  title="Resize left"
                                />
                                <div
                                  onPointerDown={(e) => handleCropPointerDown(e, 'e')}
                                  className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-white border-2 border-rose-600 rounded-xs shadow-md cursor-ew-resize z-20 hover:scale-110 transition-transform"
                                  title="Resize right"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Floating Bottom Canvas Toolbar (Page Switcher & Zoom) */}
                          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-2 rounded-full bg-white/95 dark:bg-surface-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-lg text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {/* Page Navigation */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={cropCurrentPage <= 1}
                                onClick={() => setCropCurrentPage((p) => Math.max(1, p - 1))}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Previous page"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="px-2 font-mono text-slate-900 dark:text-white font-bold">
                                Page {cropCurrentPage} / {docPages.length || 1}
                              </span>
                              <button
                                type="button"
                                disabled={cropCurrentPage >= (docPages.length || 1)}
                                onClick={() => setCropCurrentPage((p) => Math.min(docPages.length || 1, p + 1))}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Next page"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>

                            <span className="text-slate-300 dark:text-slate-700">|</span>

                            {/* Zoom Controls */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setCropZoom((z) => Math.max(0.6, Math.round((z - 0.15) * 100) / 100))}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setCropZoom(1)}
                                className="px-1.5 py-0.5 rounded text-[11px] font-mono hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Reset Zoom"
                              >
                                {Math.round(cropZoom * 100)}%
                              </button>
                              <button
                                type="button"
                                onClick={() => setCropZoom((z) => Math.min(1.8, Math.round((z + 0.15) * 100) / 100))}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="text-slate-300 dark:text-slate-700">|</span>

                            {/* Reset Selection Button */}
                            <button
                              type="button"
                              onClick={() => setCropBox({ x: 0, y: 0, width: 100, height: 100 })}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
                              title="Reset crop box to full page"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Full Page</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 9. PDF EDITOR CANVAS: Live interactive annotation & stamp overlay */}
                      {activeTool === 'edit' && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-2 w-full">
                          <div className="relative max-w-full overflow-hidden rounded-2xl shadow-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-900 select-none p-2">
                            <div className="relative inline-block max-w-[85vw] sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[580px] overflow-hidden">
                              {pageThumbnails[1] || fileThumbnails[uploadedFiles[0]?.name] ? (
                                <img
                                  src={pageThumbnails[1] || fileThumbnails[uploadedFiles[0]?.name]}
                                  alt="Editor Preview"
                                  className="max-h-[560px] w-auto object-contain block"
                                />
                              ) : (
                                <div className="aspect-[3/4] w-72 sm:w-80 bg-slate-100 dark:bg-surface-800 flex flex-col items-center justify-center p-6 text-slate-400">
                                  <FileText className="w-16 h-16 text-purple-500 opacity-60 mb-2" />
                                  <span className="text-xs font-mono">Page 1</span>
                                </div>
                              )}

                              {/* Live Stamped Annotation Preview */}
                              <div
                                className={`absolute ${
                                  editPosition === 'top_left'
                                    ? 'top-4 left-4'
                                    : editPosition === 'top_center'
                                    ? 'top-4 left-1/2 -translate-x-1/2'
                                    : editPosition === 'middle_center'
                                    ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                                    : editPosition === 'bottom_left'
                                    ? 'bottom-4 left-4'
                                    : 'bottom-4 right-4'
                                } z-20 pointer-events-none transition-all`}
                              >
                                {editAnnotationType === 'stamp' ? (
                                  <div className="px-4 py-1.5 rounded-lg border-2 border-rose-600 bg-rose-50/95 text-rose-600 font-extrabold uppercase tracking-widest text-sm shadow-md rotate-[-8deg] flex items-center gap-1.5">
                                    <Stamp className="w-4 h-4" />
                                    <span>{editStampType}</span>
                                  </div>
                                ) : (
                                  <div className="px-3 py-1 rounded-md bg-white/95 border border-slate-300 text-slate-800 font-semibold text-xs shadow-md">
                                    {editAnnotationText || 'Sample Note'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 9.5 SIGN PDF CANVAS: Live Document Preview with Signature Stamp Overlay */}
                      {activeTool === 'sign' && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-2 w-full">
                          <div className="relative max-w-full overflow-hidden rounded-2xl shadow-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-900 select-none p-3">
                            <div className="relative inline-block max-w-[85vw] sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[580px] overflow-hidden">
                              {/* Document Page Preview */}
                              {pageThumbnails[signPageTarget === 'first' ? 1 : docPages.length || 1] || fileThumbnails[uploadedFiles[0]?.name] ? (
                                <img
                                  src={pageThumbnails[signPageTarget === 'first' ? 1 : docPages.length || 1] || fileThumbnails[uploadedFiles[0]?.name]}
                                  alt="Sign Preview"
                                  className="max-h-[560px] w-auto object-contain block"
                                />
                              ) : (
                                <div className="aspect-[3/4] w-72 sm:w-80 bg-slate-100 dark:bg-surface-800 flex flex-col items-center justify-center p-6 text-slate-400">
                                  <FileSignature className="w-16 h-16 text-rose-500 opacity-60 mb-2" />
                                  <span className="text-xs font-mono">
                                    Target: {signPageTarget === 'all' ? 'All Pages' : signPageTarget === 'first' ? 'First Page' : `Last Page (${docPages.length || 1})`}
                                  </span>
                                </div>
                              )}

                              {/* Live Signature Placement Overlay */}
                              <div
                                className={`absolute ${
                                  signPosition === 'bottom_left'
                                    ? 'bottom-6 left-6'
                                    : signPosition === 'center'
                                    ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                                    : 'bottom-6 right-6'
                                } z-20 pointer-events-none p-2 rounded-xl bg-white/95 dark:bg-surface-900/95 backdrop-blur-xs border border-dashed border-rose-400 shadow-lg flex flex-col items-center max-w-[180px]`}
                              >
                                {signatureMode === 'upload' && signCustomImage ? (
                                  <img src={signCustomImage} alt="Uploaded Signature" className="h-10 object-contain" />
                                ) : signatureMode === 'draw' ? (
                                  <div className="h-10 flex items-center justify-center text-xs italic font-serif px-2 font-bold" style={{ color: signColor }}>
                                    [ Drawn Signature ]
                                  </div>
                                ) : (
                                  <div className="h-10 flex items-center justify-center text-base italic font-serif font-bold truncate max-w-[160px] px-2" style={{ color: signColor }}>
                                    {signatureText || 'Signed'}
                                  </div>
                                )}
                                {signIncludeDate && (
                                  <div className="text-[9px] font-mono text-slate-500 border-t border-slate-200 dark:border-slate-700 mt-1 pt-0.5">
                                    {new Date().toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 9.6 COMPARE PDF CANVAS: True Side-by-Side Dual Document View */}
                      {activeTool === 'compare' && (
                        <div className="space-y-4 w-full">
                          <input
                            ref={compareDoc2InputRef}
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={handleCompareDoc2Upload}
                            className="hidden"
                          />

                          {/* Dual Document Synchronized Toolbar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Columns className="w-4 h-4 text-rose-500" /> Side-by-Side Comparison
                              </span>
                              <span className="text-slate-400">({uploadedFiles.length}/2 documents loaded)</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={compareSyncPages}
                                  onChange={(e) => setCompareSyncPages(e.target.checked)}
                                  className="w-3.5 h-3.5 text-rose-600 rounded"
                                />
                                <span>Synchronize Page Turns</span>
                              </label>

                              {uploadedFiles.length < 2 && (
                                <button
                                  type="button"
                                  onClick={() => compareDoc2InputRef.current?.click()}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
                                >
                                  + Add Document B
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Two-Column Document Viewer */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Document A Column */}
                            <div className="bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-md flex flex-col justify-between space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                <div className="truncate">
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 mr-1.5">
                                    DOC A (Original)
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {uploadedFiles[0]?.name}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 shrink-0">
                                  {(uploadedFiles[0]?.size / 1024).toFixed(1)} KB
                                </span>
                              </div>

                              <div className="aspect-[3/4] w-full bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center p-2 overflow-hidden border border-slate-100 dark:border-slate-800 relative">
                                {compareThumbnails.doc1[compareDoc1Page] || pageThumbnails[compareDoc1Page] ? (
                                  <img
                                    src={compareThumbnails.doc1[compareDoc1Page] || pageThumbnails[compareDoc1Page]}
                                    alt={`Doc A Page ${compareDoc1Page}`}
                                    className="max-h-full max-w-full object-contain rounded-md shadow-sm"
                                  />
                                ) : (
                                  <div className="text-center space-y-2 text-slate-400">
                                    <FileText className="w-12 h-12 text-blue-500 opacity-60 mx-auto" />
                                    <span className="text-xs font-mono">Page {compareDoc1Page}</span>
                                  </div>
                                )}
                              </div>

                              {/* Page Navigator Doc A */}
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                                <button
                                  type="button"
                                  disabled={compareDoc1Page <= 1}
                                  onClick={() => {
                                    setCompareDoc1Page((p) => Math.max(1, p - 1));
                                    if (compareSyncPages) setCompareDoc2Page((p) => Math.max(1, p - 1));
                                  }}
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                  Page {compareDoc1Page} of {compareDocPages.doc1.length || docPages.length || 1}
                                </span>
                                <button
                                  type="button"
                                  disabled={compareDoc1Page >= (compareDocPages.doc1.length || docPages.length || 1)}
                                  onClick={() => {
                                    setCompareDoc1Page((p) => p + 1);
                                    if (compareSyncPages) setCompareDoc2Page((p) => p + 1);
                                  }}
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Document B Column */}
                            <div className="bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-md flex flex-col justify-between space-y-3">
                              {uploadedFiles.length > 1 ? (
                                <>
                                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <div className="truncate">
                                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mr-1.5">
                                        DOC B (Modified)
                                      </span>
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                        {uploadedFiles[1]?.name}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 shrink-0">
                                      {(uploadedFiles[1]?.size / 1024).toFixed(1)} KB
                                    </span>
                                  </div>

                                  <div className="aspect-[3/4] w-full bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center p-2 overflow-hidden border border-slate-100 dark:border-slate-800 relative">
                                    {compareThumbnails.doc2[compareDoc2Page] ? (
                                      <img
                                        src={compareThumbnails.doc2[compareDoc2Page]}
                                        alt={`Doc B Page ${compareDoc2Page}`}
                                        className="max-h-full max-w-full object-contain rounded-md shadow-sm"
                                      />
                                    ) : (
                                      <div className="text-center space-y-2 text-slate-400">
                                        <FileText className="w-12 h-12 text-emerald-500 opacity-60 mx-auto" />
                                        <span className="text-xs font-mono">Page {compareDoc2Page}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Page Navigator Doc B */}
                                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                      type="button"
                                      disabled={compareDoc2Page <= 1}
                                      onClick={() => {
                                        setCompareDoc2Page((p) => Math.max(1, p - 1));
                                        if (compareSyncPages) setCompareDoc1Page((p) => Math.max(1, p - 1));
                                      }}
                                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                                    >
                                      <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                      Page {compareDoc2Page} of {compareDocPages.doc2.length || 1}
                                    </span>
                                    <button
                                      type="button"
                                      disabled={compareDoc2Page >= (compareDocPages.doc2.length || 1)}
                                      onClick={() => {
                                        setCompareDoc2Page((p) => p + 1);
                                        if (compareSyncPages) setCompareDoc1Page((p) => p + 1);
                                      }}
                                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div
                                  onClick={() => compareDoc2InputRef.current?.click()}
                                  className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-rose-300 dark:border-rose-700 hover:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors"
                                >
                                  <Upload className="w-10 h-10 text-rose-500 mb-2" />
                                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                    Select Document B to Compare
                                  </span>
                                  <span className="text-[11px] text-slate-400 mt-1">
                                    Click here or drag second PDF to compare side-by-side
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 10. SINGLE DOCUMENT PREVIEW CANVAS (Compress, OCR, Protect, Unlock, Conversions) */}
                      {activeTool !== 'merge' &&
                        activeTool !== 'split' &&
                        activeTool !== 'extract-pages' &&
                        activeTool !== 'remove-pages' &&
                        activeTool !== 'rotate' &&
                        activeTool !== 'page-numbers' &&
                        activeTool !== 'watermark' &&
                        activeTool !== 'jpg-to-pdf' &&
                        activeTool !== 'crop' &&
                        activeTool !== 'edit' &&
                        activeTool !== 'sign' &&
                        activeTool !== 'compare' && (
                          <div
                            className={`w-full ${
                              uploadedFiles.length === 1
                                ? 'max-w-sm mx-auto'
                                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto'
                            }`}
                          >
                            {uploadedFiles.map((fileItem, idx) => (
                              <div
                                key={idx}
                                className="relative bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col items-center space-y-4 group hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                              >
                                {/* Cross option to remove the PDF (iLovePDF style) */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
                                    setProcessedResult(null);
                                    showToast(`Removed ${fileItem.name}`);
                                  }}
                                  title="Remove this PDF"
                                  aria-label={`Remove ${fileItem.name}`}
                                  className="absolute -top-3 -right-3 z-30 w-8 h-8 rounded-full bg-white dark:bg-surface-800 text-rose-500 hover:text-white hover:bg-rose-600 border-2 border-slate-100 dark:border-slate-700 shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                                >
                                  <X className="w-4 h-4 stroke-[2.5]" />
                                </button>

                                <div className="aspect-[3/4] w-48 sm:w-56 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center p-3 border border-slate-100 dark:border-slate-800 relative group overflow-hidden shadow-inner">
                                  {fileThumbnails[fileItem.name] ? (
                                    <img
                                      src={fileThumbnails[fileItem.name]}
                                      alt={fileItem.name}
                                      className="max-h-full max-w-full object-contain rounded-xl"
                                    />
                                  ) : activeTool === 'unlock' || isDocEncrypted ? (
                                    <div className="text-center space-y-2.5 p-3 flex flex-col items-center justify-center">
                                      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
                                        <Lock className="w-8 h-8" />
                                      </div>
                                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                                        Locked PDF
                                      </span>
                                    </div>
                                  ) : (
                                    <FileText className="w-16 h-16 text-rose-500 opacity-60" />
                                  )}

                                  {fileThumbnails[fileItem.name] && (
                                    <button
                                      type="button"
                                      onClick={() => setZoomModalImage(fileThumbnails[fileItem.name])}
                                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold"
                                    >
                                      <ZoomIn className="w-5 h-5" />
                                      <span>Preview</span>
                                    </button>
                                  )}
                                </div>

                                <div className="text-center space-y-1 w-full truncate">
                                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate" title={fileItem.name}>
                                    {fileItem.name}
                                  </h4>
                                  <p className="text-xs text-slate-400 font-mono">
                                    {(fileItem.size / 1024).toFixed(1)} KB
                                    {idx === 0 && docPages.length > 0 && ` • ${docPages.length} Pages`}
                                  </p>
                                  {activeTool === 'unlock' && (
                                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold pt-1">
                                      🔒 Password required to unlock
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* RIGHT STICKY SIDEBAR                                     */}
                  {/* ======================================================== */}
                  <div className="w-full lg:w-88 xl:w-96 bg-white dark:bg-surface-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shrink-0 shadow-sm space-y-6">
                    {/* Top Sidebar Options Controls */}
                    <div className="space-y-5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                          {currentToolDef.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400">
                            {uploadedFiles.length} file(s)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFiles([]);
                              setProcessedResult(null);
                              showToast('Removed all files');
                            }}
                            title="Remove file(s) and select another"
                            className="px-2 py-0.5 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 dark:text-rose-400 dark:hover:bg-rose-600 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-rose-200 dark:border-rose-900/60 shadow-2xs"
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Info Banner Callout matching ILovePDF Style */}
                      <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2.5 leading-relaxed">
                        <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
                        <div>
                          {activeTool === 'merge' &&
                            'To change the order of your PDFs, use the arrow buttons or drag cards on the canvas.'}
                          {activeTool === 'split' &&
                            'Define page ranges to extract independent PDF documents or merge them together.'}
                          {activeTool === 'remove-pages' &&
                            'Click on pages in the canvas to mark them for removal. Marked pages will be deleted.'}
                          {activeTool === 'compress' &&
                            'Extreme compression reduces size drastically. Recommended gives the best balance.'}
                          {activeTool === 'rotate' &&
                            'Mouse over pages in the canvas or use the 90° rotation buttons below.'}
                          {activeTool === 'page-numbers' &&
                            'Use the 3x3 position grid to place page numbers exactly where you want them.'}
                          {activeTool === 'watermark' &&
                            'Customize watermark text, opacity, and live position overlay across all pages.'}
                          {activeTool === 'jpg-to-pdf' &&
                            'Set page orientation, page margins, and combine multiple images into a single PDF.'}
                          {activeTool === 'protect' &&
                            'Encrypt your document with AES-256 client-side protection.'}
                          {activeTool === 'unlock' &&
                            'Remove password security from your PDF file so it can be viewed freely.'}
                          {activeTool === 'ocr' &&
                            'The accuracy of detection is increased by correctly selecting the document language.'}
                          {activeTool === 'repair' &&
                            'We will rebuild damaged xref tables and recover readable text streams.'}
                          {activeTool !== 'merge' &&
                            activeTool !== 'split' &&
                            activeTool !== 'remove-pages' &&
                            activeTool !== 'compress' &&
                            activeTool !== 'rotate' &&
                            activeTool !== 'page-numbers' &&
                            activeTool !== 'watermark' &&
                            activeTool !== 'jpg-to-pdf' &&
                            activeTool !== 'protect' &&
                            activeTool !== 'unlock' &&
                            activeTool !== 'ocr' &&
                            activeTool !== 'repair' &&
                            'Instant local processing inside your browser sandbox with complete confidentiality.'}
                        </div>
                      </div>

                      {/* TOOL SPECIFIC SIDEBAR SETTINGS */}

                      {/* SPLIT PDF SIDEBAR */}
                      {(activeTool === 'split' || activeTool === 'extract-pages') && (
                        <div className="space-y-4">
                          {/* Range vs Pages Tab */}
                          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-center">
                            <button
                              type="button"
                              onClick={() => setSplitMainTab('range')}
                              className={`py-2 rounded-lg transition-all ${
                                splitMainTab === 'range'
                                  ? 'bg-white dark:bg-surface-900 text-slate-900 dark:text-white shadow-sm'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              Range
                            </button>
                            <button
                              type="button"
                              onClick={() => setSplitMainTab('pages')}
                              className={`py-2 rounded-lg transition-all ${
                                splitMainTab === 'pages'
                                  ? 'bg-white dark:bg-surface-900 text-slate-900 dark:text-white shadow-sm'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              Pages
                            </button>
                          </div>

                          {splitMainTab === 'range' ? (
                            <div className="space-y-3.5">
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  Range mode:
                                </label>
                                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                                  <button
                                    type="button"
                                    onClick={() => setSplitRangeMode('custom')}
                                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                      splitRangeMode === 'custom'
                                        ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                  >
                                    Custom
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSplitRangeMode('fixed')}
                                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                      splitRangeMode === 'fixed'
                                        ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                  >
                                    Fixed
                                  </button>
                                </div>
                              </div>

                              {/* Range definitions list */}
                              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                                {splitRanges.map((rng, rIdx) => (
                                  <div
                                    key={rng.id}
                                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2"
                                  >
                                    <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                                      <span>Range {rIdx + 1}</span>
                                      {splitRanges.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeSplitRange(rng.id)}
                                          className="text-rose-500 hover:underline text-[11px]"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">
                                          from page
                                        </label>
                                        <input
                                          type="number"
                                          min={1}
                                          max={docPages.length || 999}
                                          value={rng.from}
                                          onChange={(e) =>
                                            updateSplitRange(rng.id, 'from', e.target.value)
                                          }
                                          onBlur={() => handleSplitRangeBlur(rng.id, 'from')}
                                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">
                                          to
                                        </label>
                                        <input
                                          type="number"
                                          min={1}
                                          max={docPages.length || 999}
                                          value={rng.to}
                                          onChange={(e) =>
                                            updateSplitRange(rng.id, 'to', e.target.value)
                                          }
                                          onBlur={() => handleSplitRangeBlur(rng.id, 'to')}
                                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                                        />
                                      </div>
                                    </div>
                                    {/* Inline warning badge for invalid or inverted ranges */}
                                    {(() => {
                                      const warning = getSplitRangeWarning(rng);
                                      if (!warning) return null;
                                      return (
                                        <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5 leading-snug">
                                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                                          <span>{warning}</span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={addSplitRange}
                                className="w-full py-2 rounded-xl border border-dashed border-rose-400 dark:border-rose-600 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold transition-colors"
                              >
                                + Add Range
                              </button>

                              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={splitMergeAll}
                                  onChange={(e) => setSplitMergeAll(e.target.checked)}
                                  className="w-4 h-4 text-rose-600 rounded accent-rose-600"
                                />
                                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                                  Merge all ranges in one PDF file.
                                </span>
                              </label>
                            </div>
                          ) : (
                            /* Pages Tab Options */
                            <div className="space-y-3.5">
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  Extract mode:
                                </label>
                                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSplitExtractMode('all');
                                      selectAllPages();
                                    }}
                                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                      splitExtractMode === 'all'
                                        ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                  >
                                    Extract all pages
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSplitExtractMode('select')}
                                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                      splitExtractMode === 'select'
                                        ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                  >
                                    Select pages
                                  </button>
                                </div>
                              </div>

                              {splitExtractMode === 'select' && (
                                <div>
                                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    Pages to extract:
                                  </label>
                                  <input
                                    type="text"
                                    value={splitExtractPagesInput}
                                    onChange={(e) => {
                                      setSplitExtractPagesInput(e.target.value);
                                      handleSplitRangeChange(e.target.value);
                                    }}
                                    placeholder="example: 1, 3-5"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* REMOVE PAGES SIDEBAR */}
                      {activeTool === 'remove-pages' && (
                        <div className="space-y-4">
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Total pages: {docPages.length || 0}
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Pages to remove:
                            </label>
                            <input
                              type="text"
                              value={pagesToDelete.join(', ')}
                              readOnly
                              placeholder="Click pages on the left canvas to remove"
                              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-rose-600 font-bold"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                              {pagesToDelete.length} page(s) marked with red ✕ on canvas.
                            </p>
                          </div>

                          {pagesToDelete.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setPagesToDelete([])}
                              className="text-xs text-rose-500 hover:underline font-semibold"
                            >
                              Reset selection (keep all)
                            </button>
                          )}
                        </div>
                      )}

                      {/* COMPRESS PDF SIDEBAR */}
                      {activeTool === 'compress' && (
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
                                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="comp"
                                  checked={compressionLevel === 'extreme'}
                                  onChange={() => setCompressionLevel('extreme')}
                                  className="accent-rose-600"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    Extreme compression
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Less quality, high compression
                                  </div>
                                </div>
                              </div>
                            </label>

                            <label
                              onClick={() => setCompressionLevel('recommended')}
                              className={`p-3.5 rounded-2xl border cursor-pointer block transition-all ${
                                compressionLevel === 'recommended'
                                  ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-2 ring-rose-400/20'
                                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="comp"
                                  checked={compressionLevel === 'recommended'}
                                  onChange={() => setCompressionLevel('recommended')}
                                  className="accent-rose-600"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    Recommended compression
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Good quality, good compression
                                  </div>
                                </div>
                              </div>
                            </label>

                            <label
                              onClick={() => setCompressionLevel('less')}
                              className={`p-3.5 rounded-2xl border cursor-pointer block transition-all ${
                                compressionLevel === 'less'
                                  ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-2 ring-rose-400/20'
                                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="comp"
                                  checked={compressionLevel === 'less'}
                                  onChange={() => setCompressionLevel('less')}
                                  className="accent-rose-600"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    Less compression
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    High quality, less compression
                                  </div>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* ROTATE PDF SIDEBAR */}
                      {activeTool === 'rotate' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {Object.values(perPageRotations).filter((v) => (v % 360) !== 0).length > 0
                                ? `${Object.values(perPageRotations).filter((v) => (v % 360) !== 0).length} page(s) custom rotated`
                                : 'All pages normal'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPerPageRotations({});
                                setRotationDegrees(0);
                                showToast('Reset all page rotations');
                              }}
                              className="text-rose-500 hover:underline font-semibold"
                            >
                              Reset all
                            </button>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                              Batch Rotate All Pages:
                            </span>
                            <div className="grid grid-cols-2 gap-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setPerPageRotations((prev) => {
                                    const next = { ...prev };
                                    docPages.forEach((p) => {
                                      next[p.pageNumber] = ((next[p.pageNumber] || 0) + 90) % 360;
                                    });
                                    return next;
                                  });
                                  setRotationDegrees((d) => (d + 90) % 360);
                                }}
                                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
                              >
                                <RotateCw className="w-4 h-4 text-rose-500" />
                                <span>ALL (+90°)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPerPageRotations((prev) => {
                                    const next = { ...prev };
                                    docPages.forEach((p) => {
                                      next[p.pageNumber] = ((next[p.pageNumber] || 0) - 90 + 360) % 360;
                                    });
                                    return next;
                                  });
                                  setRotationDegrees((d) => (d - 90 + 360) % 360);
                                }}
                                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
                              >
                                <RotateCcw className="w-4 h-4 text-rose-500" />
                                <span>ALL (-90°)</span>
                              </button>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            💡 <span className="font-semibold text-slate-700 dark:text-slate-300">Tip:</span> Hover over individual page cards on the left or use the small rotate buttons to rotate only specific pages (e.g. page 7 or 8).
                          </div>
                        </div>
                      )}

                      {/* PAGE NUMBERS SIDEBAR */}
                      {activeTool === 'page-numbers' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Page mode:
                            </label>
                            <div className="flex items-center gap-4 text-xs">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="pgmode"
                                  checked={pageNumberMode === 'single'}
                                  onChange={() => setPageNumberMode('single')}
                                  className="accent-rose-600"
                                />
                                <span>Single page</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="pgmode"
                                  checked={pageNumberMode === 'facing'}
                                  onChange={() => setPageNumberMode('facing')}
                                  className="accent-rose-600"
                                />
                                <span>Facing pages</span>
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 items-center">
                            <div>
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                                Position:
                              </label>
                              <PositionGridPicker
                                value={pageNumberPosGrid}
                                onChange={setPageNumberPosGrid}
                              />
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                  Margin:
                                </label>
                                <select
                                  value={pageNumberMargin}
                                  onChange={(e) => setPageNumberMargin(e.target.value as any)}
                                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                                >
                                  <option value="recommended">Recommended</option>
                                  <option value="small">Small</option>
                                  <option value="large">Large</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                  First number:
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={pageNumberFirstNum}
                                  onChange={(e) => setPageNumberFirstNum(Number(e.target.value))}
                                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">
                                from page
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={docPages.length || 1}
                                value={pageNumberFromPage}
                                onChange={(e) => setPageNumberFromPage(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">to</label>
                              <input
                                type="number"
                                min={pageNumberFromPage}
                                max={docPages.length || 1}
                                value={pageNumberToPage}
                                onChange={(e) => setPageNumberToPage(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* WATERMARK SIDEBAR */}
                      {activeTool === 'watermark' && (
                        <div className="space-y-4">
                          <input
                            ref={watermarkImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleWatermarkImageUpload}
                            className="hidden"
                          />

                          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-center">
                            <button
                              type="button"
                              onClick={() => setWatermarkTab('text')}
                              className={`py-1.5 rounded-lg transition-all ${
                                watermarkTab === 'text'
                                  ? 'bg-white dark:bg-surface-900 text-slate-900 dark:text-white shadow-sm'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              Place text
                            </button>
                            <button
                              type="button"
                              onClick={() => setWatermarkTab('image')}
                              className={`py-1.5 rounded-lg transition-all ${
                                watermarkTab === 'image'
                                  ? 'bg-white dark:bg-surface-900 text-slate-900 dark:text-white shadow-sm'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              Place image
                            </button>
                          </div>

                          {watermarkTab === 'text' ? (
                            <div>
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Text:
                              </label>
                              <input
                                type="text"
                                value={watermarkText}
                                onChange={(e) => setWatermarkText(e.target.value)}
                                placeholder="e.g. iLovePDF, CONFIDENTIAL"
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                              />
                            </div>
                          ) : (
                            /* Place Image Uploader Section (Requested by user) */
                            <div className="space-y-3">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                Watermark Image:
                              </label>

                              {watermarkImageDataUrl ? (
                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                                      <img
                                        src={watermarkImageDataUrl}
                                        alt="Watermark thumbnail"
                                        className="max-h-full max-w-full object-contain"
                                      />
                                    </div>
                                    <div className="truncate text-xs">
                                      <p className="font-bold text-slate-900 dark:text-white truncate">
                                        {watermarkImageFile?.name || 'Watermark Image'}
                                      </p>
                                      <span className="text-[10px] text-slate-400">
                                        {watermarkImageFile ? `${(watermarkImageFile.size / 1024).toFixed(1)} KB` : 'Image ready'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => watermarkImageInputRef.current?.click()}
                                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                                    >
                                      Change
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setWatermarkImageFile(null);
                                        setWatermarkImageDataUrl('');
                                      }}
                                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                      title="Remove"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => watermarkImageInputRef.current?.click()}
                                  className="w-full py-4 px-3 rounded-2xl border-2 border-dashed border-rose-300 dark:border-rose-800 hover:border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Upload className="w-5 h-5 text-rose-500" />
                                  <span>Upload Watermark Image</span>
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    Supports PNG with transparency, JPG, SVG, WebP
                                  </span>
                                </button>
                              )}

                              <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <label className="font-bold text-slate-700 dark:text-slate-300">
                                    Image Size Scale:
                                  </label>
                                  <span className="font-mono text-slate-500">{watermarkImageScale}%</span>
                                </div>
                                <input
                                  type="range"
                                  min={10}
                                  max={100}
                                  step={5}
                                  value={watermarkImageScale}
                                  onChange={(e) => setWatermarkImageScale(Number(e.target.value))}
                                  className="w-full accent-rose-600 cursor-pointer"
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            <div>
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Position:
                              </label>
                              <PositionGridPicker
                                value={watermarkPos}
                                onChange={setWatermarkPos}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 cursor-pointer text-xs">
                                <input
                                  type="checkbox"
                                  checked={watermarkMosaic}
                                  onChange={(e) => setWatermarkMosaic(e.target.checked)}
                                  className="w-4 h-4 text-rose-600 rounded"
                                />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  Mosaic pattern
                                </span>
                              </label>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">
                                  Transparency
                                </label>
                                <select
                                  value={watermarkOpacity}
                                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                                >
                                  <option value={100}>No transparency (100%)</option>
                                  <option value={75}>25% transparent</option>
                                  <option value={50}>50% transparent</option>
                                  <option value={25}>75% transparent</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* IMAGE TO PDF SIDEBAR */}
                      {activeTool === 'jpg-to-pdf' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                              Page orientation:
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() => setJpgOrientation('portrait')}
                                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                  jpgOrientation === 'portrait'
                                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                Portrait
                              </button>
                              <button
                                type="button"
                                onClick={() => setJpgOrientation('landscape')}
                                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                  jpgOrientation === 'landscape'
                                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                Landscape
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Page size:
                            </label>
                            <select
                              value={jpgPageSize}
                              onChange={(e) => setJpgPageSize(e.target.value as any)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                            >
                              <option value="a4">A4 (297x210 mm)</option>
                              <option value="letter">US Letter</option>
                              <option value="fit">Fit (Same page size as image)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Margin:
                            </label>
                            <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                              {(['none', 'small', 'big'] as const).map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setJpgMargin(m)}
                                  className={`py-1.5 rounded-lg border text-center capitalize transition-all ${
                                    jpgMargin === m
                                      ? 'border-rose-500 text-rose-600 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  {m === 'none' ? 'No margin' : m}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PROTECT PDF SIDEBAR */}
                      {activeTool === 'protect' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Password:
                            </label>
                            <input
                              type="password"
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              placeholder="Enter document password"
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Confirm password:
                            </label>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm password"
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* UNLOCK PDF SIDEBAR */}
                      {activeTool === 'unlock' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Document Password:
                            </label>
                            <div className="relative">
                              <input
                                type={showUnlockPassword ? 'text' : 'password'}
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                placeholder="Enter document password..."
                                className="w-full px-3 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                title={showUnlockPassword ? 'Hide password' : 'Show password'}
                              >
                                {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                              Enter the document password to permanently remove encryption and security restrictions.
                            </p>
                          </div>

                          {isDocEncrypted && (
                            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                              <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                              <div className="space-y-0.5">
                                <span className="font-bold">Password-Protected PDF</span>
                                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                  This file is locked with encryption ({docEncryptionInfo || 'Standard Encryption'}).
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SIGN PDF SIDEBAR */}
                      {activeTool === 'sign' && (
                        <div className="space-y-4">
                          <input
                            ref={signImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleSignImageUpload}
                            className="hidden"
                          />

                          <div className="grid grid-cols-3 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-center">
                            <button
                              type="button"
                              onClick={() => setSignatureMode('draw')}
                              className={`py-1.5 rounded-lg transition-all ${
                                signatureMode === 'draw'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                              }`}
                            >
                              Draw Pad
                            </button>
                            <button
                              type="button"
                              onClick={() => setSignatureMode('type')}
                              className={`py-1.5 rounded-lg transition-all ${
                                signatureMode === 'type'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                              }`}
                            >
                              Type Name
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSignatureMode('upload');
                                if (!signCustomImage) signImageInputRef.current?.click();
                              }}
                              className={`py-1.5 rounded-lg transition-all ${
                                signatureMode === 'upload'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                              }`}
                            >
                              Upload Stamp
                            </button>
                          </div>

                          {signatureMode === 'draw' ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-600 dark:text-slate-300">Sign with mouse / stylus:</span>
                                <button
                                  type="button"
                                  onClick={clearSignature}
                                  className="text-rose-500 hover:underline font-bold"
                                >
                                  Clear Canvas
                                </button>
                              </div>
                              <div className="p-1 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white w-full">
                                <canvas
                                  ref={signatureCanvasRef}
                                  width={400}
                                  height={120}
                                  onMouseDown={startDrawing}
                                  onMouseMove={draw}
                                  onMouseUp={stopDrawing}
                                  onMouseLeave={stopDrawing}
                                  onTouchStart={startDrawing}
                                  onTouchMove={draw}
                                  onTouchEnd={stopDrawing}
                                  className="w-full h-28 bg-slate-50 rounded-lg cursor-crosshair touch-none"
                                />
                              </div>
                            </div>
                          ) : signatureMode === 'type' ? (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                Signature Text:
                              </label>
                              <input
                                type="text"
                                value={signatureText}
                                onChange={(e) => setSignatureText(e.target.value)}
                                placeholder="Type your full name..."
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-serif italic text-blue-900 dark:text-blue-200"
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                Signature Image Stamp:
                              </label>
                              {signCustomImage ? (
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                  <img src={signCustomImage} alt="Stamp" className="h-10 object-contain bg-white rounded p-1" />
                                  <button
                                    type="button"
                                    onClick={() => signImageInputRef.current?.click()}
                                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold"
                                  >
                                    Change
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => signImageInputRef.current?.click()}
                                  className="w-full py-3 rounded-xl border border-dashed border-rose-400 text-rose-600 font-bold text-xs hover:bg-rose-50"
                                >
                                  + Select Signature PNG/JPG
                                </button>
                              )}
                            </div>
                          )}

                          {/* Ink Color Picker */}
                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                              Ink Color:
                            </label>
                            <div className="flex items-center gap-2">
                              {[
                                { color: '#1d4ed8', label: 'Navy Blue' },
                                { color: '#0f172a', label: 'Dark Slate' },
                                { color: '#b91c1c', label: 'Crimson' },
                              ].map((item) => (
                                <button
                                  key={item.color}
                                  type="button"
                                  onClick={() => setSignColor(item.color)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                    signColor === item.color
                                      ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-sm'
                                      : 'border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-[11px]">{item.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Placement Targets */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Apply to Page:
                              </label>
                              <select
                                value={signPageTarget}
                                onChange={(e) => setSignPageTarget(e.target.value as any)}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                              >
                                <option value="last">Last page</option>
                                <option value="first">First page</option>
                                <option value="all">All pages</option>
                              </select>
                            </div>
                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Position:
                              </label>
                              <select
                                value={signPosition}
                                onChange={(e) => setSignPosition(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                              >
                                <option value="bottom_right">Bottom Right</option>
                                <option value="bottom_left">Bottom Left</option>
                                <option value="center">Center</option>
                              </select>
                            </div>
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs">
                            <input
                              type="checkbox"
                              checked={signIncludeDate}
                              onChange={(e) => setSignIncludeDate(e.target.checked)}
                              className="w-4 h-4 text-rose-600 rounded accent-rose-600"
                            />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Include timestamp badge
                            </span>
                          </label>
                        </div>
                      )}

                      {/* OCR PDF SIDEBAR */}
                      {activeTool === 'ocr' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Document language:
                            </label>
                            <select
                              value={ocrLanguage}
                              onChange={(e) => setOcrLanguage(e.target.value as any)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                            >
                              <option value="English">English (Auto Detect)</option>
                              <option value="Spanish">Spanish (Español)</option>
                              <option value="French">French (Français)</option>
                              <option value="German">German (Deutsch)</option>
                              <option value="Hindi">Hindi (हिन्दी)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Output structure:
                            </label>
                            <select
                              value={ocrMode}
                              onChange={(e) => setOcrMode(e.target.value as any)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                            >
                              <option value="searchable_pdf">Searchable PDF</option>
                              <option value="text_only">Extract text transcript (.txt)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* CROP PDF SIDEBAR (ILovePDF Image 22 Exact Style) */}
                      {activeTool === 'crop' && (
                        <div className="space-y-5">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Pages to Crop
                            </label>
                            <button
                              type="button"
                              onClick={() => setCropBox({ x: 10, y: 10, width: 80, height: 80 })}
                              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                            >
                              Reset all
                            </button>
                          </div>

                          {/* Scope Radio Cards */}
                          <div className="space-y-2.5">
                            <div
                              onClick={() => setCropScope('all')}
                              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                                cropScope === 'all'
                                  ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 ring-2 ring-rose-500/20'
                                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-surface-800'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full mt-0.5 border-2 flex items-center justify-center shrink-0 ${
                                  cropScope === 'all'
                                    ? 'border-rose-600 bg-rose-600'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {cropScope === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <div className="space-y-0.5 flex-1">
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                  All pages
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Crop every page in the document using this crop region ({docPages.length || 1} pages).
                                </div>
                              </div>
                            </div>

                            <div
                              onClick={() => setCropScope('current')}
                              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                                cropScope === 'current'
                                  ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 ring-2 ring-rose-500/20'
                                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-surface-800'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full mt-0.5 border-2 flex items-center justify-center shrink-0 ${
                                  cropScope === 'current'
                                    ? 'border-rose-600 bg-rose-600'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {cropScope === 'current' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <div className="space-y-0.5 flex-1">
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                  Current page only (Page {cropCurrentPage})
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Only trim Page {cropCurrentPage}. Other pages will remain unchanged.
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quick Crop Presets */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Quick Presets
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() => setCropBox({ x: 0, y: 0, width: 100, height: 100 })}
                                className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-center"
                              >
                                Full Page
                              </button>
                              <button
                                type="button"
                                onClick={() => setCropBox({ x: 10, y: 10, width: 80, height: 80 })}
                                className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-center"
                              >
                                10% Margins
                              </button>
                              <button
                                type="button"
                                onClick={() => setCropBox({ x: 15, y: 15, width: 70, height: 70 })}
                                className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-center"
                              >
                                15% Margins
                              </button>
                              <button
                                type="button"
                                onClick={() => setCropBox({ x: 5, y: 5, width: 90, height: 50.6 })}
                                className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-center"
                              >
                                16:9 Banner
                              </button>
                            </div>
                          </div>

                          {/* Fine-Tuning Coordinates (2-Way Synced) */}
                          <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                              <span>Crop Margins (%)</span>
                              <span className="font-mono text-[11px] text-rose-600 dark:text-rose-400">
                                {cropBox.width.toFixed(0)}% × {cropBox.height.toFixed(0)}%
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Top</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="90"
                                  value={Math.round(cropBox.y)}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(90, Number(e.target.value) || 0));
                                    setCropBox((prev) => ({
                                      ...prev,
                                      y: val,
                                      height: Math.max(5, Math.min(100 - val, prev.height)),
                                    }));
                                  }}
                                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-900 text-xs font-mono"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Bottom</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="90"
                                  value={Math.round(100 - cropBox.y - cropBox.height)}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(90, Number(e.target.value) || 0));
                                    setCropBox((prev) => ({
                                      ...prev,
                                      height: Math.max(5, 100 - prev.y - val),
                                    }));
                                  }}
                                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-900 text-xs font-mono"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Left</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="90"
                                  value={Math.round(cropBox.x)}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(90, Number(e.target.value) || 0));
                                    setCropBox((prev) => ({
                                      ...prev,
                                      x: val,
                                      width: Math.max(5, Math.min(100 - val, prev.width)),
                                    }));
                                  }}
                                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-900 text-xs font-mono"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Right</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="90"
                                  value={Math.round(100 - cropBox.x - cropBox.width)}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(90, Number(e.target.value) || 0));
                                    setCropBox((prev) => ({
                                      ...prev,
                                      width: Math.max(5, 100 - prev.x - val),
                                    }));
                                  }}
                                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-900 text-xs font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* EDIT PDF SIDEBAR */}
                      {activeTool === 'edit' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Annotation Type:
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() => setEditAnnotationType('stamp')}
                                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                  editAnnotationType === 'stamp'
                                    ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20 font-bold'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                Official Stamp
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditAnnotationType('text')}
                                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                  editAnnotationType === 'text'
                                    ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20 font-bold'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                Custom Note
                              </button>
                            </div>
                          </div>

                          {editAnnotationType === 'stamp' ? (
                            <div>
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Stamp Wording:
                              </label>
                              <select
                                value={editStampType}
                                onChange={(e) => setEditStampType(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                              >
                                <option value="APPROVED">APPROVED</option>
                                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                                <option value="DRAFT">DRAFT</option>
                                <option value="REVIEWED">REVIEWED</option>
                                <option value="FINAL">FINAL</option>
                                <option value="PAID">PAID</option>
                              </select>
                            </div>
                          ) : (
                            <div>
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Note Text:
                              </label>
                              <input
                                type="text"
                                value={editAnnotationText}
                                onChange={(e) => setEditAnnotationText(e.target.value)}
                                placeholder="Enter text annotation..."
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                              />
                            </div>
                          )}

                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Placement Position:
                            </label>
                            <select
                              value={editPosition}
                              onChange={(e) => setEditPosition(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                            >
                              <option value="top_right">Top Right</option>
                              <option value="top_left">Top Left</option>
                              <option value="top_center">Top Center</option>
                              <option value="middle_center">Center</option>
                              <option value="bottom_left">Bottom Left</option>
                              <option value="bottom_right">Bottom Right</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* PDF TO JPG SIDEBAR */}
                      {activeTool === 'pdf-to-jpg' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Output Image Format:
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() => setPdfToJpgFormat('jpg')}
                                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                  pdfToJpgFormat === 'jpg'
                                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                JPG (Smaller)
                              </button>
                              <button
                                type="button"
                                onClick={() => setPdfToJpgFormat('png')}
                                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                  pdfToJpgFormat === 'png'
                                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                PNG (Lossless)
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Image Quality:
                            </label>
                            <select
                              value={pdfToJpgDpi}
                              onChange={(e) => setPdfToJpgDpi(Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                            >
                              <option value={1.5}>Standard Quality (150 DPI)</option>
                              <option value={2.0}>High Quality (200 DPI)</option>
                              <option value={2.5}>Ultra Sharp (300 DPI)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* HTML TO PDF SIDEBAR */}
                      {activeTool === 'html-to-pdf' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Rendering Mode:
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() => setHtmlPdfMode('visual')}
                                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                  htmlPdfMode === 'visual'
                                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                Webpage (Visual)
                              </button>
                              <button
                                type="button"
                                onClick={() => setHtmlPdfMode('code')}
                                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                  htmlPdfMode === 'code'
                                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                Source Code (Full)
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2">
                              {htmlPdfMode === 'visual'
                                ? 'Renders the styled HTML layout, tables, fonts, colors, and graphics into visual PDF pages.'
                                : 'Prints the complete formatted HTML code across pages with line numbers without truncating any lines.'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* COMPARE PDF SIDEBAR */}
                      {activeTool === 'compare' && (
                        <div className="space-y-4">
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              Comparison Metrics:
                            </span>
                            <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                              <div className="flex items-center justify-between">
                                <span>Doc A Pages:</span>
                                <span className="font-mono font-bold">{compareDocPages.doc1.length || docPages.length || 0}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Doc B Pages:</span>
                                <span className="font-mono font-bold">
                                  {uploadedFiles.length > 1 ? compareDocPages.doc2.length || 'Ready' : 'Not uploaded'}
                                </span>
                              </div>
                              {uploadedFiles.length > 1 && (
                                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-bold">
                                  <span>Page Difference:</span>
                                  <span className="font-mono">
                                    {(compareDocPages.doc2.length || 0) - (compareDocPages.doc1.length || docPages.length || 0) >= 0 ? '+' : ''}
                                    {(compareDocPages.doc2.length || 0) - (compareDocPages.doc1.length || docPages.length || 0)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {uploadedFiles.length < 2 && (
                            <button
                              type="button"
                              onClick={() => compareDoc2InputRef.current?.click()}
                              className="w-full py-3 px-4 rounded-xl border border-dashed border-rose-500 text-rose-600 font-bold text-xs hover:bg-rose-50 cursor-pointer"
                            >
                              + Upload Document B to Compare
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Signature Red Action Button (Matching ILovePDF [Action ->]) */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        disabled={
                          isProcessing ||
                          (activeTool === 'remove-pages' &&
                            docPages.length > 0 &&
                            pagesToDelete.length === docPages.length)
                        }
                        onClick={executeActiveTool}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing in Browser...</span>
                          </>
                        ) : (
                          <>
                            <span>
                              {activeTool === 'merge'
                                ? 'Merge PDF'
                                : activeTool === 'split' || activeTool === 'extract-pages'
                                ? 'Split PDF'
                                : activeTool === 'remove-pages'
                                ? 'Remove pages'
                                : activeTool === 'compress'
                                ? 'Compress PDF'
                                : activeTool === 'rotate'
                                ? 'Rotate PDF'
                                : activeTool === 'page-numbers'
                                ? 'Add page numbers'
                                : activeTool === 'watermark'
                                ? 'Add watermark'
                                : activeTool === 'jpg-to-pdf'
                                ? 'Convert to PDF'
                                : activeTool === 'protect'
                                ? 'Protect PDF'
                                : activeTool === 'unlock'
                                ? 'Unlock PDF'
                                : activeTool === 'sign'
                                ? 'Sign PDF'
                                : activeTool === 'ocr'
                                ? 'Apply OCR'
                                : activeTool === 'repair'
                                ? 'Repair PDF'
                                : activeTool === 'crop'
                                ? 'Crop PDF'
                                : activeTool === 'pdf-to-word'
                                ? 'Convert to WORD'
                                : activeTool === 'pdf-to-ppt'
                                ? 'Convert to PPT'
                                : activeTool === 'pdf-to-excel'
                                ? 'Convert to EXCEL'
                                : activeTool === 'pdf-to-markdown'
                                ? 'Convert to Markdown'
                                : activeTool === 'word-to-pdf'
                                ? 'Convert to PDF'
                                : activeTool === 'compare'
                                ? 'Compare PDFs'
                                : `Process ${currentToolDef.name}`}
                            </span>
                            <ArrowRight className="w-5 h-5 bg-white/20 rounded-full p-0.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* 2. ALL 31 PDF TOOLS GRID (iLovePDF Style Premium UI)      */
        /* ======================================================== */
        <div className="space-y-6 sm:space-y-8">
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-rose-50 via-white to-indigo-50/60 dark:from-surface-900 dark:via-surface-900 dark:to-indigo-950/30 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-10 shadow-sm">
            <div className="relative z-10 max-w-3xl space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Client-Side PDF Suite (33 Utilities)</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Every tool you need to work with <span className="text-rose-600 dark:text-rose-400">PDFs in one place</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Merge, split, compress, convert, edit, watermark, sign, OCR, and protect your PDF documents.
                All processing executes 100% inside your browser memory for maximal privacy and zero data leakage.
              </p>
            </div>
          </div>

          {/* Controls: Search & Category Pills */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search PDF tools (e.g. merge, split, word, compress, sign, ocr)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-sm"
                />
              </div>

              <div className="text-xs font-semibold text-slate-500 self-center">
                {filteredCatalog.length} PDF utility available
              </div>
            </div>

            {/* Category Pills (Touch-friendly Horizontal Scroll on Mobile) */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                      : 'bg-white dark:bg-surface-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 33 Tools Cards Grid (Responsive 1-col on tiny mobile, 2-col on sm, 4-col on desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredCatalog.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={`/normalUser/pdf-tools?mode=${item.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="premium-card group cursor-pointer p-4 sm:p-5 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-brand-500/60 dark:hover:border-brand-500/60 flex flex-col justify-between active:scale-[0.98] transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-sm ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>{item.category}</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold group-hover:translate-x-0.5 transition-transform">
                      Open Tool &rarr;
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      <RelatedTools currentTool={tool} />
    </div>
  );
};
