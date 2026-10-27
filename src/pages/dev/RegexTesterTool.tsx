import React, { useState, useMemo } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import {
  Code,
  Copy,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface RegexMatch {
  index: number;
  match: string;
  groups: string[];
}

const COMMON_PATTERNS = [
  { label: 'Email Address', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'g' },
  { label: 'URL / Web Link', pattern: 'https?:\\/\\/[\\w\\-\\.]+\\.[a-zA-Z]{2,}(\\/\\S*)?', flags: 'g' },
  { label: 'IPv4 Address', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  { label: 'ISO Date (YYYY-MM-DD)', pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b', flags: 'g' },
  { label: 'Hex Color (#fff / #ffffff)', pattern: '#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\\b', flags: 'g' },
];

export const RegexTesterTool: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'regex-tester')!;
  const { showToast } = useToast();

  const [pattern, setPattern] = useState('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState(
    'Reach out to dev-team@example.org or support@multitools.local for inquiries. Backup: admin101@domain.co.uk'
  );

  // Evaluate regex safely
  const { matches, error, highlightedHtml } = useMemo(() => {
    if (!pattern) return { matches: [], error: null, highlightedHtml: testString };

    try {
      const reg = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      const found: RegexMatch[] = [];

      let m;
      let iterations = 0;
      // Loop protection against catastrophic backtracking
      while ((m = reg.exec(testString)) !== null && iterations < 500) {
        iterations++;
        found.push({
          index: m.index,
          match: m[0],
          groups: m.slice(1),
        });
        if (m.index === reg.lastIndex) reg.lastIndex++; // Avoid infinite loops with zero-length matches
      }

      // Highlight in text safely
      let html = testString
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      if (found.length > 0) {
        // Re-run regex on escaped text
        const safeReg = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
        html = html.replace(
          safeReg,
          (match) => `<mark class="bg-brand-500/30 text-brand-300 font-semibold rounded px-1">${match}</mark>`
        );
      }

      return { matches: found, error: null, highlightedHtml: html };
    } catch (err: any) {
      return { matches: [], error: err.message, highlightedHtml: testString };
    }
  }, [pattern, flags, testString]);

  const toggleFlag = (flagChar: string) => {
    if (flags.includes(flagChar)) {
      setFlags(flags.replace(flagChar, ''));
    } else {
      setFlags(flags + flagChar);
    }
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Pattern & Flags Input */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-sm">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Enter regular expression pattern..."
              className="w-full pl-8 pr-8 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-sm">/</span>
          </div>

          {/* Flags checkboxes */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-mono">
            {['g', 'i', 'm', 's', 'u'].map((f) => (
              <button
                key={f}
                onClick={() => toggleFlag(f)}
                className={`w-7 h-7 rounded-xl font-bold transition-all ${
                  flags.includes(f)
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-white'
                }`}
                title={`Flag: ${f}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-mono">{error}</span>
          </div>
        )}

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] mr-1">
            <Sparkles className="w-3 h-3 text-brand-500" /> Presets:
          </span>
          {COMMON_PATTERNS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setPattern(p.pattern);
                setFlags(p.flags);
                showToast(`Applied ${p.label}`);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 whitespace-nowrap text-[11px]"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Test String and Match Highlight Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Test Sample Text
            </span>
            <textarea
              rows={6}
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Paste or type test string to evaluate against regex..."
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Highlighted Visualizer */}
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Match Highlights</span>
              <span className="text-brand-500 font-mono">{matches.length} match(es) detected</span>
            </div>
            <div
              className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words min-h-[100px]"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </div>
        </div>

        {/* Capture Groups Inspector (Right) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Captured Matches & Indices
            </h3>

            {matches.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No pattern matches found.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {matches.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>Match #{idx + 1}</span>
                      <span>Index: {m.index}</span>
                    </div>
                    <div className="font-bold text-brand-500 break-all">{m.match}</div>
                    {m.groups.length > 0 && (
                      <div className="text-[11px] text-slate-400 pt-1">
                        Groups: {m.groups.map((g, i) => `$${i + 1}: ${g}`).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <RelatedTools currentTool={tool} />
    </div>
  );
};
