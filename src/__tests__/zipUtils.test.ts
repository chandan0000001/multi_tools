import { describe, it, expect } from 'vitest';
import { createZipArchive, computeCrc32 } from '../utils/zipUtils';

describe('zipUtils', () => {
  it('computes correct CRC32 for known strings', () => {
    const encoder = new TextEncoder();
    const data = encoder.encode('123456789');
    // Standard test vector CRC-32 for "123456789" is 0xcbf43926 (3421780262)
    expect(computeCrc32(data)).toBe(0xcbf43926);
  });

  it('creates a valid ZIP archive containing multiple files', () => {
    const encoder = new TextEncoder();
    const files = [
      { filename: 'page-1.jpg', data: encoder.encode('mock jpeg data 1') },
      { filename: 'page-2.jpg', data: encoder.encode('mock jpeg data 2') },
      { filename: 'page-3.jpg', data: encoder.encode('mock jpeg data 3') },
    ];

    const zipBytes = createZipArchive(files);
    expect(zipBytes.length).toBeGreaterThan(0);

    // Verify ZIP magic number PK\x03\x04
    expect(zipBytes[0]).toBe(0x50);
    expect(zipBytes[1]).toBe(0x4b);
    expect(zipBytes[2]).toBe(0x03);
    expect(zipBytes[3]).toBe(0x04);
  });
});
