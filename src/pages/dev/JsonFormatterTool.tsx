import React, { useState, useEffect } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import { setCachedResult, getCachedResult } from '../../utils/cacheManager';
import {
  Braces,
  Copy,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Minimize2,
  Maximize2,
  ArrowUpDown,
  FileCode,
} from 'lucide-react';

export const JsonFormatterTool: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'json-formatter')!;
  const { showToast } = useToast();

  const [inputJson, setInputJson] = useState<string>(() => {
    return (
      getCachedResult<string>('json-formatter', 'last-input') ||
      JSON.stringify(
        {
          name: 'Multi_Tools',
          version: '1.0.0',
          features: ['local-first', 'privacy', 'responsive', 'developer-friendly'],
          meta: { authors: ['Engineering'], releaseYear: 2026 },
        },
        null,
        2
      )
    );
  });

  const [outputJson, setOutputJson] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [indentSize, setIndentSize] = useState<number>(2);
  const [viewMode, setViewMode] = useState<'raw' | 'tree'>('raw');
  const [parsedObject, setParsedObject] = useState<any>(null);

  // Format JSON
  const formatJson = (indent: number = indentSize, sortKeys: boolean = false) => {
    setErrorMsg(null);
    if (!inputJson.trim()) {
      setOutputJson('');
      setParsedObject(null);
      return;
    }

    try {
      let parsed = JSON.parse(inputJson);
      if (sortKeys && typeof parsed === 'object' && parsed !== null) {
        parsed = sortObjectKeys(parsed);
      }
      setParsedObject(parsed);
      const formatted = JSON.stringify(parsed, null, indent);
      setOutputJson(formatted);
      setCachedResult('json-formatter', 'last-input', inputJson);
    } catch (err: any) {
      setErrorMsg(err.message || 'Syntax Error: Invalid JSON');
      setParsedObject(null);
    }
  };

  // Minify JSON
  const minifyJson = () => {
    setErrorMsg(null);
    try {
      const parsed = JSON.parse(inputJson);
      setParsedObject(parsed);
      const minified = JSON.stringify(parsed);
      setOutputJson(minified);
      showToast('Minified JSON');
    } catch (err: any) {
      setErrorMsg(err.message || 'Syntax Error: Invalid JSON');
    }
  };

  // Sort keys helper
  const sortObjectKeys = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.keys(obj)
        .sort()
        .reduce((acc: any, key: string) => {
          acc[key] = sortObjectKeys(obj[key]);
          return acc;
        }, {});
    }
    return obj;
  };

  useEffect(() => {
    formatJson(indentSize);
  }, [inputJson, indentSize]);

  const copyOutput = () => {
    navigator.clipboard.writeText(outputJson || inputJson);
    showToast('Copied JSON to clipboard');
  };

  const downloadJson = () => {
    const blob = new Blob([outputJson || inputJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded JSON file');
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => formatJson(2)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Format (2-space)</span>
          </button>
          <button
            onClick={() => formatJson(4)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            4-space
          </button>
          <button
            onClick={minifyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Minify</span>
          </button>
          <button
            onClick={() => formatJson(indentSize, true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort Keys</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyOutput}
            disabled={!outputJson && !inputJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 disabled:opacity-40"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
          <button
            onClick={downloadJson}
            disabled={!outputJson && !inputJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          <button
            onClick={() => {
              setInputJson('');
              setOutputJson('');
              setErrorMsg(null);
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error alert if syntax invalid */}
      {errorMsg ? (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-mono font-semibold">{errorMsg}</span>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Valid JSON structure parsed successfully</span>
        </div>
      )}

      {/* Editor & Formatted Output Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Raw Input JSON</span>
            <span className="font-mono text-slate-400">{inputJson.length} bytes</span>
          </div>
          <textarea
            rows={18}
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder="Paste raw or unformatted JSON here..."
            className="w-full p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed focus:outline-none focus:border-brand-500 shadow-sm"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Formatted / Minified Result</span>
            <span className="font-mono text-slate-400">{outputJson.length} bytes</span>
          </div>
          <textarea
            readOnly
            rows={18}
            value={outputJson}
            placeholder="Formatted output will appear here..."
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed text-indigo-400 focus:outline-none shadow-inner"
          />
        </div>
      </div>

      <RelatedTools currentTool={tool} />
    </div>
  );
};
