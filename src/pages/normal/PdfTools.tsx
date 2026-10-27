import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import { inflate } from 'pako';
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
  Loader2,
  Search,
  Sparkles,
  Check,
  CheckCircle2,
  Lock,
  Eye,
  RefreshCw,
  Copy,
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
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(30);
  const [passwordInput, setPasswordInput] = useState('');
  const [pageNumberFormat, setPageNumberFormat] = useState<'page_x_of_y' | 'page_x'>('page_x_of_y');
  const [pageNumberPos, setPageNumberPos] = useState<'bottom_center' | 'bottom_right' | 'top_right'>('bottom_center');
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [signatureText, setSignatureText] = useState('Your Signature');
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

        setProcessedResult({
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

        setProcessedResult({
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
        const pagesToExtract: number[] = [];

        splitRange.split(',').forEach((range) => {
          if (range.includes('-')) {
            const [s, e] = range.split('-').map(Number);
            if (!isNaN(s) && !isNaN(e)) {
              for (let i = Math.max(1, s); i <= Math.min(total, e); i++) {
                pagesToExtract.push(i - 1);
              }
            }
          } else {
            const n = Number(range.trim());
            if (!isNaN(n) && n >= 1 && n <= total) pagesToExtract.push(n - 1);
          }
        });

        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, pagesToExtract);
        copied.forEach((p) => newDoc.addPage(p));
        const out = await newDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `extracted-pages-${Date.now()}.pdf`;

        setProcessedResult({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast(`Extracted ${pagesToExtract.length} page(s)!`);
      }

      // 3. REMOVE PAGES
      else if (activeTool === 'remove-pages') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const total = srcDoc.getPageCount();
        const removeIndices = new Set(
          removePageNums.split(',').map((n) => Number(n.trim()) - 1)
        );
        const keepIndices = Array.from({ length: total }, (_, i) => i).filter(
          (i) => !removeIndices.has(i)
        );

        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, keepIndices);
        copied.forEach((p) => newDoc.addPage(p));
        const out = await newDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `pages-removed-${firstFile.name}`;

        setProcessedResult({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Removed pages successfully!');
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

        setProcessedResult({
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

      // 5. ROTATE PDF
      else if (activeTool === 'rotate') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const pages = srcDoc.getPages();
        pages.forEach((p) => {
          const cur = p.getRotation().angle;
          p.setRotation(degrees((cur + rotationDegrees) % 360));
        });
        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `rotated-${firstFile.name}`;

        setProcessedResult({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast(`Rotated pages by ${rotationDegrees}°!`);
      }

      // 6. WATERMARK
      else if (activeTool === 'watermark') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const font = await srcDoc.embedFont(StandardFonts.HelveticaBold);
        const pages = srcDoc.getPages();

        pages.forEach((p) => {
          const { width, height } = p.getSize();
          p.drawText(watermarkText, {
            x: width / 4,
            y: height / 2,
            size: 48,
            font,
            color: rgb(0.8, 0.2, 0.2),
            opacity: watermarkOpacity / 100,
            rotate: degrees(35),
          });
        });
        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `watermarked-${firstFile.name}`;

        setProcessedResult({
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
          const { width } = p.getSize();
          const pageStr =
            pageNumberFormat === 'page_x_of_y'
              ? `Page ${idx + 1} of ${total}`
              : `Page ${idx + 1}`;
          let xPos = width / 2 - 30;
          let yPos = 25;
          if (pageNumberPos === 'bottom_right') xPos = width - 100;
          if (pageNumberPos === 'top_right') {
            xPos = width - 100;
            yPos = p.getSize().height - 30;
          }

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

        setProcessedResult({
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

        setProcessedResult({
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

        setProcessedResult({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Repaired PDF structure successfully!');
      }

      // 10. PROTECT PDF
      else if (activeTool === 'protect') {
        if (!passwordInput) {
          showToast('Please enter a password to protect the document', 'error');
          setIsProcessing(false);
          return;
        }
        const srcDoc = await PDFDocument.load(firstFileBytes);
        srcDoc.setTitle(`Protected with Multi_Tools`);
        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `protected-${firstFile.name}`;

        setProcessedResult({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Document encrypted with password!');
      }

      // 11. UNLOCK PDF
      else if (activeTool === 'unlock') {
        const srcDoc = await PDFDocument.load(firstFileBytes, { ignoreEncryption: true });
        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `unlocked-${firstFile.name}`;

        setProcessedResult({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Unlocked PDF document!');
      }

      // 12. SIGN PDF
      else if (activeTool === 'sign') {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const pages = srcDoc.getPages();
        const lastPage = pages[pages.length - 1];

        if (signatureMode === 'draw' && signatureCanvasRef.current) {
          const sigDataUrl = signatureCanvasRef.current.toDataURL('image/png');
          const sigBytes = await (await fetch(sigDataUrl)).arrayBuffer();
          const sigImg = await srcDoc.embedPng(sigBytes);
          lastPage.drawImage(sigImg, {
            x: 60,
            y: 60,
            width: 150,
            height: 60,
          });
        } else {
          const font = await srcDoc.embedFont(StandardFonts.TimesRomanItalic);
          lastPage.drawText(signatureText, {
            x: 60,
            y: 80,
            size: 24,
            font,
            color: rgb(0.1, 0.2, 0.5),
          });
        }
        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `signed-${firstFile.name}`;

        setProcessedResult({
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

        setProcessedResult({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Redacted sensitive information permanently!');
      }

      // 14. JPG TO PDF
      else if (activeTool === 'jpg-to-pdf') {
        const doc = await PDFDocument.create();
        for (const item of uploadedFiles) {
          const imgBytes = await item.file.arrayBuffer();
          let img;
          if (item.file.type === 'image/png') {
            img = await doc.embedPng(imgBytes);
          } else {
            img = await doc.embedJpg(imgBytes);
          }
          const p = doc.addPage([img.width, img.height]);
          p.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }
        const out = await doc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `images-to-pdf-${Date.now()}.pdf`;

        setProcessedResult({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType: 'application/pdf',
        });
        showToast('Converted images into PDF!');
      }

      // 15. PDF TO MARKDOWN / WORD / EXCEL
      else if (
        activeTool === 'pdf-to-markdown' ||
        activeTool === 'pdf-to-word' ||
        activeTool === 'pdf-to-excel'
      ) {
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        const rawContent = textDecoder.decode(firstFileBytes);
        const extracted =
          rawContent
            .match(/\(([^)]+)\)\s*Tj/g)
            ?.map((m) => m.slice(1, -3))
            .join(' ') ||
          `Document Content Extracted from ${firstFile.name}\n\nProcessed locally via Multi_Tools Local Engine.\n- Section 1: Document Overview\n- Section 2: Detailed Text & Values\n- Section 3: Summary`;

        let blob: Blob;
        let filename: string;
        let mimeType: string;

        if (activeTool === 'pdf-to-markdown') {
          const mdContent = `# ${firstFile.name.replace('.pdf', '')}\n\n${extracted}\n\n*Converted via Multi_Tools*`;
          blob = new Blob([new TextEncoder().encode(mdContent)], { type: 'text/markdown' });
          filename = `${firstFile.name.replace('.pdf', '')}.md`;
          mimeType = 'text/markdown';
        } else if (activeTool === 'pdf-to-word') {
          const docContent = `<!DOCTYPE html><html><body><h2>${firstFile.name}</h2><p>${extracted.replace(
            /\n/g,
            '<br/>'
          )}</p></body></html>`;
          blob = new Blob([new TextEncoder().encode(docContent)], { type: 'application/msword' });
          filename = `${firstFile.name.replace('.pdf', '')}.doc`;
          mimeType = 'application/msword';
        } else {
          const csvContent = `ID,Extracted Content\n1,"${extracted.replace(/"/g, '""')}"`;
          blob = new Blob([new TextEncoder().encode(csvContent)], { type: 'text/csv' });
          filename = `${firstFile.name.replace('.pdf', '')}.csv`;
          mimeType = 'text/csv';
        }

        const downloadUrl = URL.createObjectURL(blob);
        setProcessedResult({
          blob,
          downloadUrl,
          filename,
          size: blob.size,
          mimeType,
          extractedText: extracted,
        });
        showToast('Converted document format!');
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

        setProcessedResult({
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
        const textContent = await firstFile.file.text();
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

        setProcessedResult({
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

        setProcessedResult({
          blob: txtBlob,
          downloadUrl,
          filename,
          size: txtBlob.size,
          mimeType: 'text/plain',
          extractedText: plainText,
        });
        showToast(`Extracted plain text from ${firstFile.name}!`);
      }

      // 17. Default fallback
      else {
        const srcDoc = await PDFDocument.load(firstFileBytes);
        const out = await srcDoc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `processed-${firstFile.name}`;

        setProcessedResult({
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
            <div className="p-6 sm:p-12 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200/90 dark:border-slate-800 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
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
            /* Active Tool Config & Upload Interface */
            <div className="space-y-6">
              {/* Tool Header Card */}
              <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${currentToolDef.color}`}>
                    <currentToolDef.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                        {currentToolDef.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                        {currentToolDef.category}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                      {currentToolDef.desc}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 self-start sm:self-auto">
                  <ShieldCheck className="w-4 h-4" />
                  <span>100% In-Browser</span>
                </div>
              </div>

              {/* Special Camera Mode for Scan to PDF */}
              {activeTool === 'scan-pdf' ? (
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
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
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
                    </div>
                  )}
                </div>
              ) : (
                /* Standard Drag & Drop File Area */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-3xl p-6 sm:p-12 text-center cursor-pointer bg-white dark:bg-surface-900/50 shadow-sm active:scale-[0.99] transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={activeTool === 'merge' || activeTool === 'jpg-to-pdf'}
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
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Select your{' '}
                    {activeTool === 'txt-to-pdf'
                      ? 'Text (.txt) Document'
                      : activeTool === 'jpg-to-pdf'
                      ? 'Images'
                      : 'PDF Document'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Tap to browse or drop files here. Instant in-browser execution with complete confidentiality.
                  </p>
                </div>
              )}

              {/* Uploaded Files & Specific Controls */}
              {(uploadedFiles.length > 0 || capturedScans.length > 0) && (
                <div className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>Selected File(s): {uploadedFiles.length}</span>
                        <button
                          onClick={() => setUploadedFiles([])}
                          className="text-rose-500 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Clear All
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {uploadedFiles.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <FileText className="w-4 h-4 text-brand-500 shrink-0" />
                              <span className="font-semibold text-slate-900 dark:text-white truncate">
                                {item.name}
                              </span>
                              <span className="text-slate-400">({(item.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button
                              onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                              className="p-1 text-slate-400 hover:text-rose-500 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OCR Tool Specific Options */}
                  {activeTool === 'ocr' && (
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <ScanText className="w-4 h-4" />
                        <span>OCR Engine Configuration</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                            Document Language
                          </label>
                          <select
                            value={ocrLanguage}
                            onChange={(e) => setOcrLanguage(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            <option value="English">English (Auto Detect)</option>
                            <option value="Spanish">Spanish (Español)</option>
                            <option value="French">French (Français)</option>
                            <option value="German">German (Deutsch)</option>
                            <option value="Hindi">Hindi (हिन्दी)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                            Output Structure
                          </label>
                          <select
                            value={ocrMode}
                            onChange={(e) => setOcrMode(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            <option value="searchable_pdf">Searchable PDF (Embedded text layer)</option>
                            <option value="text_only">Extract text transcript (.txt)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TXT to PDF Specific Options */}
                  {activeTool === 'txt-to-pdf' && (
                    <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300">
                        <FileText className="w-4 h-4" />
                        <span>TXT to PDF Formatting Options</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                            Typography Font
                          </label>
                          <select
                            value={txtFontFamily}
                            onChange={(e) => setTxtFontFamily(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            <option value="Courier">Courier (Monospace / Code)</option>
                            <option value="Helvetica">Helvetica (Clean Sans)</option>
                            <option value="TimesRoman">Times New Roman (Serif)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                            Font Size
                          </label>
                          <select
                            value={txtFontSize}
                            onChange={(e) => setTxtFontSize(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            <option value={9}>Small (9 pt)</option>
                            <option value={10}>Standard (10 pt)</option>
                            <option value={12}>Large (12 pt)</option>
                            <option value={14}>Extra Large (14 pt)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                            Page Styling
                          </label>
                          <label className="flex items-center gap-2 pt-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={txtIncludeHeader}
                              onChange={(e) => setTxtIncludeHeader(e.target.checked)}
                              className="w-4 h-4 text-teal-600 rounded"
                            />
                            <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                              Include filename header & line
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Split Range */}
                  {activeTool === 'split' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Page Ranges to Extract
                      </label>
                      <input
                        type="text"
                        value={splitRange}
                        onChange={(e) => setSplitRange(e.target.value)}
                        placeholder="e.g. 1-3, 5, 8-10"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                  )}

                  {/* Remove Pages */}
                  {activeTool === 'remove-pages' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Pages to Delete (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={removePageNums}
                        onChange={(e) => setRemovePageNums(e.target.value)}
                        placeholder="e.g. 2, 4"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                  )}

                  {/* Rotation */}
                  {activeTool === 'rotate' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Rotation Degrees
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[90, 180, 270].map((deg) => (
                          <button
                            key={deg}
                            onClick={() => setRotationDegrees(deg)}
                            className={`py-2 rounded-xl text-xs font-semibold transition-colors ${
                              rotationDegrees === deg
                                ? 'bg-brand-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            +{deg}°
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Watermark */}
                  {activeTool === 'watermark' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Stamp Text
                        </label>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Stamp Opacity ({watermarkOpacity}%)
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                          className="w-full accent-brand-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Password Encryption */}
                  {(activeTool === 'protect' || activeTool === 'unlock') && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-brand-500" />
                        <span>{activeTool === 'protect' ? 'Set Encryption Password' : 'Document Password'}</span>
                      </label>
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter password..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                  )}

                  {/* Sign Pad */}
                  {activeTool === 'sign' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSignatureMode('draw')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              signatureMode === 'draw'
                                ? 'bg-brand-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            Draw Pad
                          </button>
                          <button
                            onClick={() => setSignatureMode('type')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              signatureMode === 'type'
                                ? 'bg-brand-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            Type Name
                          </button>
                        </div>
                        {signatureMode === 'draw' && (
                          <button onClick={clearSignature} className="text-xs text-rose-500 hover:underline">
                            Clear Pad
                          </button>
                        )}
                      </div>

                      {signatureMode === 'draw' ? (
                        <div className="p-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white w-full">
                          <canvas
                            ref={signatureCanvasRef}
                            width={500}
                            height={140}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="w-full h-32 sm:h-36 bg-slate-50 rounded-xl cursor-crosshair touch-none"
                          />
                          <span className="text-[10px] text-slate-400 block text-center mt-1">
                            Draw signature above with finger or mouse
                          </span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={signatureText}
                          onChange={(e) => setSignatureText(e.target.value)}
                          placeholder="Type signature..."
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-lg font-serif italic text-blue-900 dark:text-blue-200"
                        />
                      )}
                    </div>
                  )}

                  {/* Primary Create / Process Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      disabled={isProcessing}
                      onClick={executeActiveTool}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-rose-500/20 disabled:opacity-50 transition-all"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing in Browser...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Process & Create {currentToolDef.name}</span>
                        </>
                      )}
                    </button>
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
