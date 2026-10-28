import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFArray,
  PDFRawStream,
  PDFString,
  PDFHexString,
  PDFRef,
  PDFParser,
  PDFObjectStreamParser,
  PDFXRefStreamParser,
} from 'pdf-lib';
import { decryptPDF as pdfDecryptOriginal, md5, RC4, hexToBytes, bytesToHex } from '@pdfsmaller/pdf-decrypt';

const PADDING = new Uint8Array([
  0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41,
  0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
  0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80,
  0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A,
]);

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function padPassword(password: string | Uint8Array): Uint8Array {
  const pwdBytes = typeof password === 'string' ? new TextEncoder().encode(password) : password;
  const padded = new Uint8Array(32);
  if (pwdBytes.length >= 32) {
    padded.set(pwdBytes.slice(0, 32));
  } else {
    padded.set(pwdBytes);
    padded.set(PADDING.slice(0, 32 - pwdBytes.length), pwdBytes.length);
  }
  return padded;
}

function extractBytes(pdfObj: any): Uint8Array | null {
  if (!pdfObj) return null;
  if (pdfObj instanceof PDFHexString) return hexToBytes(pdfObj.asString());
  if (pdfObj instanceof PDFString) return pdfObj.asBytes();
  if (typeof pdfObj.asBytes === 'function') return pdfObj.asBytes();
  const str = pdfObj.toString();
  if (str.startsWith('<') && str.endsWith('>')) return hexToBytes(str.slice(1, -1));
  return null;
}

function getNumVal(obj: any): number | undefined {
  if (!obj) return undefined;
  if (typeof obj.asNumber === 'function') return obj.asNumber();
  const n = Number(obj.toString());
  return isNaN(n) ? undefined : n;
}

function getStrVal(obj: any): string {
  if (!obj) return '';
  if (typeof obj.asString === 'function') return obj.asString();
  return obj.toString();
}

/**
 * Compute encryption key for V=4, R=4 (ISO 32000-1 Algorithm 2)
 */
function computeKeyR4(
  password: string | Uint8Array,
  ownerKey: Uint8Array,
  permissions: number,
  fileId: Uint8Array,
  keyLength: number,
  encryptMetadata: boolean
): Uint8Array {
  const padded = padPassword(password);
  const hashInput = new Uint8Array(
    padded.length + ownerKey.length + 4 + fileId.length + (!encryptMetadata ? 4 : 0)
  );

  let off = 0;
  hashInput.set(padded, off);
  off += padded.length;

  hashInput.set(ownerKey, off);
  off += ownerKey.length;

  hashInput[off++] = permissions & 0xFF;
  hashInput[off++] = (permissions >> 8) & 0xFF;
  hashInput[off++] = (permissions >> 16) & 0xFF;
  hashInput[off++] = (permissions >> 24) & 0xFF;

  hashInput.set(fileId, off);
  off += fileId.length;

  if (!encryptMetadata) {
    hashInput[off++] = 0xFF;
    hashInput[off++] = 0xFF;
    hashInput[off++] = 0xFF;
    hashInput[off++] = 0xFF;
  }

  let hash = md5(hashInput);
  for (let i = 0; i < 50; i++) {
    hash = md5(hash.slice(0, keyLength));
  }
  return hash.slice(0, keyLength);
}

/**
 * ISO 32000-1 Algorithm 3.5 (Revision 4 user password validation)
 */
function validateUserPasswordR4(
  password: string | Uint8Array,
  ownerKey: Uint8Array,
  userKey: Uint8Array,
  permissions: number,
  fileId: Uint8Array,
  keyLength: number,
  encryptMetadata: boolean
): Uint8Array | null {
  const key = computeKeyR4(password, ownerKey, permissions, fileId, keyLength, encryptMetadata);

  const hashInput = new Uint8Array(PADDING.length + fileId.length);
  hashInput.set(PADDING);
  hashInput.set(fileId, PADDING.length);
  const hash = md5(hashInput);

  let result = new RC4(key).process(hash);
  for (let i = 1; i <= 19; i++) {
    const iterKey = new Uint8Array(key.length);
    for (let j = 0; j < key.length; j++) iterKey[j] = key[j] ^ i;
    result = new RC4(iterKey).process(result);
  }

  if (arraysEqual(result.slice(0, 16), userKey.slice(0, 16))) {
    return key;
  }
  return null;
}

