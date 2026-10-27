import React, { useState, useEffect } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import {
  Hash as HashIcon,
  Copy,
  Download,
  Trash2,
  UploadCloud,
  Key,
  ShieldCheck,
  FileText,
} from 'lucide-react';

export const HashCalculatorTool: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'hash-calculator')!;
  const { showToast } = useToast();

  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('The quick brown fox jumps over the lazy dog');
  const [hmacSecret, setHmacSecret] = useState('');
  const [useHmac, setUseHmac] = useState(false);

  // File hashing state
  const [fileName, setFileName] = useState('');
  const [fileProgress, setFileProgress] = useState<number | null>(null);

  // Hash results
  const [hashes, setHashes] = useState({
    sha1: '',
    sha256: '',
    sha384: '',
    sha512: '',
    md5: '',
    hmacSha256: '',
  });

  // Simple MD5 JS implementation
  const md5Cycle = (x: any, k: any) => {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  };

  const cmn = (q: number, a: number, b: number, x: number, s: number, t: number) => {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  };
  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn((b & c) | (~b & d), a, b, x, s, t);
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn((b & d) | (c & ~d), a, b, x, s, t);
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn(b ^ c ^ d, a, b, x, s, t);
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn(c ^ (b | ~d), a, b, x, s, t);
  const add32 = (a: number, b: number) => (a + b) & 0xffffffff;

  const calculateMd5 = (str: string): string => {
    const n = str.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i;
    for (i = 64; i <= str.length; i += 64) {
      md5Cycle(state, md5blk(str.substring(i - 64, i)));
    }
    const tail = str.substring(i - 64);
    const tailBlk = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let j = 0; j < tail.length; j++) {
      tailBlk[j >> 2] |= tail.charCodeAt(j) << ((j % 4) << 3);
    }
    tailBlk[tail.length >> 2] |= 0x80 << ((tail.length % 4) << 3);
    if (tail.length > 55) {
      md5Cycle(state, tailBlk);
      for (let j = 0; j < 16; j++) tailBlk[j] = 0;
    }
    tailBlk[14] = n * 8;
    md5Cycle(state, tailBlk);
    return state.map((v) => ('00000000' + (v >>> 0).toString(16)).slice(-8).match(/../g)!.reverse().join('')).join('');
  };

  const md5blk = (s: string) => {
    const md5blks: number[] = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] =
        s.charCodeAt(i) +
        (s.charCodeAt(i + 1) << 8) +
        (s.charCodeAt(i + 2) << 16) +
        (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  };

  // Web Crypto API buffer to hex helper
  const bufferToHex = (buffer: ArrayBuffer): string => {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Compute all hashes
  const computeHashes = async (dataBuffer: ArrayBuffer, rawStr?: string) => {
    const [sha1Buf, sha256Buf, sha384Buf, sha512Buf] = await Promise.all([
      crypto.subtle.digest('SHA-1', dataBuffer),
      crypto.subtle.digest('SHA-256', dataBuffer),
      crypto.subtle.digest('SHA-384', dataBuffer),
      crypto.subtle.digest('SHA-512', dataBuffer),
    ]);

    let hmacVal = '';
    if (useHmac && hmacSecret) {
      try {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          enc.encode(hmacSecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);
        hmacVal = bufferToHex(signature);
      } catch {
        hmacVal = 'HMAC Generation Error';
      }
    }

    const md5Val = rawStr ? calculateMd5(rawStr) : 'N/A for large files';

    setHashes({
      sha1: bufferToHex(sha1Buf),
      sha256: bufferToHex(sha256Buf),
      sha384: bufferToHex(sha384Buf),
      sha512: bufferToHex(sha512Buf),
      md5: md5Val,
      hmacSha256: hmacVal,
    });
  };

  useEffect(() => {
    if (inputMode === 'text') {
      const enc = new TextEncoder();
      computeHashes(enc.encode(text).buffer, text);
    }
  }, [text, inputMode, useHmac, hmacSecret]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileProgress(0);
    const arrayBuffer = await file.arrayBuffer();
    setFileProgress(100);
    await computeHashes(arrayBuffer);
    showToast(`Computed cryptographic hashes for ${file.name}`);
  };

  const copyDigest = (digest: string) => {
    navigator.clipboard.writeText(digest);
    showToast('Copied hash digest!');
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Switcher & HMAC Configuration */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setInputMode('text')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                inputMode === 'text'
                  ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Text Payload
            </button>
            <button
              onClick={() => setInputMode('file')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                inputMode === 'file'
                  ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              File Checksum
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={useHmac}
              onChange={(e) => setUseHmac(e.target.checked)}
              className="rounded accent-brand-600"
            />
            <span className="flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sign with HMAC Secret Key</span>
            </span>
          </label>
        </div>

        {useHmac && (
          <div className="space-y-1 animate-in fade-in">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              HMAC Secret Key
            </label>
            <input
              type="text"
              value={hmacSecret}
              onChange={(e) => setHmacSecret(e.target.value)}
              placeholder="Enter secret key for HMAC-SHA256..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs focus:outline-none focus:border-brand-500"
            />
          </div>
        )}

        {inputMode === 'text' ? (
          <div>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to generate cryptographic digests..."
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:border-brand-500"
            />
          </div>
        ) : (
          <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors">
            <input type="file" onChange={handleFileUpload} className="hidden" />
            <UploadCloud className="w-8 h-8 text-brand-500 mb-1" />
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              {fileName ? `Loaded: ${fileName}` : 'Choose local file to hash'}
            </span>
            <span className="text-[11px] text-slate-400">Processes 100% locally in browser memory</span>
          </label>
        )}
      </div>

      {/* Generated Digests List */}
      <div className="space-y-3">
        {[
          { label: 'SHA-256 (Standard / Recommended)', value: hashes.sha256, bits: '256 bits' },
          { label: 'SHA-512 (High Security)', value: hashes.sha512, bits: '512 bits' },
          { label: 'SHA-384', value: hashes.sha384, bits: '384 bits' },
          { label: 'SHA-1 (Legacy / Git checksums)', value: hashes.sha1, bits: '160 bits' },
          { label: 'MD5 (Legacy Checksum Only)', value: hashes.md5, bits: '128 bits' },
          ...(useHmac ? [{ label: 'HMAC-SHA256 Signed Digest', value: hashes.hmacSha256, bits: '256 bits' }] : []),
        ].map((item) => (
          <div
            key={item.label}
            className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5 group hover:border-brand-500/40 transition-colors"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">{item.label}</span>
              <span className="text-[10px] text-slate-400 font-mono">{item.bits}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono text-xs text-indigo-400 break-all select-all">
                {item.value || '...'}
              </div>
              <button
                onClick={() => copyDigest(item.value)}
                disabled={!item.value}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-600 hover:text-white shrink-0 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <RelatedTools currentTool={tool} />
    </div>
  );
};
