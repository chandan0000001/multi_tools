const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const pako = require('pako');

async function createMultiPagePdf(filePath, pageCount, title, colorTheme = [0.2, 0.4, 0.8]) {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    // Header bar
    page.drawRectangle({
      x: 0,
      y: height - 60,
      width: width,
      height: 60,
      color: rgb(colorTheme[0], colorTheme[1], colorTheme[2]),
    });

    page.drawText(`${title}`, {
      x: 40,
      y: height - 40,
      size: 18,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Big page number in center
    page.drawText(`PAGE ${i} OF ${pageCount}`, {
      x: 50,
      y: height / 2 + 30,
      size: 38,
      font: fontBold,
      color: rgb(0.15, 0.2, 0.25),
    });

    page.drawText(`This is a verified test page #${i} for validating PDF tools.`, {
      x: 50,
      y: height / 2 - 20,
      size: 14,
      font: font,
      color: rgb(0.35, 0.4, 0.45),
    });

    // Detailed metadata block
    page.drawText(`Document: ${path.basename(filePath)} | Total Pages: ${pageCount} | Page Index: ${i}`, {
      x: 50,
      y: 60,
      size: 10,
      font: font,
      color: rgb(0.5, 0.55, 0.6),
    });
  }

  const pdfBytes = await doc.save();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(pdfBytes));
  console.log(`Generated: ${filePath} (${pageCount} pages, ${(pdfBytes.length / 1024).toFixed(1)} KB)`);
}

function createSampleDocx(filePath, textContent) {
  // Construct minimal valid docx ZIP using local file headers
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

  // Helper to build a standard uncompressed/deflated ZIP entry
  function makeZipEntry(filename, contentStr) {
    const data = Buffer.from(contentStr, 'utf8');
    const nameBuf = Buffer.from(filename, 'utf8');
    const crc = computeCrc32(data);

    // Local header: 30 bytes
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); // signature
    header.writeUInt16LE(20, 4); // version needed
    header.writeUInt16LE(0, 6); // flags
    header.writeUInt16LE(0, 8); // compression: 0 (stored)
    header.writeUInt16LE(0, 10); // time
    header.writeUInt16LE(0, 12); // date
    header.writeUInt32LE(crc, 14); // crc32
    header.writeUInt32LE(data.length, 18); // comp size
    header.writeUInt32LE(data.length, 22); // uncomp size
    header.writeUInt16LE(nameBuf.length, 26); // filename length
    header.writeUInt16LE(0, 28); // extra field length

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

    // Central Directory Header: 46 bytes
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

  // End of central directory record (22 bytes)
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
  console.log(`Generated: ${filePath} (${(finalZip.length / 1024).toFixed(1)} KB)`);
}

