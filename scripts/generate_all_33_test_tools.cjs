const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { encryptPDF } = require('@pdfsmaller/pdf-encrypt');

// Helper to create multi-page PDF documents with styled headers and page numbers
async function createStyledPdf(filePath, pageCount, title, options = {}) {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const color = options.color || [0.2, 0.4, 0.8];
  const isLandscape = options.isLandscape || false;
  const pageSize = isLandscape ? [841.89, 595.28] : [595.28, 841.89];

  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage(pageSize);
    const { width, height } = page.getSize();

    // Colored banner
    page.drawRectangle({
      x: 0,
      y: height - 60,
      width: width,
      height: 60,
      color: rgb(color[0], color[1], color[2]),
    });

    page.drawText(`${title}`, {
      x: 35,
      y: height - 40,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Big central page indicator
    page.drawText(`PAGE ${i} OF ${pageCount}`, {
      x: 45,
      y: height / 2 + 20,
      size: 34,
      font: fontBold,
      color: rgb(0.15, 0.2, 0.25),
    });

    // Content description
    const desc = options.pageDescriptions && options.pageDescriptions[i - 1]
      ? options.pageDescriptions[i - 1]
      : `Test page #${i} for validating tool operations. Zero cloud dispatch.`;

    page.drawText(desc, {
      x: 45,
      y: height / 2 - 20,
      size: 13,
      font: font,
      color: rgb(0.35, 0.4, 0.45),
    });

    // Bottom metadata
    if (!options.omitPageNumbers) {
      page.drawText(`Doc: ${path.basename(filePath)} | Page: ${i}/${pageCount}`, {
        x: 45,
        y: 40,
        size: 9,
        font: font,
        color: rgb(0.55, 0.6, 0.65),
      });
    }
  }

  const pdfBytes = await doc.save();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(pdfBytes));
  console.log(`Generated PDF: ${filePath} (${pageCount} pages, ${(pdfBytes.length / 1024).toFixed(1)} KB)`);
  return pdfBytes;
}

// Minimal valid PNG generator (32x32 transparent or colored)
function createSamplePng(filePath, r = 225, g = 29, b = 72) {
  // 1x1 Red PNG
  const pngBytes = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR header
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // 8-bit RGB
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, // IDAT header
    0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, // compressed image data
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
    0xb0, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, // IEND header
    0x44, 0xae, 0x42, 0x60, 0x82
  ]);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, pngBytes);
  console.log(`Generated PNG: ${filePath}`);
}

