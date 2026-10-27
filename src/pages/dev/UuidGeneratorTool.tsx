import React, { useState, useEffect } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import {
  Fingerprint,
  RefreshCw,
  Copy,
  Download,
  Trash2,
  Check,
  ShieldCheck,
} from 'lucide-react';

export const UuidGeneratorTool: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'uuid-generator')!;
  const { showToast } = useToast();

  const [count, setCount] = useState<number>(5);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [includeHyphens, setIncludeHyphens] = useState<boolean>(true);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateUuids = () => {
    const generated: string[] = [];
    for (let i = 0; i < count; i++) {
      let id = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });

      if (!includeHyphens) {
        id = id.replace(/-/g, '');
      }
      if (uppercase) {
        id = id.toUpperCase();
      }
      generated.push(id);
    }
    setUuids(generated);
  };

  useEffect(() => {
    generateUuids();
  }, [count, uppercase, includeHyphens]);

  const copySingle = (uuid: string, idx: number) => {
    navigator.clipboard.writeText(uuid);
    setCopiedIndex(idx);
    showToast(`Copied ${uuid}`);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join('\n'));
    showToast(`Copied ${uuids.length} UUIDs to clipboard!`);
  };

  const downloadTxt = () => {
    const blob = new Blob([uuids.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uuids-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded UUID text file');
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Generator Configuration Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <div className="space-y-1">
            <span className="text-slate-400 block text-[11px]">Quantity</span>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <option value={1}>1 UUID</option>
              <option value={5}>5 UUIDs</option>
              <option value={10}>10 UUIDs</option>
              <option value={25}>25 UUIDs</option>
              <option value={50}>50 UUIDs</option>
              <option value={100}>100 UUIDs</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-4">
            <input
              type="checkbox"
              checked={includeHyphens}
              onChange={(e) => setIncludeHyphens(e.target.checked)}
              className="rounded accent-brand-600"
            />
            <span>Include Hyphens</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer pt-4">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded accent-brand-600"
            />
            <span>Uppercase</span>
          </label>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <button
            onClick={generateUuids}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-semibold text-xs shadow-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </button>
          <button
            onClick={copyAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy All</span>
          </button>
          <button
            onClick={downloadTxt}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* UUIDs List */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          <span>Version 4 UUIDs (crypto.randomUUID)</span>
          <span>{uuids.length} item(s)</span>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {uuids.map((id, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800/80 font-mono text-xs group hover:border-brand-500/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-sans text-[11px] w-6">#{idx + 1}</span>
                <span className="font-semibold text-slate-900 dark:text-white select-all">{id}</span>
              </div>
              <button
                onClick={() => copySingle(id, idx)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  copiedIndex === idx
                    ? 'text-emerald-500 bg-emerald-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Copy single UUID"
              >
                {copiedIndex === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <RelatedTools currentTool={tool} />
    </div>
  );
};
