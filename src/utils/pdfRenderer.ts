import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export interface RenderedPageThumbnail {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Render a specific page of a PDF document as an image data URL (thumbnail)
 */
export async function renderPdfPageThumbnail(
  pdfData: ArrayBuffer | Uint8Array,
  pageNumber: number,
  scale = 0.6
): Promise<string> {
  try {
    const dataCopy = pdfData instanceof Uint8Array ? pdfData.slice() : new Uint8Array(pdfData).slice();
    const loadingTask = pdfjsLib.getDocument({
      data: dataCopy,
    });

    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNumber);

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    return canvas.toDataURL('image/webp', 0.85);
  } catch (err) {
    console.warn(`[pdfRenderer] Could not render page ${pageNumber} thumbnail:`, err);
    return '';
  }
}

/**
 * Get total page count of a PDF document quickly
 */
export async function getPdfPageCount(pdfData: ArrayBuffer | Uint8Array): Promise<number> {
  try {
    const dataCopy = pdfData instanceof Uint8Array ? pdfData.slice() : new Uint8Array(pdfData).slice();
    const loadingTask = pdfjsLib.getDocument({
      data: dataCopy,
    });
    const pdf = await loadingTask.promise;
    return pdf.numPages;
  } catch (err) {
    console.warn('[pdfRenderer] Error getting page count:', err);
    return 1;
  }
}