/**
 * ISO 32000-1 Algorithm 3.7 (Revision 4 owner password validation)
 */
function validateOwnerPasswordR4(
  ownerPassword: string | Uint8Array,
  ownerKey: Uint8Array,
  userKey: Uint8Array,
  permissions: number,
  fileId: Uint8Array,
  keyLength: number,
  encryptMetadata: boolean
): Uint8Array | null {
  const padded = padPassword(ownerPassword);
  let hash = md5(padded);
  for (let i = 0; i < 50; i++) {
    hash = md5(hash);
  }
  const ownerDecryptKey = hash.slice(0, keyLength);

  let result = new Uint8Array(ownerKey);
  for (let i = 19; i >= 0; i--) {
    const iterKey = new Uint8Array(ownerDecryptKey.length);
    for (let j = 0; j < ownerDecryptKey.length; j++) {
      iterKey[j] = ownerDecryptKey[j] ^ i;
    }
    result = new RC4(iterKey).process(result);
  }
  const recoveredUserPwd = result;

  return validateUserPasswordR4(
    recoveredUserPwd,
    ownerKey,
    userKey,
    permissions,
    fileId,
    keyLength,
    encryptMetadata
  );
}

/**
 * ISO 32000-1 Algorithm 1 (Calculation of an object's encryption key for AES-128)
 */
function deriveObjectKeyAES128(encryptionKey: Uint8Array, objectNum: number, generationNum: number): Uint8Array {
  const input = new Uint8Array(encryptionKey.length + 5 + 4);
  input.set(encryptionKey, 0);
  let off = encryptionKey.length;
  input[off++] = objectNum & 0xFF;
  input[off++] = (objectNum >> 8) & 0xFF;
  input[off++] = (objectNum >> 16) & 0xFF;
  input[off++] = generationNum & 0xFF;
  input[off++] = (generationNum >> 8) & 0xFF;
  // "sAlT" per ISO 32000-1 Algorithm 1
  input[off++] = 0x73;
  input[off++] = 0x41;
  input[off++] = 0x6C;
  input[off++] = 0x54;

  return md5(input).slice(0, 16);
}

function deriveObjectKeyRC4(encryptionKey: Uint8Array, objectNum: number, generationNum: number): Uint8Array {
  const input = new Uint8Array(encryptionKey.length + 5);
  input.set(encryptionKey, 0);
  let off = encryptionKey.length;
  input[off++] = objectNum & 0xFF;
  input[off++] = (objectNum >> 8) & 0xFF;
  input[off++] = (objectNum >> 16) & 0xFF;
  input[off++] = generationNum & 0xFF;
  input[off++] = (generationNum >> 8) & 0xFF;
  return md5(input).slice(0, 16);
}

async function decryptAES128Blob(
  data: Uint8Array,
  objectNum: number,
  generationNum: number,
  encryptionKey: Uint8Array
): Promise<Uint8Array> {
  if (data.length < 16) return data;
  const iv = data.slice(0, 16);
  const ciphertext = data.slice(16);
  if (ciphertext.length === 0) return new Uint8Array(0);
  if (ciphertext.length % 16 !== 0) return data;

  const objKey = deriveObjectKeyAES128(encryptionKey, objectNum, generationNum);
  try {
    const cryptoKey = await crypto.subtle.importKey('raw', objKey, 'AES-CBC', false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, ciphertext);
    return new Uint8Array(decrypted);
  } catch {
    return data;
  }
}

