/**
 * HTML to PDF Converter.
 * 100% Client-Side In-Browser processing.
 * Supports:
 * 1. Visual Webpage Rendering (preserves CSS styles, tables, colors, badges, and layout).
 * 2. Complete Source Code Multi-Page PDF (full code without any truncation or line cutoff).
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { sanitizeTextForWinAnsi } from './textSanitizer';

export interface HtmlToPdfOptions {
  mode?: 'visual' | 'code';
  title?: string;
  pageSize?: 'A4' | 'Letter';
}

/**
 * Converts HTML content or file to PDF.
 */
export async function convertHtmlToPdf(
  htmlContent: string,
  filename: string,
  options: HtmlToPdfOptions = {}
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const mode = options.mode || 'visual';

  if (mode === 'visual' && typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const visualPdf = await renderVisualHtmlToPdf(htmlContent, filename);
      if (visualPdf) return visualPdf;
    } catch (err) {
      console.warn('[htmlToPdf] Visual rendering fell back to formatted code:', err);
    }
  }

  // Fallback or explicit 'code' mode: Render COMPLETE formatted multi-page PDF
  return renderCompleteHtmlCodeToPdf(htmlContent, filename);
}

/**
 * Visual HTML to PDF renderer using offscreen SVG foreignObject and Canvas.
 */
async function renderVisualHtmlToPdf(
  htmlContent: string,
  filename: string
): Promise<{ pdfBytes: Uint8Array; pageCount: number } | null> {
  const pageWidth = 595.28; // A4 pt
  const pageHeight = 841.89; // A4 pt
  const renderScale = 2; // High-DPI crisp rendering
  const canvasWidth = Math.floor(pageWidth * renderScale);
  const canvasHeight = Math.floor(pageHeight * renderScale);

  // Clean html string for foreignObject
  let bodyContent = htmlContent;
  let headStyles = '';

  const styleMatches = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (styleMatches) {
    headStyles = styleMatches.join('\n');
  }

  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    bodyContent = bodyMatch[1];
  } else {
    // Strip <!DOCTYPE> and <html> tags for cleaner foreignObject injection
    bodyContent = htmlContent.replace(/<!DOCTYPE[^>]*>/i, '').replace(/<html[^>]*>|<\/html>/gi, '');
  }

  const wrappedXhtml = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; color: #1e293b; padding: 40px; box-sizing: border-box; width: 100%; min-height: 100%;">
          ${headStyles}
          ${bodyContent}
        </div>
      </foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([wrappedXhtml], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(new Error('Failed to load visual SVG representation of HTML'));
    img.src = svgUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
  URL.revokeObjectURL(svgUrl);

  const jpgBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95)
  );
  if (!jpgBlob) return null;

  const jpgBuffer = await jpgBlob.arrayBuffer();
  const pdfDoc = await PDFDocument.create();
  const embeddedImage = await pdfDoc.embedJpg(jpgBuffer);

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  });

  const pdfBytes = await pdfDoc.save();
  return { pdfBytes, pageCount: 1 };
}

/**
 * Formats the COMPLETE HTML source code across multiple pages without truncating anything.
 */
async function renderCompleteHtmlCodeToPdf(
  htmlContent: string,
  filename: string
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Courier);
  const boldFont = await doc.embedFont(StandardFonts.CourierBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 40;
  const fontSize = 8.5;
  const lineHeight = 12.5;
  const startY = 780;
  const bottomMargin = 45;
  const linesPerPage = Math.floor((startY - bottomMargin) / lineHeight);

  const sanitized = sanitizeTextForWinAnsi(htmlContent);
  const rawLines = sanitized.split(/\r?\n/);

  // Wrap long code lines
  const maxCharsPerLine = 82;
  const wrappedLines: { lineNum: number; text: string; isContinuation: boolean }[] = [];

  rawLines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (line.length <= maxCharsPerLine) {
      wrappedLines.push({ lineNum, text: line, isContinuation: false });
    } else {
      let rem = line;
      let first = true;
      while (rem.length > maxCharsPerLine) {
        wrappedLines.push({
          lineNum,
          text: rem.substring(0, maxCharsPerLine),
          isContinuation: !first,
        });
        rem = rem.substring(maxCharsPerLine);
        first = false;
      }
      if (rem.length > 0) {
        wrappedLines.push({ lineNum, text: rem, isContinuation: true });
      }
    }
  });

  const totalPages = Math.max(1, Math.ceil(wrappedLines.length / linesPerPage));

  for (let p = 0; p < totalPages; p++) {
    const page = doc.addPage([pageWidth, pageHeight]);
    const chunk = wrappedLines.slice(p * linesPerPage, (p + 1) * linesPerPage);

    // Header bar
    page.drawText(`${filename} (HTML Code)`, {
      x: marginX,
      y: 810,
      size: 9,
      font: boldFont,
      color: rgb(0.2, 0.25, 0.3),
    });

    page.drawText(`Page ${p + 1} of ${totalPages}`, {
      x: pageWidth - marginX - 60,
      y: 810,
      size: 9,
      font,
      color: rgb(0.5, 0.55, 0.6),
    });

    page.drawLine({
      start: { x: marginX, y: 800 },
      end: { x: pageWidth - marginX, y: 800 },
      thickness: 0.8,
      color: rgb(0.85, 0.88, 0.92),
    });

    // Draw lines
    let curY = startY;
    for (const item of chunk) {
      // Line number gutter
      const numStr = item.isContinuation ? '    ' : String(item.lineNum).padStart(4, ' ');
      page.drawText(numStr, {
        x: marginX,
        y: curY,
        size: fontSize,
        font,
        color: rgb(0.6, 0.65, 0.7),
      });

      // Code text
      page.drawText(item.text, {
        x: marginX + 32,
        y: curY,
        size: fontSize,
        font,
        color: rgb(0.12, 0.15, 0.18),
      });

      curY -= lineHeight;
    }
  }

  const pdfBytes = await doc.save();
  return { pdfBytes, pageCount: totalPages };
}
