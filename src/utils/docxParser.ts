/**
 * Pure TypeScript Word (.docx) Document Parser.
 * Runs 100% in-browser with zero backend calls.
 * Extracts paragraphs, headings, and text safely from word/document.xml.
 */

import { inflateRaw } from 'pako';
import { sanitizeTextForWinAnsi } from './textSanitizer';

export interface DocxParagraph {
  text: string;
  isHeading: boolean;
  isBold: boolean;
}

/**
 * Reads a .docx (OpenXML) ArrayBuffer and extracts clean text paragraphs.
 */
export async function parseDocxFile(fileBuffer: ArrayBuffer | Uint8Array): Promise<DocxParagraph[]> {
  const bytes = fileBuffer instanceof Uint8Array ? fileBuffer : new Uint8Array(fileBuffer);

  // 1. Check if file has ZIP signature PK\x03\x04
  if (bytes.length < 30 || bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
    // Not a docx zip archive (possibly an older .doc or plain text file with .docx extension)
    return fallbackExtractTextFromBinary(bytes);
  }

  // 2. Scan zip entries for 'word/document.xml'
  let offset = 0;
  let documentXmlBytes: Uint8Array | null = null;
  const decoder = new TextDecoder('utf-8');

  while (offset + 30 < bytes.length) {
    const sig =
      bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24);

    if (sig !== 0x04034b50) {
      // Not a local header; might have reached central directory or end
      break;
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 30);
    const method = view.getUint16(8, true);
    const compSize = view.getUint32(18, true);
    const nameLen = view.getUint16(26, true);
    const extraLen = view.getUint16(28, true);

    const nameStart = offset + 30;
    const nameBytes = bytes.subarray(nameStart, nameStart + nameLen);
    const fileName = decoder.decode(nameBytes);

    const dataStart = nameStart + nameLen + extraLen;

    if (fileName === 'word/document.xml') {
      const compData = bytes.subarray(dataStart, dataStart + compSize);
      if (method === 8) {
        // Deflated
        documentXmlBytes = inflateRaw(compData);
      } else if (method === 0) {
        // Stored
        documentXmlBytes = compData;
      }
      break;
    }

    offset = dataStart + compSize;
  }

  if (!documentXmlBytes) {
    return fallbackExtractTextFromBinary(bytes);
  }

  // 3. Parse XML content
  const xmlString = decoder.decode(documentXmlBytes);
  return parseDocumentXml(xmlString);
}

/**
 * Parses word/document.xml string into structured paragraphs.
 */
function parseDocumentXml(xmlString: string): DocxParagraph[] {
  const paragraphs: DocxParagraph[] = [];

  // Browser environment: use native DOMParser
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
      const pElements = xmlDoc.getElementsByTagName('w:p');

      for (let i = 0; i < pElements.length; i++) {
        const p = pElements[i];
        const isHeading =
          p.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val')?.toLowerCase().includes('heading') ||
          false;
        const isBold = p.getElementsByTagName('w:b').length > 0;

        const textNodes = p.getElementsByTagName('w:t');
        let pText = '';
        for (let j = 0; j < textNodes.length; j++) {
          pText += textNodes[j].textContent || '';
        }

        const cleaned = sanitizeTextForWinAnsi(pText).trim();
        if (cleaned) {
          paragraphs.push({
            text: cleaned,
            isHeading: isHeading || (isBold && cleaned.length < 80),
            isBold,
          });
        }
      }

      if (paragraphs.length > 0) return paragraphs;
    } catch {
      // Fallback to regex parser
    }
  }

  // Regex fallback for non-DOM / test environments
  const pRegex = /<w:p(?:\s+[^>]*)?>([\s\S]*?)<\/w:p>/g;
  let match: RegExpExecArray | null;

  while ((match = pRegex.exec(xmlString)) !== null) {
    const pContent = match[1];
    const isHeading = /<w:pStyle[^>]*w:val="[^"]*heading[^"]*"/i.test(pContent);
    const isBold = /<w:b(?:\s+[^>]*|\/)?>/i.test(pContent);

    const tMatches = Array.from(pContent.matchAll(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g));
    const text = tMatches.map((m) => m[1]).join('').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const cleaned = sanitizeTextForWinAnsi(text).trim();

    if (cleaned) {
      paragraphs.push({
        text: cleaned,
        isHeading: isHeading || (isBold && cleaned.length < 80),
        isBold,
      });
    }
  }

  return paragraphs;
}

/**
 * Fallback to extract printable ASCII string sequences from legacy or unparseable binary files.
 */
function fallbackExtractTextFromBinary(bytes: Uint8Array): DocxParagraph[] {
  const result: string[] = [];
  let currentWord = '';

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
      currentWord += String.fromCharCode(byte);
    } else {
      if (currentWord.trim().length >= 4) {
        result.push(currentWord.trim());
      }
      currentWord = '';
    }
  }
  if (currentWord.trim().length >= 4) {
    result.push(currentWord.trim());
  }

  const sanitized = sanitizeTextForWinAnsi(result.join(' '));
  return [
    {
      text: sanitized.slice(0, 5000),
      isHeading: false,
      isBold: false,
    },
  ];
}