async function decryptStringsDirect(
  obj: any,
  objectNum: number,
  generationNum: number,
  encryptionKey: Uint8Array,
  isAES: boolean
) {
  if (!obj) return;
  if (obj instanceof PDFString) {
    const bytes = obj.asBytes();
    if (!isAES || bytes.length >= 16) {
      let dec: Uint8Array;
      if (isAES) {
        dec = await decryptAES128Blob(bytes, objectNum, generationNum, encryptionKey);
      } else {
        const objKey = deriveObjectKeyRC4(encryptionKey, objectNum, generationNum);
        dec = new RC4(objKey).process(bytes);
      }
      (obj as any).value = Array.from(dec).map((b) => String.fromCharCode(b)).join('');
    }
  } else if (obj instanceof PDFHexString) {
    const bytes = obj.asBytes();
    if (!isAES || bytes.length >= 16) {
      let dec: Uint8Array;
      if (isAES) {
        dec = await decryptAES128Blob(bytes, objectNum, generationNum, encryptionKey);
      } else {
        const objKey = deriveObjectKeyRC4(encryptionKey, objectNum, generationNum);
        dec = new RC4(objKey).process(bytes);
      }
      (obj as any).value = bytesToHex(dec);
    }
  } else if (obj instanceof PDFDict) {
    for (const [key, value] of obj.entries()) {
      const keyName = getStrVal(key);
      if (keyName !== '/Length' && keyName !== '/Filter' && keyName !== '/DecodeParms') {
        await decryptStringsDirect(value, objectNum, generationNum, encryptionKey, isAES);
      }
    }
  } else if (obj instanceof PDFArray) {
    for (const element of obj.asArray()) {
      await decryptStringsDirect(element, objectNum, generationNum, encryptionKey, isAES);
    }
  }
}

export interface EncryptionInfo {
  encrypted: boolean;
  algorithm?: 'AES-256' | 'AES-128' | 'RC4';
  version?: number;
  revision?: number;
  keyLength?: number;
}

/**
 * Checks whether a PDF is encrypted and extracts encryption parameters
 */
export async function checkPdfEncryption(pdfBytes: Uint8Array): Promise<EncryptionInfo> {
  const origWarn = console.warn;
  console.warn = () => {};
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true, updateMetadata: false });
    const trailer = pdfDoc.context.trailerInfo;
    const encryptRef = trailer.Encrypt;
    if (!encryptRef) return { encrypted: false };

    let encryptDict: any;
    if (encryptRef instanceof PDFRef) {
      encryptDict = pdfDoc.context.lookup(encryptRef);
    } else if (encryptRef instanceof PDFDict) {
      encryptDict = encryptRef;
    } else {
      return { encrypted: false };
    }

    if (!encryptDict || !(encryptDict instanceof PDFDict)) return { encrypted: false };

    const V = encryptDict.get(PDFName.of('V'));
    const R = encryptDict.get(PDFName.of('R'));
    const Length = encryptDict.get(PDFName.of('Length'));

    const version = getNumVal(V) ?? 0;
    const revision = getNumVal(R) ?? 0;

    let algorithm: 'AES-256' | 'AES-128' | 'RC4' = 'RC4';
    let keyLength = 128;

    if (version === 5 && revision === 6) {
      algorithm = 'AES-256';
      keyLength = 256;
    } else if (version === 4) {
      let isAES = true;
      const CF = encryptDict.get(PDFName.of('CF'));
      const StmF = encryptDict.get(PDFName.of('StmF'));
      const filterName = StmF ? getStrVal(StmF).replace('/', '') : 'StdCF';
      if (CF instanceof PDFDict) {
        const filterDict = CF.get(PDFName.of(filterName));
        if (filterDict instanceof PDFDict) {
          const cfmVal = filterDict.get(PDFName.of('CFM'));
          if (cfmVal && getStrVal(cfmVal).replace('/', '') === 'V2') {
            isAES = false;
          }
        }
      }
      algorithm = isAES ? 'AES-128' : 'RC4';
      keyLength = 128;
    } else {
      const lNum = getNumVal(Length) ?? 40;
      keyLength = lNum;
      algorithm = 'RC4';
    }

    return {
      encrypted: true,
      algorithm,
      version,
      revision,
      keyLength,
    };
  } catch {
    return { encrypted: false };
  } finally {
    console.warn = origWarn;
  }
}

