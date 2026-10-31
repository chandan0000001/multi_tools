import { PDFDocument } from 'pdf-lib';

export interface ImageToConvert {
  file?: File;
  name: string;
  size: number;
  bytes?: Uint8Array;
  dataUrl?: string;
}

export interface JpgToPdfOptions {
  orientation: 'portrait' | 'landscape';
  pageSize: 'a4' | 'letter' | 'fit';
  margin: 'none' | 'small' | 'big';
}

export interface JpgToPdfResult {
  success: boolean;
  bytes?: Uint8Array;
  error?: string;
}

/**
 * Universal safe image reader and PNG converter.
 * Reads image data directly from in-memory bytes or dataUrl to prevent Android/Mobile
 * "NotReadableError: The requested file could not be read, typically due to permission problems"
 * that occurs when Android ContentProvider temporary file references expire or get revoked.
 */
export async function convertImageToPngBytes(
  item: ImageToConvert
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  let srcUrl = item.dataUrl || '';
  let objectUrlToRevoke = '';

  if (!srcUrl && item.bytes && item.bytes.length > 0) {
    const blob = new Blob([item.bytes]);
    srcUrl = URL.createObjectURL(blob);
    objectUrlToRevoke = srcUrl;
  } else if (!srcUrl && item.file) {
    try {
      const ab = await item.file.arrayBuffer();
      const blob = new Blob([ab]);
      srcUrl = URL.createObjectURL(blob);
      objectUrlToRevoke = srcUrl;
    } catch {
      srcUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Failed to read file ${item.name}`));
        reader.readAsDataURL(item.file!);
      });
    }
  }

  if (!srcUrl) {
    throw new Error(`Unable to read image data for ${item.name}`);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const cleanup = () => {
      if (objectUrlToRevoke) {
        try {
          URL.revokeObjectURL(objectUrlToRevoke);
        } catch {
          // ignore
        }
      }
    };

    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width || 800;
        const h = img.naturalHeight || img.height || 600;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(async (blob) => {
          cleanup();
          if (!blob) {
            reject(new Error(`Failed to encode image ${item.name} to PNG`));
            return;
          }
          const ab = await blob.arrayBuffer();
          resolve({
            bytes: new Uint8Array(ab),
            width: w,
            height: h,
          });
        }, 'image/png');
      } catch (e) {
        cleanup();
        reject(e);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error(`Failed to decode image file ${item.name}`));
    };

    img.src = srcUrl;
  });
}

/**
 * Client-side multi-image to PDF compiler.
 * Converts any combination of JPEG, PNG, WebP, GIF, BMP into a standardized PDF.
 */
export async function convertImagesToPdf(
  items: ImageToConvert[],
  options: JpgToPdfOptions
): Promise<JpgToPdfResult> {
  if (items.length === 0) {
    return { success: false, error: 'No images provided for PDF conversion.' };
  }

  try {
    const doc = await PDFDocument.create();

    for (const item of items) {
      const { bytes: pngBytes } = await convertImageToPngBytes(item);
      const img = await doc.embedPng(pngBytes);

      let pageWidth = img.width;
      let pageHeight = img.height;

      if (options.pageSize === 'a4') {
        pageWidth = 595.28;
        pageHeight = 841.89;
      } else if (options.pageSize === 'letter') {
        pageWidth = 612;
        pageHeight = 792;
      }

      if (options.orientation === 'landscape' && pageWidth < pageHeight) {
        const tmp = pageWidth;
        pageWidth = pageHeight;
        pageHeight = tmp;
      } else if (options.orientation === 'portrait' && pageWidth > pageHeight) {
        const tmp = pageWidth;
        pageWidth = pageHeight;
        pageHeight = tmp;
      }

      const margin = options.margin === 'small' ? 20 : options.margin === 'big' ? 40 : 0;
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

    const outBytes = await doc.save();
    return {
      success: true,
      bytes: outBytes,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to convert images to PDF',
    };
  }
}
