import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const outDir = path.resolve('test/samples/pdfs');
fs.mkdirSync(outDir, { recursive: true });

async function createSamplePdfs() {
  // ==========================================
  // 1. MULTI-PAGE REPORT (4 Pages)
  // ==========================================
  {
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Page 1: Cover / Exec Summary
    const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
    page1.drawRectangle({
      x: 0,
      y: 760,
      width: 595.28,
      height: 81.89,
      color: rgb(0.08, 0.13, 0.24),
    });
    page1.drawText('MULTI_TOOLS PLATFORM SPECIFICATION', {
      x: 50,
      y: 790,
      size: 20,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    page1.drawText('Document ID: SPEC-2026-V1.0  |  Classification: Public Technical Report', {
      x: 50,
      y: 730,
      size: 10,
      font: helvetica,
      color: rgb(0.4, 0.45, 0.5),
    });

    page1.drawText('1. Executive Overview', {
      x: 50,
      y: 690,
      size: 16,
      font: helveticaBold,
      color: rgb(0.1, 0.15, 0.2),
    });

    page1.drawText(
      'Multi_Tools delivers a high-performance, browser-first utility suite eliminating the need for remote cloud processing.\n' +
      'Every operation including PDF manipulation, OCR text layer recognition, image optimization, and hashing\n' +
      'is executed entirely within client memory sandbox without external telemetry or data retention.',
      {
        x: 50,
        y: 650,
        size: 11,
        font: helvetica,
        color: rgb(0.2, 0.25, 0.3),
        lineHeight: 18,
      }
    );

    // Page 2: Architecture & Table
    const page2 = pdfDoc.addPage([595.28, 841.89]);
    page2.drawText('2. Component Architecture', {
      x: 50,
      y: 800,
      size: 16,
      font: helveticaBold,
      color: rgb(0.1, 0.15, 0.2),
    });
    page2.drawText(
      'The platform separates consumer tools from developer-focused utilities while adhering to standard security baselines:',
      { x: 50, y: 775, size: 11, font: helvetica, color: rgb(0.3, 0.35, 0.4) }
    );

    // Table Header
    page2.drawRectangle({ x: 50, y: 720, width: 495, height: 25, color: rgb(0.9, 0.93, 0.97) });
    page2.drawText('Module', { x: 60, y: 728, size: 10, font: helveticaBold, color: rgb(0.1, 0.15, 0.2) });
    page2.drawText('Execution Model', { x: 180, y: 728, size: 10, font: helveticaBold, color: rgb(0.1, 0.15, 0.2) });
    page2.drawText('Cache Policy', { x: 340, y: 728, size: 10, font: helveticaBold, color: rgb(0.1, 0.15, 0.2) });
    page2.drawText('Status', { x: 470, y: 728, size: 10, font: helveticaBold, color: rgb(0.1, 0.15, 0.2) });

    const rows = [
      ['PDF 31 Suite', 'Client-side pdf-lib WebAssembly', 'Ephemeral In-Memory', 'Operational'],
      ['Optical OCR Engine', 'Browser Canvas & Glyph Mapping', 'Session Local', 'Operational'],
      ['Image Studio', 'HTML5 Canvas 2D Context', '24h Expiry TTL', 'Operational'],
      ['Dev Regex & JSON', 'Local V8 Runtime Engine', 'Secure Session Only', 'Operational'],
    ];

    let rowY = 690;
    for (const r of rows) {
      page2.drawLine({ start: { x: 50, y: rowY + 20 }, end: { x: 545, y: rowY + 20 }, color: rgb(0.85, 0.88, 0.92) });
      page2.drawText(r[0], { x: 60, y: rowY + 5, size: 9, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
      page2.drawText(r[1], { x: 180, y: rowY + 5, size: 9, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
      page2.drawText(r[2], { x: 340, y: rowY + 5, size: 9, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
      page2.drawText(r[3], { x: 470, y: rowY + 5, size: 9, font: helveticaBold, color: rgb(0.05, 0.6, 0.3) });
      rowY -= 30;
    }

    // Page 3: Security & Privacy
    const page3 = pdfDoc.addPage([595.28, 841.89]);
    page3.drawText('3. Zero-Knowledge Privacy Standard', {
      x: 50,
      y: 800,
      size: 16,
      font: helveticaBold,
      color: rgb(0.1, 0.15, 0.2),
    });
    page3.drawText(
      'Security Exception Rules:\n' +
      '• Passwords and encryption keys are strictly omitted from localStorage persistence.\n' +
      '• Uploaded PDF documents, scanned images, and signatures stay within RAM.\n' +
      '• Temporary object URLs are revoked upon tool reset.\n' +
      '• 24-Hour TTL automatically invalidates non-sensitive calculation history.',
      {
        x: 50,
        y: 740,
        size: 11,
        font: helvetica,
        color: rgb(0.25, 0.3, 0.35),
        lineHeight: 22,
      }
    );

    // Page 4: Conclusion & Sign-Off
    const page4 = pdfDoc.addPage([595.28, 841.89]);
    page4.drawText('4. System Verification & Sign-Off', {
      x: 50,
      y: 800,
      size: 16,
      font: helveticaBold,
      color: rgb(0.1, 0.15, 0.2),
    });
    page4.drawText(
      'This multi-page document confirms full test compatibility for Split PDF, Merge PDF, Organize PDF, Page Numbers,\n' +
      'Watermarking, and Markdown extraction. All pages have been compiled according to ISO 32000-1 specifications.',
      {
        x: 50,
        y: 750,
        size: 10,
        font: helvetica,
        color: rgb(0.3, 0.35, 0.4),
        lineHeight: 18,
      }
    );
    page4.drawRectangle({ x: 50, y: 640, width: 220, height: 70, borderColor: rgb(0.7, 0.75, 0.8), borderWidth: 1 });
    page4.drawText('Lead Systems Engineer:', { x: 60, y: 690, size: 9, font: helveticaBold, color: rgb(0.3, 0.3, 0.3) });
    page4.drawText('Verified & Released for In-Browser Testing', { x: 60, y: 665, size: 8, font: helvetica, color: rgb(0.1, 0.5, 0.2) });

    const pdfBytes1 = await pdfDoc.save();
    fs.writeFileSync(path.join(outDir, 'sample_multipage_report.pdf'), pdfBytes1);
  }

  // ==========================================
  // 2. SCANNED INVOICE PDF FOR OCR TESTING
  // ==========================================
  {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const scanImagePath = path.resolve('test/samples/images/sample_scanned_invoice.png');
    if (fs.existsSync(scanImagePath)) {
      const scanImageBytes = fs.readFileSync(scanImagePath);
      const scanImage = await pdfDoc.embedPng(scanImageBytes);
      page.drawImage(scanImage, {
        x: 40,
        y: 80,
        width: 515.28,
        height: 687,
      });
    }
    const pdfBytes2 = await pdfDoc.save();
    fs.writeFileSync(path.join(outDir, 'sample_scanned_invoice_ocr.pdf'), pdfBytes2);
  }

  // ==========================================
  // 3. CONFIDENTIAL CONTRACT (2 Pages) FOR SIGN / PROTECT
  // ==========================================
  {
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Page 1
    const p1 = pdfDoc.addPage([595.28, 841.89]);
    p1.drawText('MUTUAL NON-DISCLOSURE AGREEMENT', {
      x: 120,
      y: 780,
      size: 16,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    p1.drawText(
      'This Non-Disclosure Agreement (the "Agreement") is entered into as of October 27, 2026,\n' +
      'by and between Multi_Tools Enterprise Systems ("Disclosing Party") and\n' +
      'Authorized Testing Evaluation Partner ("Receiving Party").\n\n' +
      '1. Confidential Information: Both parties agree that proprietary software structures,\n' +
      'browser encryption modules, and security parameters constitute strictly protected assets.\n\n' +
      '2. Purpose: The Receiving Party shall use confidential materials solely for verifying the\n' +
      'integrity and client-side processing stability of the Multi_Tools platform.',
      {
        x: 50,
        y: 720,
        size: 11,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
        lineHeight: 20,
      }
    );

    // Page 2
    const p2 = pdfDoc.addPage([595.28, 841.89]);
    p2.drawText('3. Term, Signatures & Execution', {
      x: 50,
      y: 780,
      size: 14,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    p2.drawText(
      'IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first above written.\n' +
      'This document is ready for digital signature via the Sign PDF utility or password protection via Protect PDF.',
      {
        x: 50,
        y: 740,
        size: 10,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
        lineHeight: 18,
      }
    );

    // Signature boxes
    p2.drawRectangle({ x: 50, y: 550, width: 220, height: 100, borderColor: rgb(0.6, 0.65, 0.7), borderWidth: 1 });
    p2.drawText('DISCLOSING PARTY SIGNATURE:', { x: 60, y: 630, size: 8, font: helveticaBold, color: rgb(0.4, 0.4, 0.4) });
    p2.drawLine({ start: { x: 60, y: 575 }, end: { x: 250, y: 575 }, color: rgb(0.7, 0.7, 0.7) });
    p2.drawText('Authorized Officer', { x: 60, y: 560, size: 8, font: helvetica, color: rgb(0.5, 0.5, 0.5) });

    p2.drawRectangle({ x: 310, y: 550, width: 220, height: 100, borderColor: rgb(0.6, 0.65, 0.7), borderWidth: 1 });
    p2.drawText('RECEIVING PARTY SIGNATURE:', { x: 320, y: 630, size: 8, font: helveticaBold, color: rgb(0.4, 0.4, 0.4) });
    p2.drawLine({ start: { x: 320, y: 575 }, end: { x: 510, y: 575 }, color: rgb(0.7, 0.7, 0.7) });
    p2.drawText('Sign Here (Use Sign PDF Tool)', { x: 320, y: 560, size: 8, font: helvetica, color: rgb(0.8, 0.2, 0.2) });

    const pdfBytes3 = await pdfDoc.save();
    fs.writeFileSync(path.join(outDir, 'sample_contract_agreement.pdf'), pdfBytes3);
  }

  // ==========================================
  // 4. PRESENTATION SLIDES (Landscape)
  // ==========================================
  {
    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Slide 1
    const s1 = pdfDoc.addPage([841.89, 595.28]); // Landscape
    s1.drawRectangle({ x: 0, y: 0, width: 841.89, height: 595.28, color: rgb(0.06, 0.09, 0.16) });
    s1.drawText('MULTI_TOOLS 2026 ROADMAP', { x: 80, y: 340, size: 36, font: helveticaBold, color: rgb(1, 1, 1) });
    s1.drawText('Next Generation In-Browser Software Solutions', { x: 80, y: 290, size: 18, font: helvetica, color: rgb(0.4, 0.7, 1) });

    // Slide 2
    const s2 = pdfDoc.addPage([841.89, 595.28]);
    s2.drawRectangle({ x: 0, y: 0, width: 841.89, height: 595.28, color: rgb(0.97, 0.98, 0.99) });
    s2.drawText('Core Architectural Pillars', { x: 80, y: 480, size: 28, font: helveticaBold, color: rgb(0.1, 0.15, 0.2) });
    s2.drawText('1. Pure Client-Side WASM & Canvas Engine\n2. 24-Hour Autonomous Local Cache with Smart Pruning\n3. Responsive Ergonomic UI for Desktop and Mobile', {
      x: 80,
      y: 360,
      size: 16,
      font: helvetica,
      color: rgb(0.2, 0.25, 0.3),
      lineHeight: 30,
    });

    const pdfBytes4 = await pdfDoc.save();
    fs.writeFileSync(path.join(outDir, 'sample_presentation_slides.pdf'), pdfBytes4);
  }

  // ==========================================
  // 5. MERGE PART 1 & MERGE PART 2
  // ==========================================
  {
    const doc1 = await PDFDocument.create();
    const fontB = await doc1.embedFont(StandardFonts.HelveticaBold);
    const font = await doc1.embedFont(StandardFonts.Helvetica);
    const p = doc1.addPage([595.28, 841.89]);
    p.drawText('PART 1: SYSTEM OVERVIEW & INTRODUCTION', { x: 50, y: 780, size: 16, font: fontB, color: rgb(0.8, 0.1, 0.2) });
    p.drawText('This is Volume 1 created to test the Merge PDF tool. Combine this with Part 2.', { x: 50, y: 740, size: 11, font: font, color: rgb(0.2, 0.2, 0.2) });
    fs.writeFileSync(path.join(outDir, 'sample_merge_part1.pdf'), await doc1.save());

    const doc2 = await PDFDocument.create();
    const fontB2 = await doc2.embedFont(StandardFonts.HelveticaBold);
    const font2 = await doc2.embedFont(StandardFonts.Helvetica);
    const p2 = doc2.addPage([595.28, 841.89]);
    p2.drawText('PART 2: APPENDICES & DETAILED METRICS', { x: 50, y: 780, size: 16, font: fontB2, color: rgb(0.1, 0.4, 0.8) });
    p2.drawText('This is Volume 2 created to test the Merge PDF tool. It will append after Part 1.', { x: 50, y: 740, size: 11, font: font2, color: rgb(0.2, 0.2, 0.2) });
    fs.writeFileSync(path.join(outDir, 'sample_merge_part2.pdf'), await doc2.save());
  }

  console.log('Generated sample PDFs successfully in test/samples/pdfs/');
}

createSamplePdfs().catch(console.error);
