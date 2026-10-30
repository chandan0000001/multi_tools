import { encryptPDF } from '@pdfsmaller/pdf-encrypt';

export interface ProtectResult {
  success: boolean;
  bytes?: Uint8Array;
  error?: string;
}

/**
 * Client-side PDF encryption engine.
 * Encrypts a PDF document with standard AES-256 client-side protection.
 */
export async function protectPdfDocument(
  fileBytes: Uint8Array | ArrayBuffer,
  password: string
): Promise<ProtectResult> {
  const trimmed = (password || '').trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'Please enter a password to protect the document.',
    };
  }

  try {
    const bytes = fileBytes instanceof Uint8Array ? fileBytes : new Uint8Array(fileBytes);
    const encryptedBytes = await encryptPDF(bytes, trimmed);
    return {
      success: true,
      bytes: encryptedBytes,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to encrypt PDF document',
    };
  }
}
