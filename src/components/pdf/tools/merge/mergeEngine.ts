import { PDFDocument } from 'pdf-lib';

export interface MergeResult {
  success: boolean;
  bytes?: Uint8Array;
  error?: string;
}

/**
 * Client-side PDF merger.
 * Combines multiple PDF files in given sequence into a single PDF document.
 */
export async function mergePdfDocuments(files: File[]): Promise<MergeResult> {
  if (files.length === 0) {
    return {
      success: false,
      error: 'Please select at least one PDF file to merge.',
    };
  }

  try {
    const mergedDoc = await PDFDocument.create();

    for (const item of files) {
      const bytes = await item.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => mergedDoc.addPage(p));
    }

    const outBytes = await mergedDoc.save();
    return {
      success: true,
      bytes: outBytes,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to merge PDF files',
    };
  }
}