/**
 * Universal In-Browser PDF Decryptor supporting:
 * - V=4, R=4 (AES-128 and RC4-128) with incremental updates & Object Streams (/ObjStm)
 * - V=5, R=6 (AES-256)
 * - V=1-3, R=2-3 (RC4 40-bit and 128-bit)
 */
export async function universalDecryptPdf(pdfBytes: Uint8Array, password: string): Promise<Uint8Array> {
  const encInfo = await checkPdfEncryption(pdfBytes);
  if (!encInfo.encrypted) {
    throw new Error('This PDF is not encrypted. No /Encrypt dictionary found.');
  }

  // Handle V=4, R=4 (AES-128 / RC4-128 crypt filters)
  if (encInfo.version === 4) {
    const origWarn = console.warn;
    console.warn = () => {};
    let initialDoc: PDFDocument;
    try {
      initialDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true, updateMetadata: false });
    } finally {
      console.warn = origWarn;
    }

    const trailer = initialDoc.context.trailerInfo;
    const encryptRef = trailer.Encrypt;
    const encryptDict =
      encryptRef instanceof PDFRef
        ? (initialDoc.context.lookup(encryptRef) as PDFDict)
        : (encryptRef as PDFDict);

    if (!encryptDict) {
      throw new Error('Encryption dictionary could not be resolved.');
    }

    const P = encryptDict.get(PDFName.of('P'));
    const O = encryptDict.get(PDFName.of('O'));
    const U = encryptDict.get(PDFName.of('U'));
    const Length = encryptDict.get(PDFName.of('Length'));
    const EncryptMetadata = encryptDict.get(PDFName.of('EncryptMetadata'));
    const CF = encryptDict.get(PDFName.of('CF'));
    const StmF = encryptDict.get(PDFName.of('StmF'));
    const StrF = encryptDict.get(PDFName.of('StrF'));

    const permissions = getNumVal(P) ?? 0;
    const ownerKey = extractBytes(O);
    const userKey = extractBytes(U);

    if (!ownerKey || !userKey) {
      throw new Error('Could not read /O or /U values from encryption dictionary');
    }

    let fileId = new Uint8Array(0);
    const idArray = trailer.ID;
    if (idArray) {
      if (Array.isArray(idArray) && idArray.length > 0) {
        fileId = extractBytes(idArray[0]) || new Uint8Array(0);
      } else if (idArray instanceof PDFArray) {
        const firstId = idArray.lookup(0);
        fileId = extractBytes(firstId) || new Uint8Array(0);
      }
    }

    let isStreamAES = true;
    let isStringAES = true;

    const stmFilterName = StmF ? getStrVal(StmF).replace('/', '') : 'StdCF';
    const strFilterName = StrF ? getStrVal(StrF).replace('/', '') : 'StdCF';

    if (CF instanceof PDFDict) {
      const stmFilterDict = CF.get(PDFName.of(stmFilterName));
      if (stmFilterDict instanceof PDFDict) {
        const cfm = stmFilterDict.get(PDFName.of('CFM'));
        if (cfm && getStrVal(cfm).replace('/', '') === 'V2') {
          isStreamAES = false;
        }
      }
      const strFilterDict = CF.get(PDFName.of(strFilterName));
      if (strFilterDict instanceof PDFDict) {
        const cfm = strFilterDict.get(PDFName.of('CFM'));
        if (cfm && getStrVal(cfm).replace('/', '') === 'V2') {
          isStringAES = false;
        }
      }
    }

    const keyLengthBits = getNumVal(Length) ?? 128;
    const keyLength = keyLengthBits / 8;
    const encryptMetadata = EncryptMetadata ? EncryptMetadata.toString() !== 'false' : true;
    const encryptRefNum = encryptRef instanceof PDFRef ? encryptRef.objectNumber : null;

    let encryptionKey = validateUserPasswordR4(
      password,
      ownerKey,
      userKey,
      permissions,
      fileId,
      keyLength,
      encryptMetadata
    );

    if (!encryptionKey) {
      encryptionKey = validateOwnerPasswordR4(
        password,
        ownerKey,
        userKey,
        permissions,
        fileId,
        keyLength,
        encryptMetadata
      );
    }

    if (!encryptionKey) {
      throw new Error('Incorrect password. The provided password does not match the user or owner password.');
    }

    // Hook PDFParser to decrypt streams and strings as they are parsed,
    // so that Object Streams (/ObjStm) decompress and parse successfully.
    const originalParseIndirectObject = (PDFParser.prototype as any).parseIndirectObject;
    let unlockedBytes: Uint8Array;

    try {
      (PDFParser.prototype as any).parseIndirectObject = async function () {
        const ref = this.parseIndirectObjectHeader();
        this.skipWhitespaceAndComments();
        const object = this.parseObject();
        this.skipWhitespaceAndComments();
        this.matchKeyword('endobj');

        const objectNum = ref.objectNumber;
        const generationNum = ref.generationNumber || 0;

        if (encryptRefNum !== null && objectNum === encryptRefNum) {
          this.context.assign(ref, object);
          return ref;
        }

        if (object instanceof PDFRawStream) {
          const isSigOrXRef = object.dict
            ? object.dict.lookup(PDFName.of('Type')) === PDFName.of('XRef') ||
              object.dict.lookup(PDFName.of('Type')) === PDFName.of('Sig') ||
              (!encryptMetadata && object.dict.lookup(PDFName.of('Type')) === PDFName.of('Metadata'))
            : false;

          if (!isSigOrXRef && object.contents && object.contents.length > 0) {
            if (isStreamAES) {
              (object as any).contents = await decryptAES128Blob(object.contents, objectNum, generationNum, encryptionKey!);
            } else {
              const objKey = deriveObjectKeyRC4(encryptionKey!, objectNum, generationNum);
              (object as any).contents = new RC4(objKey).process(object.contents);
            }
          }

          if (object.dict) {
            await decryptStringsDirect(object.dict, objectNum, generationNum, encryptionKey!, isStringAES);
          }

          if (object.dict && object.dict.lookup(PDFName.of('Type')) === PDFName.of('ObjStm')) {
            await (PDFObjectStreamParser as any).forStream(object, this.shouldWaitForTick).parseIntoContext();
          } else if (object.dict && object.dict.lookup(PDFName.of('Type')) === PDFName.of('XRef')) {
            (PDFXRefStreamParser as any).forStream(object).parseIntoContext();
          } else {
            this.context.assign(ref, object);
          }
        } else {
          if (object instanceof PDFDict || object instanceof PDFArray) {
            await decryptStringsDirect(object, objectNum, generationNum, encryptionKey!, isStringAES);
          }
          this.context.assign(ref, object);
        }

        return ref;
      };

      const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      delete doc.context.trailerInfo.Encrypt;

      unlockedBytes = await doc.save({
        useObjectStreams: false,
        updateFieldAppearances: false,
        addDefaultPage: false,
      });
    } finally {
      (PDFParser.prototype as any).parseIndirectObject = originalParseIndirectObject;
    }

    return unlockedBytes;
  }

  // Fallback to @pdfsmaller/pdf-decrypt for AES-256 and RC4
  return await pdfDecryptOriginal(pdfBytes, password);
}
