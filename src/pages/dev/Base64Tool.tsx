import React, { useState } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import {
  Binary,
  ArrowRightLeft,
  Copy,
  Download,
  Trash2,
  FileCode,
  UploadCloud,
  Check,
} from 'lucide-react';

export const Base64Tool: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'base64')!;
  const { showToast } = useToast();

  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');
  const [inputText, setInputText] = useState('Hello World 🌍! Multi_Tools 2026');
  const [outputText, setOutputText] = useState('');
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  // UTF-8 safe encode: TextEncoder -> btoa
  const utf8Encode = (str: string): string => {
    const bytes = new TextEncoder().encode(str);
    const binString = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    return btoa(binString);
  };

  // UTF-8 safe decode: atob -> TextDecoder
  const utf8Decode = (b64: string): string => {
    const binString = atob(b64.trim());
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  };

  const handleTransform = () => {
    try {
      if (!inputText) {
        setOutputText('');
        return;
      }
      if (direction === 'encode') {
        const res = utf8Encode(inputText);
        setOutputText(res);
      } else {
        const res = utf8Decode(inputText);
        setOutputText(res);
      }
      showToast(`${direction === 'encode' ? 'Encoded' : 'Decoded'} successfully!`);
    } catch (err: any) {
      showToast('Malformed Base64 string for decoding', 'error');
    }
  };

  // File to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
      showToast(`Encoded file: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const copyResult = () => {
    const textToCopy = mode === 'text' ? outputText : fileBase64;
    navigator.clipboard.writeText(textToCopy);
    showToast('Copied to clipboard!');
  };

  const downloadDecodedFile = () => {
    if (!fileBase64) return;
    const a = document.createElement('a');
    a.href = fileBase64;
    a.download = `decoded-${fileName || 'file'}`;
    a.click();
    showToast('Downloaded file');
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Mode Switches */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setMode('text')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                mode === 'text'
                  ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Text Mode (UTF-8)
            </button>
            <button
              onClick={() => setMode('file')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                mode === 'file'
                  ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Binary File Mode
            </button>
          </div>

          {mode === 'text' && (
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                onClick={() => {
                  setDirection('encode');
                  setOutputText('');
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  direction === 'encode'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Encode
              </button>
              <button
                onClick={() => {
                  setDirection('decode');
                  setOutputText('');
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  direction === 'decode'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Decode
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {mode === 'text' && (
            <button
              onClick={handleTransform}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-semibold text-xs shadow-md transition-colors"
            >
              Execute {direction === 'encode' ? 'Encoding' : 'Decoding'}
            </button>
          )}
          <button
            onClick={copyResult}
            disabled={mode === 'text' ? !outputText : !fileBase64}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 disabled:opacity-40"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
      </div>

      {mode === 'text' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>{direction === 'encode' ? 'Plaintext Input (Unicode / UTF-8)' : 'Base64 Input'}</span>
              <span className="font-mono text-slate-400">{inputText.length} chars</span>
            </div>
            <textarea
              rows={14}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to process..."
              className="w-full p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>{direction === 'encode' ? 'Base64 Encoded Result' : 'Decoded UTF-8 Plaintext'}</span>
              <span className="font-mono text-slate-400">{outputText.length} chars</span>
            </div>
            <textarea
              readOnly
              rows={14}
              value={outputText}
              placeholder="Output will appear here after execution..."
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-indigo-400 focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors">
            <input type="file" onChange={handleFileUpload} className="hidden" />
            <UploadCloud className="w-10 h-10 text-brand-500 mb-2" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Choose any file to convert to Data URI Base64
            </span>
            <span className="text-xs text-slate-400 mt-1">Images, audio, PDF, or binary blobs</span>
          </label>

          {fileBase64 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Data URI Output ({fileName})</span>
                <button
                  onClick={downloadDecodedFile}
                  className="flex items-center gap-1.5 text-brand-500 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" /> Download File Back
                </button>
              </div>
              <textarea
                readOnly
                rows={8}
                value={fileBase64}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-400 break-all"
              />
            </div>
          )}
        </div>
      )}

      <RelatedTools currentTool={tool} />
    </div>
  );
};
