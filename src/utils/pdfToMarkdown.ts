/**
 * PDF to Markdown & Structured Text Extractor.
 * Uses PDF.js to extract text accurately from compressed streams.
 * Reconstructs lines, paragraphs, and headings into standard Markdown syntax.
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface TextItemInfo {
  text: string;
  x: number;
  y: number;
  height: number;
  hasEol: boolean;
}

/**
 * Extracts clean structured Markdown from PDF bytes.
 */
export async function convertPdfToMarkdown(
  pdfBytes: ArrayBuffer | Uint8Array,
  documentTitle = 'Document'
): Promise<string> {
  const dataCopy = pdfBytes instanceof Uint8Array ? pdfBytes.slice() : new Uint8Array(pdfBytes).slice();
  const loadingTask = pdfjsLib.getDocument({ data: dataCopy });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  const markdownParts: string[] = [];
  markdownParts.push(`# ${documentTitle.replace(/\.pdf$/i, '')}\n`);

  for (let p = 1; p <= totalPages; p++) {
    const page = await pdfDoc.getPage(p);
    const textContent = await page.getTextContent();
    const items: TextItemInfo[] = [];

    for (const item of textContent.items) {
      if ('str' in item && typeof item.str === 'string') {
        const str = item.str.trim();
        if (!str) continue;
        const transform = item.transform; // [scaleX, skewY, skewX, scaleY, x, y]
        const x = transform ? transform[4] : 0;
        const y = transform ? transform[5] : 0;
        const height = item.height || Math.abs(transform ? transform[0] : 10);
        items.push({
          text: item.str,
          x,
          y,
          height,
          hasEol: Boolean(item.hasEOL),
        });
      }
    }

    if (items.length === 0) continue;

    // Sort items by Y descending (top to bottom), then by X ascending (left to right)
    items.sort((a, b) => {
      if (Math.abs(b.y - a.y) > 4) {
        return b.y - a.y;
      }
      return a.x - b.x;
    });

    // Group items into lines
    const lines: { text: string; avgHeight: number }[] = [];
    let currentLineItems: TextItemInfo[] = [];
    let currentY: number | null = null;

    for (const item of items) {
      if (currentY === null || Math.abs(item.y - currentY) <= 4) {
        currentLineItems.push(item);
        currentY = item.y;
      } else {
        // Finalize previous line
        if (currentLineItems.length > 0) {
          const lineStr = currentLineItems.map((i) => i.text).join(' ').trim();
          const avgHeight =
            currentLineItems.reduce((acc, i) => acc + i.height, 0) / currentLineItems.length;
          if (lineStr) lines.push({ text: lineStr, avgHeight });
        }
        currentLineItems = [item];
        currentY = item.y;
      }
    }
    if (currentLineItems.length > 0) {
      const lineStr = currentLineItems.map((i) => i.text).join(' ').trim();
      const avgHeight =
        currentLineItems.reduce((acc, i) => acc + i.height, 0) / currentLineItems.length;
      if (lineStr) lines.push({ text: lineStr, avgHeight });
    }

    // Format page lines into Markdown
    if (totalPages > 1) {
      markdownParts.push(`\n---\n*Page ${p} of ${totalPages}*\n`);
    }

    for (const line of lines) {
      const t = line.text;
      if (line.avgHeight >= 18) {
        markdownParts.push(`\n## ${t}\n`);
      } else if (line.avgHeight >= 14) {
        markdownParts.push(`\n### ${t}\n`);
      } else if (t.startsWith('•') || t.startsWith('-') || t.startsWith('*')) {
        markdownParts.push(`- ${t.replace(/^[•\-*]\s*/, '')}`);
      } else {
        markdownParts.push(t);
      }
    }
  }

  markdownParts.push('\n\n---\n*Extracted via MultiTools Client-Side PDF Privacy Engine*');
  return markdownParts.join('\n');
}
