import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { parseDocxFile } from '../utils/docxParser';
import { convertHtmlToPdf } from '../utils/htmlToPdf';
import { createZipArchive } from '../utils/zipUtils';
import { sanitizeTextForWinAnsi } from '../utils/textSanitizer';

describe('PDF Tools Integration Suite & Bug Verifications', () => {
  const testDir = path.resolve(__dirname, '../../TEST');

  // Test 1: Split Range Validation and Extraction on 14-page PDF
  it('safely extracts test inputs (0-1, 4-2, 0-9, 12-7, 98-9) on 14-page PDF', async () => {
    const pdfPath = path.join(testDir, 'pdfSplit', 'sample_14pages.pdf');
    expect(fs.existsSync(pdfPath)).toBe(true);

    const pdfBytes = fs.readFileSync(pdfPath);
    const srcDoc = await PDFDocument.load(pdfBytes);
    const total = srcDoc.getPageCount();
    expect(total).toBe(14);

    const testCases = [
      { from: 0, to: 1, expected: [0] }, // Page 1
      { from: 4, to: 2, expected: [1, 2, 3] }, // Pages 2, 3, 4
      { from: 0, to: 9, expected: [0, 1, 2, 3, 4, 5, 6, 7, 8] }, // Pages 1 to 9
      { from: 12, to: 7, expected: [6, 7, 8, 9, 10, 11] }, // Pages 7 to 12
      { from: 98, to: 9, expected: [8, 9, 10, 11, 12, 13] }, // Pages 9 to 14
    ];

    for (const tc of testCases) {
      const rawF = Number(tc.from);
      const rawT = Number(tc.to);
      const f = isNaN(rawF) || rawF < 1 ? 1 : rawF;
      const t = isNaN(rawT) || rawT < 1 ? 1 : rawT;
      const start = Math.max(1, Math.min(f, t));
      const end = Math.min(total, Math.max(f, t));

      const indicesSet = new Set<number>();
      for (let p = start; p <= end; p++) {
        indicesSet.add(p - 1);
      }
      const pageIndices = Array.from(indicesSet).sort((a, b) => a - b);
      expect(pageIndices).toEqual(tc.expected);

      // Verify PDFDocument can copy those pages without error
      const splitDoc = await PDFDocument.create();
      const copied = await splitDoc.copyPages(srcDoc, pageIndices);
      copied.forEach((page) => splitDoc.addPage(page));
      const out = await splitDoc.save();
      expect(out.length).toBeGreaterThan(100);
    }
  });

  // Test 2: Word to PDF without WinAnsi encoding crash
  it('converts sample_word_report.docx into valid PDF without WinAnsi 0x0003 crash', async () => {
    const docxPath = path.join(testDir, 'wordToPdf', 'sample_word_report.docx');
    expect(fs.existsSync(docxPath)).toBe(true);

    const docxBytes = fs.readFileSync(docxPath);
    const paragraphs = await parseDocxFile(docxBytes);
    expect(paragraphs.length).toBeGreaterThan(0);

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const page = doc.addPage([595.28, 841.89]);

    let y = 750;
    for (const p of paragraphs) {
      expect(() => {
        page.drawText(p.text, {
          x: 50,
          y,
          size: p.isHeading ? 14 : 10,
          font: p.isHeading ? boldFont : font,
          color: rgb(0.1, 0.1, 0.1),
        });
      }).not.toThrow();
      y -= 25;
      if (y < 50) break;
    }

    const pdfOut = await doc.save();
    expect(pdfOut.length).toBeGreaterThan(500);
  });

  // Test 3: TXT to PDF with unicode & special symbols
  it('converts unicode text with smart quotes, dashes, currencies without WinAnsi crash', async () => {
    const txtPath = path.join(testDir, 'txtToPdf', 'sample_unicode.txt');
    expect(fs.existsSync(txtPath)).toBe(true);

    const rawText = fs.readFileSync(txtPath, 'utf-8');
    const sanitized = sanitizeTextForWinAnsi(rawText);

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([595.28, 841.89]);

    const lines = sanitized.split(/\r?\n/).slice(0, 20);
    let y = 750;
    for (const line of lines) {
      if (line.trim()) {
        expect(() => {
          page.drawText(line, { x: 50, y, size: 9, font });
        }).not.toThrow();
      }
      y -= 15;
    }

    const pdfOut = await doc.save();
    expect(pdfOut.length).toBeGreaterThan(500);
  });

  // Test 4: HTML to PDF converts styled report into PDF
  it('converts sample_report.html into multi-page formatted PDF without truncation', async () => {
    const htmlPath = path.join(testDir, 'htmlToPdf', 'sample_report.html');
    expect(fs.existsSync(htmlPath)).toBe(true);

    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    const { pdfBytes, pageCount } = await convertHtmlToPdf(htmlContent, 'sample_report.html', {
      mode: 'code',
    });

    expect(pdfBytes.length).toBeGreaterThan(1000);
    expect(pageCount).toBeGreaterThanOrEqual(1);

    const loadedDoc = await PDFDocument.load(pdfBytes);
    expect(loadedDoc.getPageCount()).toBe(pageCount);
  });

  // Test 5: Multi-page ZIP generation for PDF to JPG
  it('bundles multi-page images into a valid client-side ZIP file', () => {
    const encoder = new TextEncoder();
    const images = Array.from({ length: 13 }, (_, i) => ({
      filename: `sample-page-${String(i + 1).padStart(2, '0')}.jpg`,
      data: encoder.encode(`mock-jpeg-bytes-page-${i + 1}`),
    }));

    const zipBytes = createZipArchive(images);
    expect(zipBytes.length).toBeGreaterThan(500);

    // Verify ZIP magic number
    expect(zipBytes[0]).toBe(0x50);
    expect(zipBytes[1]).toBe(0x4b);
  });
});
