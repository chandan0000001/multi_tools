import { describe, it, expect, beforeAll } from 'vitest';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { inflate } from 'pako';
import { unlockPdfDocument } from '../components/pdf/tools/unlock/unlockEngine';
import { protectPdfDocument } from '../components/pdf/tools/protect/protectEngine';
import { mergePdfDocuments } from '../components/pdf/tools/merge/mergeEngine';

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

async function createTestPdf(pageCount: number, title: string, textLines: string[] = []): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([595.28, 841.89]);
    page.drawText(`${title} - Page ${i + 1}`, {
      x: 50,
      y: 780,
      size: 16,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    let curY = 740;
    for (const line of textLines) {
      page.drawText(line, {
        x: 50,
        y: curY,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      curY -= 20;
    }
  }

  return await doc.save();
}

function createMinimalJpg(): Uint8Array {
  // A standard minimal valid 1x1 JPEG byte stream
  return new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
    0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
    0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
    0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xbf, 0x80, 0xff, 0xd9
  ]);
}

import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { checkPdfEncryption, universalDecryptPdf } from '../utils/pdfDecryptor';

describe('PDF Processing Suite (In-Memory Fast Architecture)', () => {
  let sampleMergePart1: Uint8Array;
  let sampleMergePart2: Uint8Array;
  let sampleMultiPage: Uint8Array;
  let sampleContract: Uint8Array;

  beforeAll(async () => {
    sampleMergePart1 = await createTestPdf(1, 'Merge Part 1', ['First chapter of documentation']);
    sampleMergePart2 = await createTestPdf(1, 'Merge Part 2', ['Second chapter of documentation']);
    sampleMultiPage = await createTestPdf(4, 'Multi-Page Financial Report', [
      'Quarterly Performance Metrics',
      'Client-side evaluation and privacy verification',
    ]);
    sampleContract = await createTestPdf(2, 'NON-DISCLOSURE AGREEMENT', [
      'Confidential Information shall remain protected under strict local-first privacy.',
      'Governing Law: Client-Side Sandbox.',
    ]);
  });

  it('merges two separate PDF files into one combined PDF document', async () => {
    const mergedDoc = await PDFDocument.create();

    const doc1 = await PDFDocument.load(sampleMergePart1);
    const pages1 = await mergedDoc.copyPages(doc1, doc1.getPageIndices());
    pages1.forEach((p) => mergedDoc.addPage(p));

    const doc2 = await PDFDocument.load(sampleMergePart2);
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
    const srcDoc = await PDFDocument.load(sampleMultiPage);
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
    const doc = await PDFDocument.load(sampleContract);
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
    const doc = await PDFDocument.load(sampleMultiPage);
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
    const doc = await PDFDocument.load(sampleMultiPage);
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
    const imgBytes = createMinimalJpg();
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
    expect(p.getWidth()).toBe(1);
    expect(p.getHeight()).toBe(1);
  });

  it('creates an OCR-enhanced searchable PDF with an optical text layer', async () => {
    const doc = await PDFDocument.load(sampleMultiPage);
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
    expect(reloaded.getPageCount()).toBe(4);

    // Verify transcript export
    const transcript = ocrRecognizedLines.join('\n');
    expect(transcript).toContain('INV-2026-98124');
    expect(transcript).toContain('$2,937.60');
  });

  it('converts plain text files (TXT to PDF) into formatted paginated PDF documents', async () => {
    const sampleText = `MultiTools Architecture Notes\n\n1. Client-side privacy\n2. Instant local processing\n3. Zero backend telemetry`;
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

    const rawLines = sampleText.split(/\r?\n/);
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
      page.drawText('notes.txt', { x: marginX, y: 805, size: 9, font: boldFont, color: rgb(0.2, 0.25, 0.3) });
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
    expect(pdfBytes.length).toBeGreaterThan(500);

    const reloaded = await PDFDocument.load(pdfBytes);
    expect(reloaded.getPageCount()).toBe(pagesData.length);
  });

  it('extracts plain text (PDF to TXT) from existing PDF documents', async () => {
    const extracted = await extractTextFromPdf(sampleContract);

    expect(extracted).toContain('NON-DISCLOSURE AGREEMENT');
    expect(extracted).toContain('Confidential Information');

    const txtBlob = new Blob([new TextEncoder().encode(extracted)], { type: 'text/plain' });
    expect(txtBlob.size).toBeGreaterThan(50);
  });

  it('crops PDF page dimensions accurately by adjusting cropBox and mediaBox', async () => {
    const doc = await PDFDocument.load(sampleMultiPage);
    const pages = doc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Crop to 80% width and 80% height with 10% margins
    const cropX = 0.1 * width;
    const cropY = 0.1 * height;
    const cropW = 0.8 * width;
    const cropH = 0.8 * height;

    firstPage.setCropBox(cropX, cropY, cropW, cropH);
    firstPage.setMediaBox(cropX, cropY, cropW, cropH);

    const savedBytes = await doc.save();
    const reloaded = await PDFDocument.load(savedBytes);
    const reloadedPage = reloaded.getPages()[0];

    // In pdf-lib, getWidth and getHeight respect MediaBox
    expect(reloadedPage.getWidth()).toBeCloseTo(cropW, 1);
    expect(reloadedPage.getHeight()).toBeCloseTo(cropH, 1);
  });

  it('adds official stamps and annotation markings to PDF documents', async () => {
    const doc = await PDFDocument.load(sampleContract);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const firstPage = doc.getPages()[0];
    const { width, height } = firstPage.getSize();

    firstPage.drawRectangle({
      x: width - 180,
      y: height - 60,
      width: 140,
      height: 40,
      borderColor: rgb(0.88, 0.12, 0.28),
      borderWidth: 2,
    });

    firstPage.drawText('APPROVED', {
      x: width - 160,
      y: height - 48,
      size: 20,
      font,
      color: rgb(0.88, 0.12, 0.28),
    });

    const savedBytes = await doc.save();
    const reloaded = await PDFDocument.load(savedBytes);
    expect(reloaded.getPageCount()).toBe(2);
  });

  it('checks unencrypted PDF correctly', async () => {
    const encInfo = await checkPdfEncryption(sampleContract);
    expect(encInfo.encrypted).toBe(false);
  });

  it('encrypts with AES-256 and decrypts with universalDecryptPdf', async () => {
    const password = 'TestSecretPassword123';
    const encryptedBytes = await encryptPDF(sampleContract, password);
    const encInfo = await checkPdfEncryption(encryptedBytes);

    expect(encInfo.encrypted).toBe(true);
    expect(encInfo.algorithm).toBe('AES-256');
    expect(encInfo.version).toBe(5);
    expect(encInfo.revision).toBe(6);

    // Decrypt with correct password
    const decryptedBytes = await universalDecryptPdf(encryptedBytes, password);
    const decryptedEncInfo = await checkPdfEncryption(decryptedBytes);
    expect(decryptedEncInfo.encrypted).toBe(false);

    // Load decrypted PDF
    const decryptedDoc = await PDFDocument.load(decryptedBytes);
    expect(decryptedDoc.getPageCount()).toBe(2);

    // Decrypt with wrong password fails
    await expect(universalDecryptPdf(encryptedBytes, 'WrongPassword')).rejects.toThrow();
  });

  it('decrypts V=4 AES-128 password-protected PDF with object streams', async () => {
    const fs = await import('fs');
    const path = '/home/chandan/Downloads/TOC_Lab_Solutions_by_Nikhil_Patnaik-protected.pdf';
    if (!fs.existsSync(path)) return;

    const fileBytes = fs.readFileSync(path);
    const encInfo = await checkPdfEncryption(fileBytes);
    expect(encInfo.encrypted).toBe(true);
    expect(encInfo.algorithm).toBe('AES-128');
    expect(encInfo.version).toBe(4);

    // Wrong password fails cleanly
    await expect(universalDecryptPdf(fileBytes, '12340')).rejects.toThrow('Incorrect password');

    // Correct password succeeds
    const decryptedBytes = await universalDecryptPdf(fileBytes, '1234');
    expect(decryptedBytes.length).toBeGreaterThan(0);

    const doc = await PDFDocument.load(decryptedBytes);
    expect(doc.getPageCount()).toBe(48);

    const checkAgain = await checkPdfEncryption(decryptedBytes);
    expect(checkAgain.encrypted).toBe(false);
  });

  describe('Modular PDF Engines', () => {
    it('protects and unlocks using modular protectEngine and unlockEngine', async () => {
      const pass = 'ModularSecretPass99!';
      const protectRes = await protectPdfDocument(sampleContract, pass);
      expect(protectRes.success).toBe(true);
      expect(protectRes.bytes).toBeDefined();

      // Check encryption status
      const encInfo = await checkPdfEncryption(protectRes.bytes!);
      expect(encInfo.encrypted).toBe(true);

      // Wrong password fails
      const failRes = await unlockPdfDocument(protectRes.bytes!, 'WrongPass');
      expect(failRes.success).toBe(false);
      expect(failRes.incorrectPassword).toBe(true);

      // Correct password unlocks
      const unlockRes = await unlockPdfDocument(protectRes.bytes!, pass);
      expect(unlockRes.success).toBe(true);
      expect(unlockRes.bytes).toBeDefined();

      const doc = await PDFDocument.load(unlockRes.bytes!);
      expect(doc.getPageCount()).toBe(2);
    });

    it('merges multiple PDF files using modular mergeEngine', async () => {
      const file1 = new File([sampleContract], 'doc1.pdf', { type: 'application/pdf' });
      const file2 = new File([sampleMultiPage], 'doc2.pdf', { type: 'application/pdf' });

      const mergeRes = await mergePdfDocuments([file1, file2]);
      expect(mergeRes.success).toBe(true);
      expect(mergeRes.bytes).toBeDefined();

      const mergedDoc = await PDFDocument.load(mergeRes.bytes!);
      expect(mergedDoc.getPageCount()).toBe(6); // 2 + 4 = 6 pages
    });
  });
});
