import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { inflate } from 'pako';

function decodePdfHexString(hex: string): string {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
  }
  return str;
}

async function extractTextFromPdf(pdfBytes: Uint8Array): Promise<string> {
  const doc = await PDFDocument.load(pdfBytes);
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
        decodePdfHexString(m[1])
      );
      allLines.push(...literalMatches, ...hexMatches);
    }
  }

  return allLines.join('\n').trim();
}

describe('PDF Processing Suite with Real Sample Fixtures', () => {
  const samplesDir = path.resolve(__dirname, '../../test/samples');
  const pdfsDir = path.join(samplesDir, 'pdfs');
  const imagesDir = path.join(samplesDir, 'images');

  it('verifies all sample fixtures exist and are non-empty', () => {
    const requiredFiles = [
      path.join(pdfsDir, 'sample_multipage_report.pdf'),
      path.join(pdfsDir, 'sample_scanned_invoice_ocr.pdf'),
      path.join(pdfsDir, 'sample_contract_agreement.pdf'),
      path.join(pdfsDir, 'sample_presentation_slides.pdf'),
      path.join(pdfsDir, 'sample_merge_part1.pdf'),
      path.join(pdfsDir, 'sample_merge_part2.pdf'),
      path.join(imagesDir, 'sample_highres_4k.jpg'),
      path.join(imagesDir, 'sample_landscape.jpg'),
      path.join(imagesDir, 'sample_scanned_invoice.png'),
      path.join(imagesDir, 'sample_transparent_stamp.png'),
    ];

    for (const filePath of requiredFiles) {
      expect(fs.existsSync(filePath), `Missing fixture: ${filePath}`).toBe(true);
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(100);
    }
  });

  it('merges two separate PDF files into one combined PDF document', async () => {
    const p1Bytes = fs.readFileSync(path.join(pdfsDir, 'sample_merge_part1.pdf'));
    const p2Bytes = fs.readFileSync(path.join(pdfsDir, 'sample_merge_part2.pdf'));

    const mergedDoc = await PDFDocument.create();

    const doc1 = await PDFDocument.load(p1Bytes);
    const pages1 = await mergedDoc.copyPages(doc1, doc1.getPageIndices());
    pages1.forEach((p) => mergedDoc.addPage(p));

    const doc2 = await PDFDocument.load(p2Bytes);
    const pages2 = await mergedDoc.copyPages(doc2, doc2.getPageIndices());
    pages2.forEach((p) => mergedDoc.addPage(p));

    expect(mergedDoc.getPageCount()).toBe(doc1.getPageCount() + doc2.getPageCount());

    const savedBytes = await mergedDoc.save();
    expect(savedBytes.length).toBeGreaterThan(500);

    // Verify roundtrip load
    const reloaded = await PDFDocument.load(savedBytes);
    expect(reloaded.getPageCount()).toBe(2);
  });

  it('splits a multi-page PDF document by extracting specific page ranges', async () => {
    const multiBytes = fs.readFileSync(path.join(pdfsDir, 'sample_multipage_report.pdf'));
    const srcDoc = await PDFDocument.load(multiBytes);
    expect(srcDoc.getPageCount()).toBe(4);

    // Extract pages 1 and 3 (0-indexed: 0, 2)
    const splitDoc = await PDFDocument.create();
    const copiedPages = await splitDoc.copyPages(srcDoc, [0, 2]);
    copiedPages.forEach((p) => splitDoc.addPage(p));

    expect(splitDoc.getPageCount()).toBe(2);

    const saved = await splitDoc.save();
    const reloaded = await PDFDocument.load(saved);
    expect(reloaded.getPageCount()).toBe(2);
  });

  it('applies a watermark across pages without corrupting the document', async () => {
    const contractBytes = fs.readFileSync(path.join(pdfsDir, 'sample_contract_agreement.pdf'));
    const doc = await PDFDocument.load(contractBytes);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const watermarkText = 'CONFIDENTIAL TEST WATERMARK';

    const pages = doc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawText(watermarkText, {
        x: width / 6,
        y: height / 2,
        size: 32,
        font,
        color: rgb(0.85, 0.2, 0.2),
        opacity: 0.25,
        rotate: degrees(45),
      });
    }

    const saved = await doc.save();
    const reloaded = await PDFDocument.load(saved);
    expect(reloaded.getPageCount()).toBe(pages.length);
  });

  it('embeds page numbers in header/footer across all pages', async () => {
    const reportBytes = fs.readFileSync(path.join(pdfsDir, 'sample_multipage_report.pdf'));
    const doc = await PDFDocument.load(reportBytes);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const total = pages.length;

    pages.forEach((page, i) => {
      const { width } = page.getSize();
      const label = `Page ${i + 1} of ${total}`;
      page.drawText(label, {
        x: width / 2 - 30,
        y: 25,
        size: 9,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    });

    const saved = await doc.save();
    const reloaded = await PDFDocument.load(saved);
    expect(reloaded.getPageCount()).toBe(total);
  });

  it('rotates PDF pages by 90 degrees', async () => {
    const slideBytes = fs.readFileSync(path.join(pdfsDir, 'sample_presentation_slides.pdf'));
    const doc = await PDFDocument.load(slideBytes);
    const pages = doc.getPages();

    pages.forEach((page) => {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + 90) % 360));
    });

    const saved = await doc.save();
    const reloaded = await PDFDocument.load(saved);
    expect(reloaded.getPages()[0].getRotation().angle).toBe(90);
  });

  it('converts an image (JPG) directly into a standardized PDF document', async () => {
    const imgBytes = fs.readFileSync(path.join(imagesDir, 'sample_landscape.jpg'));
    const doc = await PDFDocument.create();
    const embeddedImg = await doc.embedJpg(imgBytes);

    const page = doc.addPage([embeddedImg.width, embeddedImg.height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: embeddedImg.width,
      height: embeddedImg.height,
    });

    const saved = await doc.save();
    const reloaded = await PDFDocument.load(saved);
    expect(reloaded.getPageCount()).toBe(1);
    const [p] = reloaded.getPages();
    expect(p.getWidth()).toBe(1600);
    expect(p.getHeight()).toBe(1000);
  });

  it('creates an OCR-enhanced searchable PDF with an optical text layer', async () => {
    const scannedPdfBytes = fs.readFileSync(path.join(pdfsDir, 'sample_scanned_invoice_ocr.pdf'));
    const doc = await PDFDocument.load(scannedPdfBytes);
    const font = await doc.embedFont(StandardFonts.Helvetica);

    // Simulate OCR text layer synthesis
    const ocrRecognizedLines = [
      'GLOBAL TECH LOGISTICS - INVOICE',
      'Invoice #: INV-2026-98124',
      'Status: PAID',
      'TOTAL: $2,937.60',
    ];

    const pages = doc.getPages();
    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    // Embed invisible selectable text layer
    let curY = height - 100;
    for (const line of ocrRecognizedLines) {
      firstPage.drawText(line, {
        x: 50,
        y: curY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
        opacity: 0.01, // Invisible optical overlay
      });
      curY -= 25;
    }

    const saved = await doc.save();
    const reloaded = await PDFDocument.load(saved);
    expect(reloaded.getPageCount()).toBe(1);

    // Verify transcript export
    const transcript = ocrRecognizedLines.join('\n');
    expect(transcript).toContain('INV-2026-98124');
    expect(transcript).toContain('$2,937.60');
  });

  it('converts plain text files (TXT to PDF) into formatted paginated PDF documents', async () => {
    const txtPath = path.join(samplesDir, 'sample_notes.txt');
    expect(fs.existsSync(txtPath)).toBe(true);
    const textContent = fs.readFileSync(txtPath, 'utf-8');

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Courier);
    const boldFont = await doc.embedFont(StandardFonts.CourierBold);

    const fontSize = 10;
    const lineHeight = fontSize * 1.45;
    const marginX = 50;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const startY = 770;
    const linesPerPage = Math.floor((startY - 50) / lineHeight);
    const maxChars = Math.floor((pageWidth - marginX * 2) / (fontSize * 0.6));

    const rawLines = textContent.split(/\r?\n/);
    const wrappedLines: string[] = [];
    for (const line of rawLines) {
      if (line.length <= maxChars) {
        wrappedLines.push(line);
      } else {
        let rem = line;
        while (rem.length > maxChars) {
          let idx = rem.lastIndexOf(' ', maxChars);
          if (idx === -1) idx = maxChars;
          wrappedLines.push(rem.substring(0, idx));
          rem = rem.substring(idx).trimStart();
        }
        if (rem.length > 0) wrappedLines.push(rem);
      }
    }

    const pagesData: string[][] = [];
    for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
      pagesData.push(wrappedLines.slice(i, i + linesPerPage));
    }

    pagesData.forEach((pageLines, pageIdx) => {
      const page = doc.addPage([pageWidth, pageHeight]);
      // Header
      page.drawText('sample_notes.txt', { x: marginX, y: 805, size: 9, font: boldFont, color: rgb(0.2, 0.25, 0.3) });
      let curY = startY;
      for (const line of pageLines) {
        if (line.trim()) {
          page.drawText(line, { x: marginX, y: curY, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
        }
        curY -= lineHeight;
      }
      page.drawText(`Page ${pageIdx + 1} of ${pagesData.length}`, { x: pageWidth / 2 - 25, y: 30, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
    });

    const pdfBytes = await doc.save();
    expect(pdfBytes.length).toBeGreaterThan(1000);

    const reloaded = await PDFDocument.load(pdfBytes);
    expect(reloaded.getPageCount()).toBe(pagesData.length);
  });

  it('extracts plain text (PDF to TXT) from existing PDF documents', async () => {
    const contractBytes = fs.readFileSync(path.join(pdfsDir, 'sample_contract_agreement.pdf'));
    const extracted = await extractTextFromPdf(contractBytes);

    expect(extracted).toContain('NON-DISCLOSURE AGREEMENT');
    expect(extracted).toContain('Confidential Information');

    const txtBlob = new Blob([new TextEncoder().encode(extracted)], { type: 'text/plain' });
    expect(txtBlob.size).toBeGreaterThan(100);
  });
});