// Minimal valid JPEG stream
function createSampleJpg(filePath) {
  const jpgHeader = Buffer.from([
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
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, jpgHeader);
  console.log(`Generated JPG: ${filePath}`);
}

// Minimal valid DOCX
function createSampleDocx(filePath, textContent) {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>BPUT OS Exam Prediction Report 2025-26</w:t></w:r></w:p>
    ${textContent
      .split('\n')
      .map((line) => `<w:p><w:r><w:t>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t></w:r></w:p>`)
      .join('\n')}
  </w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-package.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  function makeZipEntry(filename, contentStr) {
    const data = Buffer.from(contentStr, 'utf8');
    const nameBuf = Buffer.from(filename, 'utf8');
    const crc = computeCrc(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(0, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(0, 28);
    return { nameBuf, header, data, crc, size: data.length };
  }

  const entries = [
    makeZipEntry('[Content_Types].xml', contentTypesXml),
    makeZipEntry('_rels/.rels', relsXml),
    makeZipEntry('word/document.xml', documentXml),
  ];

  const localParts = [];
  const cdParts = [];
  let offset = 0;
  for (const entry of entries) {
    localParts.push(entry.header, entry.nameBuf, entry.data);
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(entry.crc, 16);
    cd.writeUInt32LE(entry.size, 20);
    cd.writeUInt32LE(entry.size, 24);
    cd.writeUInt16LE(entry.nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    cdParts.push(cd, entry.nameBuf);
    offset += entry.header.length + entry.nameBuf.length + entry.data.length;
  }

  const cdStart = offset;
  const cdSize = cdParts.reduce((acc, b) => acc + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdStart, 16);
  eocd.writeUInt16LE(0, 20);

  const finalZip = Buffer.concat([...localParts, ...cdParts, eocd]);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, finalZip);
  console.log(`Generated DOCX: ${filePath} (${(finalZip.length / 1024).toFixed(1)} KB)`);
}

// Minimal valid PPTX
function createSamplePptx(filePath, title = 'Operating Systems Lecture Presentation') {
  const presXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst/>
  <p:sldIdLst/>
</p:presentation>`;

  function makeZipEntry(filename, contentStr) {
    const data = Buffer.from(contentStr, 'utf8');
    const nameBuf = Buffer.from(filename, 'utf8');
    const crc = computeCrc(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(0, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(0, 28);
    return { nameBuf, header, data, crc, size: data.length };
  }

  const entries = [
    makeZipEntry('[Content_Types].xml', `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>`),
    makeZipEntry('ppt/presentation.xml', presXml),
  ];

  const localParts = [];
  const cdParts = [];
  let offset = 0;
  for (const entry of entries) {
    localParts.push(entry.header, entry.nameBuf, entry.data);
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(entry.crc, 16);
    cd.writeUInt32LE(entry.size, 20);
    cd.writeUInt32LE(entry.size, 24);
    cd.writeUInt16LE(entry.nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    cdParts.push(cd, entry.nameBuf);
    offset += entry.header.length + entry.nameBuf.length + entry.data.length;
  }

  const cdStart = offset;
  const cdSize = cdParts.reduce((acc, b) => acc + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdStart, 16);
  eocd.writeUInt16LE(0, 20);

  const finalZip = Buffer.concat([...localParts, ...cdParts, eocd]);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, finalZip);
  console.log(`Generated PPTX: ${filePath} (${(finalZip.length / 1024).toFixed(1)} KB)`);
}

function computeCrc(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

async function generateAll33TestSuites() {
  const baseDir = path.resolve(__dirname, '..', 'TEST');
  console.log(`\n============================================================`);
  console.log(`Generating Comprehensive Test Assets for ALL 33 Tools`);
  console.log(`Directory: ${baseDir}`);
  console.log(`============================================================\n`);

  // 1. pdfMerge
  await createStyledPdf(path.join(baseDir, 'pdfMerge', 'pdf1.pdf'), 3, 'Merge Document 1 (Finance)', [0.1, 0.45, 0.8]);
  await createStyledPdf(path.join(baseDir, 'pdfMerge', 'pdf2.pdf'), 4, 'Merge Document 2 (Architecture)', [0.55, 0.2, 0.7]);
  await createStyledPdf(path.join(baseDir, 'pdfMerge', 'pdf3.pdf'), 2, 'Merge Document 3 (Terms)', [0.8, 0.45, 0.1]);

  // 2. pdfSplit (14 pages as explicitly required)
  await createStyledPdf(path.join(baseDir, 'pdfSplit', 'sample_14pages.pdf'), 14, 'Split Range Test Doc (14 Pages)', [0.85, 0.25, 0.25]);

  // 3. organize
  await createStyledPdf(path.join(baseDir, 'organize', 'sample_organize_6pages.pdf'), 6, 'Organize Pages Document (6 Pages)', [0.9, 0.4, 0.1]);

  // 4. removePages
  await createStyledPdf(path.join(baseDir, 'removePages', 'sample_remove_8pages.pdf'), 8, 'Remove Pages Sample (8 Pages)', [0.8, 0.1, 0.2]);

  // 5. extractPages
  await createStyledPdf(path.join(baseDir, 'extractPages', 'sample_extract_10pages.pdf'), 10, 'Extract Pages Sample (10 Pages)', [0.7, 0.5, 0.1]);

  // 6. scanPdf
  createSampleJpg(path.join(baseDir, 'scanPdf', 'sample_receipt_scan.jpg'));
  createSamplePng(path.join(baseDir, 'scanPdf', 'sample_document_scan.png'));

  // 7. pdfCompress
  await createStyledPdf(path.join(baseDir, 'pdfCompress', 'sample_compress.pdf'), 5, 'Compress Quality Testing (5 Pages)', [0.2, 0.7, 0.4]);

  // 8. ocr
  await createStyledPdf(path.join(baseDir, 'ocr', 'sample_scanned_ocr.pdf'), 3, 'Optical Character Recognition Sample', [0.1, 0.6, 0.5]);

  // 9. repair (valid and corrupted)
  const validRepBytes = await createStyledPdf(path.join(baseDir, 'repair', 'sample_valid.pdf'), 3, 'Repair Validation Base', [0.4, 0.7, 0.1]);
  // Truncate xref to create damaged PDF
  const corrupted = Buffer.from(validRepBytes.subarray(0, validRepBytes.length - 80));
  fs.writeFileSync(path.join(baseDir, 'repair', 'corrupted_sample.pdf'), corrupted);
  console.log(`Generated Corrupted: ${path.join(baseDir, 'repair', 'corrupted_sample.pdf')}`);

  // 10. jpgToPdf
  createSampleJpg(path.join(baseDir, 'jpgToPdf', 'photo1.jpg'));
  createSampleJpg(path.join(baseDir, 'jpgToPdf', 'photo2.jpg'));
  createSamplePng(path.join(baseDir, 'jpgToPdf', 'photo3.png'));

  // 11. wordToPdf
  createSampleDocx(
    path.join(baseDir, 'wordToPdf', 'sample_word_report.docx'),
    `Section 1: Operating System Fundamentals\nProcess Scheduling Algorithms: FCFS, SJF, Priority, and Round Robin.\nMemory Management: Paging, Segmentation, and Virtual Memory.\nDeadlocks: Banker's Algorithm, Prevention, and Detection.\nStorage Systems: Disk Scheduling (SCAN, C-SCAN, LOOK).`
  );

  // 12. pptToPdf
  createSamplePptx(path.join(baseDir, 'pptToPdf', 'sample_presentation_deck.pptx'));
  fs.writeFileSync(
    path.join(baseDir, 'pptToPdf', 'slides_notes.txt'),
    `Slide 1: Operating Systems & Virtualization\nSlide 2: Concurrency & Semaphores\nSlide 3: Paging & Memory Architecture`
  );

  // 13. excelToPdf
  const csvData = `Department,Employee Count,Budget (USD),Q1 Expenditure,Status\nEngineering,42,$1,250,000,$310,000,Active\nProduct & Design,18,$680,000,$150,000,Active\nMarketing,24,$820,000,$210,000,Active\nCustomer Support,35,$520,000,$130,000,Active\nResearch & AI,15,$950,000,$280,000,Active`;
  fs.mkdirSync(path.join(baseDir, 'excelToPdf'), { recursive: true });
  fs.writeFileSync(path.join(baseDir, 'excelToPdf', 'sample_financial_sheet.csv'), csvData);
  console.log(`Generated CSV: ${path.join(baseDir, 'excelToPdf', 'sample_financial_sheet.csv')}`);

  // 14. htmlToPdf
  const styledHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BPUT OS Exam Prediction Report</title>
  <style>
    body { font-family: sans-serif; margin: 40px; color: #1e293b; }
    h1 { color: #e11d48; border-bottom: 2px solid #f43f5e; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
    th { background: #f8fafc; font-weight: bold; }
    .badge { padding: 3px 8px; border-radius: 6px; font-weight: bold; background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <h1>BPUT OS Exam Prediction Report 2025-26</h1>
  <p><strong>Subject:</strong> Operating Systems (PCC-CS501) • Local Processing</p>
  <table>
    <thead><tr><th>Module</th><th>Topic</th><th>Probability</th></tr></thead>
    <tbody>
      <tr><td>Module 1</td><td>Peterson's Solution & Semaphores</td><td><span class="badge">95% High</span></td></tr>
      <tr><td>Module 2</td><td>Banker's Algorithm for Deadlocks</td><td><span class="badge">98% High</span></td></tr>
      <tr><td>Module 3</td><td>Page Replacement (FIFO, LRU, Optimal)</td><td><span class="badge">92% High</span></td></tr>
    </tbody>
  </table>
</body>
</html>`;
  fs.mkdirSync(path.join(baseDir, 'htmlToPdf'), { recursive: true });
  fs.writeFileSync(path.join(baseDir, 'htmlToPdf', 'sample_report.html'), styledHtml);

  // 15. txtToPdf
  const unicodeTxt = `MultiTools PRO — Text to PDF Typography Verification\n“Double quotes” and ‘single quotes’ with em—dash and en–dash.\n• Bullet 1: Client-Side Security\n• Bullet 2: Zero Server Dispatch\nCurrencies: $100, €85, £75, ¥12,000, ₹7,500.\nMath: α + β = γ, x ≤ y, a ≥ b, ± 5%.`;
  fs.mkdirSync(path.join(baseDir, 'txtToPdf'), { recursive: true });
  fs.writeFileSync(path.join(baseDir, 'txtToPdf', 'sample_unicode.txt'), unicodeTxt);

  // 16. pdfToTxt
  await createStyledPdf(path.join(baseDir, 'pdfToTxt', 'sample_text_extract.pdf'), 3, 'Text Extraction Test Article', [0.1, 0.5, 0.8]);

  // 17. pdfToJpg (13 pages as explicitly required)
  await createStyledPdf(path.join(baseDir, 'pdfToJpg', 'sample_13pages.pdf'), 13, 'Batch Image Rendering (13 Pages)', [0.2, 0.65, 0.35]);

  // 18. pdfToWord
  await createStyledPdf(path.join(baseDir, 'pdfToWord', 'sample_doc_to_convert.pdf'), 3, 'Document for Word Export', [0.2, 0.4, 0.7]);

  // 19. pdfToPpt (Landscape slides)
  await createStyledPdf(path.join(baseDir, 'pdfToPpt', 'sample_presentation_slides.pdf'), 4, 'Presentation Slides (Deck)', {
    color: [0.8, 0.4, 0.1],
    isLandscape: true,
  });

  // 20. pdfToExcel
  await createStyledPdf(path.join(baseDir, 'pdfToExcel', 'sample_tabular_data.pdf'), 2, 'Financial Spreadsheets & Tables', [0.1, 0.6, 0.3]);

  // 21. pdfToPdfa
  await createStyledPdf(path.join(baseDir, 'pdfToPdfa', 'sample_archival_candidate.pdf'), 3, 'ISO 19005-1 Archival Candidate', [0.1, 0.6, 0.7]);

  // 22. pdfToMarkdown
  await createStyledPdf(path.join(baseDir, 'pdfToMarkdown', 'sample_structured.pdf'), 3, 'Structured Heading Markdown Source', [0.3, 0.2, 0.7]);

  // 23. rotate
  await createStyledPdf(path.join(baseDir, 'rotate', 'sample_mixed_orientation.pdf'), 4, 'Orientation Adjustment Test', [0.5, 0.2, 0.6]);

  // 24. pageNumbers
  await createStyledPdf(path.join(baseDir, 'pageNumbers', 'sample_unnumbered_doc.pdf'), 5, 'Unnumbered Legal Document', {
    color: [0.4, 0.2, 0.6],
    omitPageNumbers: true,
  });

  // 25. watermark
  await createStyledPdf(path.join(baseDir, 'watermark', 'sample_confidential_contract.pdf'), 3, 'Non-Disclosure Agreement', [0.6, 0.1, 0.4]);
  createSamplePng(path.join(baseDir, 'watermark', 'confidential_stamp.png'));

  // 26. crop
  await createStyledPdf(path.join(baseDir, 'crop', 'sample_wide_margins_doc.pdf'), 3, 'Wide Margins Layout', [0.7, 0.2, 0.4]);

  // 27. edit
  await createStyledPdf(path.join(baseDir, 'edit', 'sample_draft_for_annotation.pdf'), 3, 'Draft Memorandum for Review', [0.5, 0.2, 0.5]);

  // 28. forms (real interactive form)
  const formDoc = await PDFDocument.create();
  const formPage = formDoc.addPage([595.28, 841.89]);
  const formFont = await formDoc.embedFont(StandardFonts.Helvetica);
  const formBold = await formDoc.embedFont(StandardFonts.HelveticaBold);
  formPage.drawText('Employee Onboarding & Security Verification Form', {
    x: 50,
    y: 790,
    size: 16,
    font: formBold,
    color: rgb(0.1, 0.15, 0.25),
  });
  const form = formDoc.getForm();
  const nameField = form.createTextField('fullName');
  nameField.setText('Chandan Kumar');
  nameField.addToPage(formPage, { x: 50, y: 720, width: 250, height: 26 });
  formPage.drawText('Full Legal Name:', { x: 50, y: 750, size: 10, font: formFont });

  const roleField = form.createTextField('jobTitle');
  roleField.setText('Lead Software Architect');
  roleField.addToPage(formPage, { x: 50, y: 660, width: 250, height: 26 });
  formPage.drawText('Role Title:', { x: 50, y: 690, size: 10, font: formFont });

  const chkBox = form.createCheckBox('agreeTerms');
  chkBox.check();
  chkBox.addToPage(formPage, { x: 50, y: 610, width: 20, height: 20 });
  formPage.drawText('I confirm that all provided verification details are accurate.', { x: 80, y: 614, size: 10, font: formFont });

  const formPdfBytes = await formDoc.save();
  fs.mkdirSync(path.join(baseDir, 'forms'), { recursive: true });
  fs.writeFileSync(path.join(baseDir, 'forms', 'sample_interactive_form.pdf'), Buffer.from(formPdfBytes));
  console.log(`Generated Form: ${path.join(baseDir, 'forms', 'sample_interactive_form.pdf')}`);

  // 29. unlock (Password protected PDF with password: 1234)
  const unlBaseBytes = await createStyledPdf(path.join(baseDir, 'unlock', 'unencrypted_source.pdf'), 2, 'Protected Confidential Records', [0.1, 0.5, 0.5]);
  const encrypted1234 = await encryptPDF(unlBaseBytes, '1234');
  fs.writeFileSync(path.join(baseDir, 'unlock', 'protected_password_1234.pdf'), Buffer.from(encrypted1234));
  fs.writeFileSync(path.join(baseDir, 'unlock', 'password_info.txt'), 'Password to unlock this document: 1234\n');
  console.log(`Generated Protected PDF: ${path.join(baseDir, 'unlock', 'protected_password_1234.pdf')} (Password: 1234)`);

  // 30. protect
  await createStyledPdf(path.join(baseDir, 'protect', 'sample_unprotected_file.pdf'), 3, 'Unprotected Financial Ledger', [0.1, 0.35, 0.7]);

  // 31. sign
  await createStyledPdf(path.join(baseDir, 'sign', 'sample_service_agreement.pdf'), 2, 'Consulting Services Agreement', [0.2, 0.2, 0.6]);

  // 32. redact
  await createStyledPdf(path.join(baseDir, 'redact', 'sample_confidential_records.pdf'), 3, 'Confidential Personnel Records', [0.2, 0.2, 0.25]);

  // 33. compare (Version 1 vs Version 2)
  const v1Doc = await PDFDocument.create();
  const v1Page = v1Doc.addPage([595.28, 841.89]);
  const vFont = await v1Doc.embedFont(StandardFonts.Helvetica);
  const vBold = await v1Doc.embedFont(StandardFonts.HelveticaBold);
  v1Page.drawText('Service Agreement - Version 1.0 (Original)', { x: 50, y: 780, size: 16, font: vBold });
  v1Page.drawText('Section 1.1: Standard storage quota is set to 10 GB per account.', { x: 50, y: 730, size: 12, font: vFont });
  v1Page.drawText('Section 1.2: Standard bandwidth allocation is 50 GB monthly.', { x: 50, y: 700, size: 12, font: vFont });
  fs.mkdirSync(path.join(baseDir, 'compare'), { recursive: true });
  fs.writeFileSync(path.join(baseDir, 'compare', 'document_version_1.pdf'), Buffer.from(await v1Doc.save()));

  const v2Doc = await PDFDocument.create();
  const v2Page = v2Doc.addPage([595.28, 841.89]);
  const v2Font = await v2Doc.embedFont(StandardFonts.Helvetica);
  const v2Bold = await v2Doc.embedFont(StandardFonts.HelveticaBold);
  v2Page.drawText('Service Agreement - Version 2.0 (Revised)', { x: 50, y: 780, size: 16, font: v2Bold });
  v2Page.drawText('Section 1.1: Enhanced storage quota is set to 100 GB per account.', { x: 50, y: 730, size: 12, font: v2Font });
  v2Page.drawText('Section 1.2: Unlimited bandwidth allocation applies to all plans.', { x: 50, y: 700, size: 12, font: v2Font });
  fs.writeFileSync(path.join(baseDir, 'compare', 'document_version_2.pdf'), Buffer.from(await v2Doc.save()));
  console.log(`Generated Compare Docs: ${path.join(baseDir, 'compare', 'document_version_1.pdf')} & version_2`);

  // Create clean README in root of TEST
  const testSummary = `# MultiTools PRO — Comprehensive Suite Test Assets (All 33 Tools)

This directory provides verified test inputs and assets for each of the 33 browser-native tools in the PDF Productivity Suite:

| # | Tool ID | Folder | Primary Test Assets | Test Purpose |
|---|---|---|---|---|
| 1 | \`merge\` | \`TEST/pdfMerge/\` | \`pdf1.pdf\`, \`pdf2.pdf\`, \`pdf3.pdf\` | Combining multi-document sets |
| 2 | \`split\` | \`TEST/pdfSplit/\` | \`sample_14pages.pdf\` | Testing range extraction (\`0 1\`, \`4 2\`, \`0 9\`, \`12 7\`, \`98 9\`) |
| 3 | \`organize\` | \`TEST/organize/\` | \`sample_organize_6pages.pdf\` | Reordering and deleting individual pages |
| 4 | \`remove-pages\` | \`TEST/removePages/\` | \`sample_remove_8pages.pdf\` | Selective page elimination |
| 5 | \`extract-pages\` | \`TEST/extractPages/\` | \`sample_extract_10pages.pdf\` | Extracting subsets of pages |
| 6 | \`scan-pdf\` | \`TEST/scanPdf/\` | \`sample_receipt_scan.jpg\`, \`sample_document_scan.png\` | Camera and scan imports |
| 7 | \`compress\` | \`TEST/pdfCompress/\` | \`sample_compress.pdf\` | Extreme, Recommended, Less downsampling |
| 8 | \`ocr\` | \`TEST/ocr/\` | \`sample_scanned_ocr.pdf\` | Optical character recognition layer |
| 9 | \`repair\` | \`TEST/repair/\` | \`corrupted_sample.pdf\`, \`sample_valid.pdf\` | Corrupted xref table reconstruction |
| 10 | \`jpg-to-pdf\` | \`TEST/jpgToPdf/\` | \`photo1.jpg\`, \`photo2.jpg\`, \`photo3.png\` | Converting images to PDF |
| 11 | \`word-to-pdf\` | \`TEST/wordToPdf/\` | \`sample_word_report.docx\` | Converting Word docx to PDF without WinAnsi errors |
| 12 | \`ppt-to-pdf\` | \`TEST/pptToPdf/\` | \`sample_presentation_deck.pptx\`, \`slides_notes.txt\` | Presentation slides conversion |
| 13 | \`excel-to-pdf\` | \`TEST/excelToPdf/\` | \`sample_financial_sheet.csv\` | Converting spreadsheet data to PDF sheets |
| 14 | \`html-to-pdf\` | \`TEST/htmlToPdf/\` | \`sample_report.html\` | Visual styled webpage & source code conversion |
| 15 | \`txt-to-pdf\` | \`TEST/txtToPdf/\` | \`sample_unicode.txt\` | Unicode, smart quotes, bullets, math typography |
| 16 | \`pdf-to-txt\` | \`TEST/pdfToTxt/\` | \`sample_text_extract.pdf\` | In-memory text extraction |
| 17 | \`pdf-to-jpg\` | \`TEST/pdfToJpg/\` | \`sample_13pages.pdf\` | 13-page batch rendering and ZIP download |
| 18 | \`pdf-to-word\` | \`TEST/pdfToWord/\` | \`sample_doc_to_convert.pdf\` | Exporting PDF text to editable format |
| 19 | \`pdf-to-ppt\` | \`TEST/pdfToPpt/\` | \`sample_presentation_slides.pdf\` | Exporting slides to presentation deck |
| 20 | \`pdf-to-excel\` | \`TEST/pdfToExcel/\` | \`sample_tabular_data.pdf\` | Exporting tabular data to spreadsheet |
| 21 | \`pdf-to-pdfa\` | \`TEST/pdfToPdfa/\` | \`sample_archival_candidate.pdf\` | ISO 19005-1 archival standard |
| 22 | \`pdf-to-markdown\` | \`TEST/pdfToMarkdown/\` | \`sample_structured.pdf\` | Extracting headings and markdown lists |
| 23 | \`rotate\` | \`TEST/rotate/\` | \`sample_mixed_orientation.pdf\` | 90°, 180°, 270° orientation rotation |
| 24 | \`page-numbers\` | \`TEST/pageNumbers/\` | \`sample_unnumbered_doc.pdf\` | Adding bottom/top page numbers |
| 25 | \`watermark\` | \`TEST/watermark/\` | \`sample_confidential_contract.pdf\`, \`confidential_stamp.png\` | Text and image watermarks |
| 26 | \`crop\` | \`TEST/crop/\` | \`sample_wide_margins_doc.pdf\` | Trimming page margins |
| 27 | \`edit\` | \`TEST/edit/\` | \`sample_draft_for_annotation.pdf\` | Annotating, notes, stamps |
| 28 | \`forms\` | \`TEST/forms/\` | \`sample_interactive_form.pdf\` | Interactive fillable text fields and checkboxes |
| 29 | \`unlock\` | \`TEST/unlock/\` | \`protected_password_1234.pdf\` | Unlocking AES-encrypted PDF (Password: \`1234\`) |
| 30 | \`protect\` | \`TEST/protect/\` | \`sample_unprotected_file.pdf\` | AES-256 client-side encryption |
| 31 | \`sign\` | \`TEST/sign/\` | \`sample_service_agreement.pdf\` | Canvas signature and digital stamp |
| 32 | \`redact\` | \`TEST/redact/\` | \`sample_confidential_records.pdf\` | Blackout redaction of sensitive info |
| 33 | \`compare\` | \`TEST/compare/\` | \`document_version_1.pdf\`, \`document_version_2.pdf\` | Side-by-side visual difference comparison |

All files are created locally and run 100% in-browser with zero server reliance.
`;
  fs.writeFileSync(path.join(baseDir, 'README.md'), testSummary);
  console.log(`\n✅ Generated TEST suite for ALL 33 TOOLS successfully!`);
}

generateAll33TestSuites().catch(console.error);
