/**
 * High-performance PDF to Image converter.
 * Loads the PDF document once and renders all pages concurrently or sequentially.
 * Packages multi-page results into a client-side ZIP file.
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createZipArchive } from './zipUtils';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export interface RenderedPageImage {
  pageNumber: number;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

export interface PdfToImageResult {
  images: RenderedPageImage[];
  isMultiPage: boolean;
  primaryBlob: Blob;
  primaryFilename: string;
  primaryMimeType: string;
}

/**
 * Converts all pages of a PDF to high-resolution images (JPG or PNG)
 * and packages multi-page documents into a ZIP archive.
 */
export async function convertPdfToImages(
  pdfBytes: ArrayBuffer | Uint8Array,
  baseFilename: string,
  options: {
    format?: 'jpg' | 'png';
    scale?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<PdfToImageResult> {
  const format = options.format === 'png' ? 'png' : 'jpg';
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';
  const scale = options.scale || 1.8;

  const dataCopy = pdfBytes instanceof Uint8Array ? pdfBytes.slice() : new Uint8Array(pdfBytes).slice();
  const loadingTask = pdfjsLib.getDocument({ data: dataCopy });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  const renderedImages: RenderedPageImage[] = [];

  for (let p = 1; p <= totalPages; p++) {
    options.onProgress?.(p, totalPages);
    const page = await pdfDoc.getPage(p);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    // Fill white background (crucial for JPEG without transparency black-background bug)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    const dataUrl = canvas.toDataURL(mimeType, 0.92);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to convert page ${p} to blob`));
        },
        mimeType,
        0.92
      );
    });

    renderedImages.push({
      pageNumber: p,
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    });
  }

  const cleanBase = baseFilename.replace(/\.pdf$/i, '');

  if (totalPages === 1) {
    const single = renderedImages[0];
    return {
      images: renderedImages,
      isMultiPage: false,
      primaryBlob: single.blob,
      primaryFilename: `${cleanBase}-page-1.${ext}`,
      primaryMimeType: mimeType,
    };
  }

  // Multi-page document: Bundle all images into a client-side ZIP file!
  const zipFiles = await Promise.all(
    renderedImages.map(async (img) => {
      const buffer = await img.blob.arrayBuffer();
      const paddedIndex = String(img.pageNumber).padStart(String(totalPages).length, '0');
      return {
        filename: `${cleanBase}-page-${paddedIndex}.${ext}`,
        data: new Uint8Array(buffer),
      };
    })
  );

  const zipData = createZipArchive(zipFiles);
  const zipBlob = new Blob([zipData], { type: 'application/zip' });

  return {
    images: renderedImages,
    isMultiPage: true,
    primaryBlob: zipBlob,
    primaryFilename: `${cleanBase}-all-${totalPages}-pages-images.zip`,
    primaryMimeType: 'application/zip',
  };
}
