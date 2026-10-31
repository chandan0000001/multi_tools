/**
 * High-performance, lightweight pure TypeScript ZIP archive generator.
 * Zero external runtime dependencies. Runs 100% client-side in the browser.
 */

// CRC-32 lookup table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}

export function computeCrc32(data: Uint8Array): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

export interface ZipFileInput {
  filename: string;
  data: Uint8Array;
}

/**
 * Creates a standard uncompressed (store mode) ZIP archive.
 * Perfect for images (JPG, PNG) and PDF files which are already compressed.
 */
export function createZipArchive(files: ZipFileInput[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const cdParts: Uint8Array[] = [];

  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.filename);
    const data = file.data;
    const crc = computeCrc32(data);
    const size = data.length;

    // 1. Local File Header: 30 bytes
    const localHeader = new Uint8Array(30);
    const lView = new DataView(localHeader.buffer);
    lView.setUint32(0, 0x04034b50, true); // signature
    lView.setUint16(4, 20, true); // version needed to extract (2.0)
    lView.setUint16(6, 0, true); // general purpose bit flag
    lView.setUint16(8, 0, true); // compression method (0 = stored)
    lView.setUint16(10, 0, true); // last mod file time
    lView.setUint16(12, 0, true); // last mod file date
    lView.setUint32(14, crc, true); // crc-32
    lView.setUint32(18, size, true); // compressed size
    lView.setUint32(22, size, true); // uncompressed size
    lView.setUint16(26, nameBytes.length, true); // filename length
    lView.setUint16(28, 0, true); // extra field length

    localParts.push(localHeader, nameBytes, data);

    // 2. Central Directory File Header: 46 bytes
    const cdHeader = new Uint8Array(46);
    const cView = new DataView(cdHeader.buffer);
    cView.setUint32(0, 0x02014b50, true); // signature
    cView.setUint16(4, 20, true); // version made by
    cView.setUint16(6, 20, true); // version needed to extract
    cView.setUint16(8, 0, true); // general purpose bit flag
    cView.setUint16(10, 0, true); // compression method (0 = stored)
    cView.setUint16(12, 0, true); // last mod file time
    cView.setUint16(14, 0, true); // last mod file date
    cView.setUint32(16, crc, true); // crc-32
    cView.setUint32(20, size, true); // compressed size
    cView.setUint32(24, size, true); // uncompressed size
    cView.setUint16(28, nameBytes.length, true); // filename length
    cView.setUint16(30, 0, true); // extra field length
    cView.setUint16(32, 0, true); // file comment length
    cView.setUint16(34, 0, true); // disk number start
    cView.setUint16(36, 0, true); // internal file attributes
    cView.setUint32(38, 0, true); // external file attributes
    cView.setUint32(42, offset, true); // relative offset of local header

    cdParts.push(cdHeader, nameBytes);

    offset += localHeader.length + nameBytes.length + data.length;
  }

  const cdStart = offset;
  const cdSize = cdParts.reduce((acc, part) => acc + part.length, 0);

  // 3. End of Central Directory Record: 22 bytes
  const eocd = new Uint8Array(22);
  const eView = new DataView(eocd.buffer);
  eView.setUint32(0, 0x06054b50, true); // signature
  eView.setUint16(4, 0, true); // number of this disk
  eView.setUint16(6, 0, true); // disk where central directory starts
  eView.setUint16(8, files.length, true); // total entries on this disk
  eView.setUint16(10, files.length, true); // total entries
  eView.setUint32(12, cdSize, true); // size of central directory
  eView.setUint32(16, cdStart, true); // offset of start of central directory
  eView.setUint16(20, 0, true); // comment length

  // Concatenate all parts
  const totalLength = offset + cdSize + eocd.length;
  const result = new Uint8Array(totalLength);
  let pos = 0;

  for (const part of localParts) {
    result.set(part, pos);
    pos += part.length;
  }
  for (const part of cdParts) {
    result.set(part, pos);
    pos += part.length;
  }
  result.set(eocd, pos);

  return result;
}
