import React, { useState, useEffect } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import {
  Link as LinkIcon,
  Copy,
  Trash2,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface ParsedUrl {
  protocol: string;
  host: string;
  pathname: string;
  hash: string;
  params: { key: string; value: string }[];
}

export const UrlEncoderTool: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'url-encoder')!;
  const { showToast } = useToast();

  const [inputUrl, setInputUrl] = useState(
    'https://example.com/api/v1/search?query=react+tools&sort=asc&tag=developer#overview'
  );
  const [outputUrl, setOutputUrl] = useState('');
  const [parsedUrl, setParsedUrl] = useState<ParsedUrl | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Encode/decode actions
  const handleEncodeComponent = () => {
    try {
      setOutputUrl(encodeURIComponent(inputUrl));
      showToast('Encoded as URI Component');
    } catch {
      showToast('Encoding failed', 'error');
    }
  };

  const handleEncodeFull = () => {
    try {
      setOutputUrl(encodeURI(inputUrl));
      showToast('Encoded as Full URI');
    } catch {
      showToast('Encoding failed', 'error');
    }
  };

  const handleDecode = () => {
    try {
      setOutputUrl(decodeURIComponent(inputUrl));
      showToast('Decoded URI successfully');
    } catch (err: any) {
      showToast('Malformed percent-encoding syntax', 'error');
    }
  };

  // Parse URL components
  useEffect(() => {
    setErrorMsg(null);
    if (!inputUrl.trim()) {
      setParsedUrl(null);
      return;
    }

    try {
      // Validate full or relative URL
      const dummyBase = 'http://localhost';
      const u = inputUrl.startsWith('http') ? new URL(inputUrl) : new URL(inputUrl, dummyBase);

      const params: { key: string; value: string }[] = [];
      u.searchParams.forEach((value, key) => {
        params.push({ key, value });
      });

      setParsedUrl({
        protocol: u.protocol,
        host: u.host,
        pathname: u.pathname,
        hash: u.hash,
        params,
      });
    } catch (err: any) {
      setErrorMsg('Not a valid full URL structure for parameter parsing');
      setParsedUrl(null);
    }
  }, [inputUrl]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleEncodeComponent}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white"
          >
            Encode Component
          </button>
          <button
            onClick={handleEncodeFull}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
          >
            Encode Full URI
          </button>
          <button
            onClick={handleDecode}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Decode URI
          </button>
        </div>

        <button
          onClick={() => {
            setInputUrl('');
            setOutputUrl('');
          }}
          className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear
        </button>
      </div>

      {/* Input / Output Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Input URL or String</span>
            <span className="font-mono text-slate-400">{inputUrl.length} chars</span>
          </div>
          <textarea
            rows={5}
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Paste your URL or query string..."
            className="w-full p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Processed Output</span>
            {outputUrl && (
              <button
                onClick={() => copyToClipboard(outputUrl)}
                className="text-brand-500 hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            )}
          </div>
          <textarea
            readOnly
            rows={5}
            value={outputUrl}
            placeholder="Click one of the encode/decode actions above to see output..."
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-indigo-400 focus:outline-none"
          />
        </div>
      </div>

      {/* URL Parameter & Anatomy Inspector */}
      {parsedUrl && (
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            URL Component Inspector
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono">
              <span className="text-[10px] text-slate-400 block font-sans">Protocol</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{parsedUrl.protocol}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono">
              <span className="text-[10px] text-slate-400 block font-sans">Host</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{parsedUrl.host}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono">
              <span className="text-[10px] text-slate-400 block font-sans">Path</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{parsedUrl.pathname}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono">
              <span className="text-[10px] text-slate-400 block font-sans">Fragment / Hash</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{parsedUrl.hash || 'None'}</span>
            </div>
          </div>

          {/* Query Params Table */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Query Parameters ({parsedUrl.params.length})
            </span>
            {parsedUrl.params.length === 0 ? (
              <p className="text-xs text-slate-400">No query parameters found in this URL.</p>
            ) : (
              <div className="space-y-1.5">
                {parsedUrl.params.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-brand-500 font-semibold">{p.key}</span>
                      <span className="text-slate-400">=</span>
                      <span className="text-slate-800 dark:text-slate-200">{p.value}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(p.value)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Copy value"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <RelatedTools currentTool={tool} />
    </div>
  );
};
