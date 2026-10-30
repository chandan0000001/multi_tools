import {
  universalDecryptPdf as decryptPDF,
  checkPdfEncryption as isEncrypted,
} from '../../../../utils/pdfDecryptor';

export interface UnlockResult {
  success: boolean;
  bytes?: Uint8Array;
  error?: string;
  isNotEncrypted?: boolean;
  incorrectPassword?: boolean;
}

/**
 * Client-side unlock engine for PDF files.
 * Decrypts standard PDF security (RC4, AES-128, AES-256) entirely in the browser.
 */
export async function unlockPdfDocument(
  fileBytes: Uint8Array | ArrayBuffer,
  password: string
): Promise<UnlockResult> {
  const bytes = fileBytes instanceof Uint8Array ? fileBytes : new Uint8Array(fileBytes);
  const pass = (password || '').trim();

  try {
    const outBytes = await decryptPDF(bytes, pass);
    return {
      success: true,
      bytes: outBytes,
    };
  } catch (decErr: any) {
    const errMsg = decErr?.message || '';
    if (errMsg.includes('not encrypted')) {
      return {
        success: true,
        bytes,
        isNotEncrypted: true,
      };
    }
    if (errMsg.includes('Incorrect password')) {
      return {
        success: false,
        incorrectPassword: true,
        error: pass
          ? 'Incorrect password! The entered password does not match this document.'
          : 'This PDF is password protected. Please enter the password in the sidebar.',
      };
    }
    if (!pass) {
      return {
        success: false,
        error: 'This PDF is password protected. Please enter the password in the sidebar.',
      };
    }
    return {
      success: false,
      error: `Decryption error: ${errMsg}`,
    };
  }
}

export { isEncrypted };
