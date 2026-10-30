import { LucideIcon } from 'lucide-react';

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

export interface ToolDef {
  id: PdfToolId;
  name: string;
  desc: string;
  category: 'Organize' | 'Optimize' | 'Convert to PDF' | 'Convert from PDF' | 'Edit' | 'Security';
  icon: LucideIcon;
  color: string;
  badge?: string;
}

export interface ProcessedResult {
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

export interface PdfPageMeta {
  pageNumber: number;
  width: number;
  height: number;
  isLandscape: boolean;
}

export interface PdfToolWorkspaceProps {
  onBackToCatalogue: () => void;
  onSuccess: (result: ProcessedResult) => void;
  initialFiles?: File[];
}
