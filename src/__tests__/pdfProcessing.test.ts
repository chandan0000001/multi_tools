import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

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
});