function computeCrc32(buf) {
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

function createSampleJpg(filePath, width = 300, height = 200) {
  // Standard minimal valid JPEG stream with JFIF header
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
}

async function main() {
  const baseDir = path.resolve(__dirname, '..', 'TEST');
  console.log(`Creating comprehensive TEST suite in: ${baseDir}`);

  // 1. PDF SPLIT: Exactly 14 pages as requested by user
  await createMultiPagePdf(
    path.join(baseDir, 'pdfSplit', 'sample_14pages.pdf'),
    14,
    'Split Tool Test Document (14 Pages)',
    [0.85, 0.25, 0.25]
  );

  // 2. PDF TO JPG: Exactly 13 pages as requested by user
  await createMultiPagePdf(
    path.join(baseDir, 'pdfToJpg', 'sample_13pages.pdf'),
    13,
    'PDF to JPG Batch Conversion (13 Pages)',
    [0.2, 0.65, 0.35]
  );

  // 3. PDF MERGE: 3 separate documents
  await createMultiPagePdf(
    path.join(baseDir, 'pdfMerge', 'pdf1.pdf'),
    3,
    'Merge Doc #1 - Financial Summary',
    [0.1, 0.5, 0.8]
  );
  await createMultiPagePdf(
    path.join(baseDir, 'pdfMerge', 'pdf2.pdf'),
    4,
    'Merge Doc #2 - Technical Architecture',
    [0.6, 0.2, 0.7]
  );
  await createMultiPagePdf(
    path.join(baseDir, 'pdfMerge', 'pdf3.pdf'),
    2,
    'Merge Doc #3 - Terms & Conditions',
    [0.8, 0.5, 0.1]
  );

  // 4. WORD TO PDF: Valid .docx file
  createSampleDocx(
    path.join(baseDir, 'wordToPdf', 'sample_word_report.docx'),
    `Section 1: Operating System Fundamentals
Process Scheduling Algorithms: FCFS, SJF, Priority, and Round Robin.
Memory Management: Paging, Segmentation, and Virtual Memory.
Deadlocks: Prevention, Avoidance (Banker's Algorithm), and Detection.
Storage Systems: Disk Scheduling (SCAN, C-SCAN, LOOK).`
  );

  // 5. TXT TO PDF: Unicode typography test
  const unicodeTxt = `MultiTools PRO — Text to PDF Typography Verification
=====================================================

1. Smart Quotes & Punctuation:
   “Double quotes” and ‘single quotes’ with em—dash and en–dash.
   Ellipsis test… and bullet items:
   • Bullet Point 1: Client-Side Security Verification
   • Bullet Point 2: Zero Server Data Dispatch
   • Bullet Point 3: In-Memory Fast Rendering

2. Currencies & Technical Symbols:
   Pricing: $100, €85, £75, ¥12,000, ₹7,500.
   Mathematics: α + β = γ, x ≤ y, a ≥ b, ± 5%.

3. Multi-Paragraph Reading Flow:
   Operating systems provide an abstraction layer between hardware and user software.
   Kernel scheduling ensures fair CPU timeshare distribution across active threads.
   Virtual memory allows large address spaces via demand-paging mechanisms.`;
  fs.mkdirSync(path.join(baseDir, 'txtToPdf'), { recursive: true });
  fs.writeFileSync(path.join(baseDir, 'txtToPdf', 'sample_unicode.txt'), unicodeTxt);

  // 6. HTML TO PDF: Styled HTML report
  const styledHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BPUT OS Exam Prediction Report 2025-26</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #1e293b; background: #fff; }
    h1 { color: #e11d48; border-bottom: 2px solid #f43f5e; padding-bottom: 8px; font-size: 24px; }
    h2 { color: #0f172a; margin-top: 24px; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
    th { background: #f8fafc; font-weight: bold; color: #334155; }
    tr:nth-child(even) { background: #f1f5f9; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; }
    .badge-high { background: #fee2e2; color: #b91c1c; }
    .badge-med { background: #fef3c7; color: #b45309; }
    .footer { margin-top: 40px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  </style>
</head>
<body>
  <h1>BPUT OS Exam Prediction Report 2025-26</h1>
  <p><strong>Examination Suite:</strong> Computer Science & Engineering (B.Tech 5th Sem)</p>
  <p><strong>Subject:</strong> Operating Systems (PCC-CS501)</p>

  <h2>Module-Wise High Probability Questions</h2>
  <table>
    <thead>
      <tr>
        <th>Module</th>
        <th>Topic & Concepts</th>
        <th>Expected Weightage</th>
        <th>Probability</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Module 1</td>
        <td>Process Synchronization & Peterson's Solution</td>
        <td>10 Marks</td>
        <td><span class="badge badge-high">95% High</span></td>
      </tr>
      <tr>
        <td>Module 2</td>
        <td>Banker's Algorithm for Deadlock Avoidance</td>
        <td>15 Marks</td>
        <td><span class="badge badge-high">98% High</span></td>
      </tr>
      <tr>
        <td>Module 3</td>
        <td>Virtual Memory & Page Replacement (FIFO, LRU, Optimal)</td>
        <td>15 Marks</td>
        <td><span class="badge badge-high">92% High</span></td>
      </tr>
      <tr>
        <td>Module 4</td>
        <td>Disk Scheduling (FCFS, SSTF, SCAN, C-LOOK)</td>
        <td>10 Marks</td>
        <td><span class="badge badge-med">85% Med</span></td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Generated automatically via MultiTools PRO Client-Side PDF Architecture • 100% In-Browser Privacy
  </div>
</body>
</html>`;
  fs.mkdirSync(path.join(baseDir, 'htmlToPdf'), { recursive: true });
  fs.writeFileSync(path.join(baseDir, 'htmlToPdf', 'sample_report.html'), styledHtml);

  // 7. PDF TO MARKDOWN: Structured 3-page document
  await createMultiPagePdf(
    path.join(baseDir, 'pdfToMarkdown', 'sample_structured.pdf'),
    3,
    'Markdown Extraction Test Document',
    [0.3, 0.2, 0.7]
  );

  // 8. JPG TO PDF: Images
  createSampleJpg(path.join(baseDir, 'jpgToPdf', 'photo1.jpg'));
  createSampleJpg(path.join(baseDir, 'jpgToPdf', 'photo2.jpg'));
  createSampleJpg(path.join(baseDir, 'jpgToPdf', 'photo3.jpg'));

  // 9. PDF COMPRESS: Sample document
  await createMultiPagePdf(
    path.join(baseDir, 'pdfCompress', 'sample_compress.pdf'),
    5,
    'Compress Test File (5 Pages)',
    [0.7, 0.2, 0.4]
  );

  console.log('✅ TEST folder generation complete!');
}

main().catch(console.error);
