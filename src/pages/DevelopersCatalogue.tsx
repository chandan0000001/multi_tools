import React, { useState, useMemo } from 'react';
import { Search, Code2, Terminal, X, ShieldCheck, Cpu } from 'lucide-react';
import { TOOLS } from '../data/toolsData';
import { ToolCard } from '../components/common/ToolCard';
import { DeveloperCategory } from '../types/tools';

const DEV_CATEGORIES: DeveloperCategory[] = [
  'All',
  'Formatters',
  'Encoders/Converters',
  'Security',
  'Generators',
  'Web/SEO',
  'Text',
];

export const DevelopersCatalogue: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DeveloperCategory>('All');

  const devTools = useMemo(() => {
    return TOOLS.filter((t) => t.audience === 'developers');
  }, []);

  const filteredTools = useMemo(() => {
    return devTools.filter((t) => {
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.shortDesc.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [devTools, selectedCategory, search]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Dev Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Terminal className="w-3.5 h-3.5" />
              <span>developer_workspace:~/v1.0</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              Developer Utilities & Diagnostics
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
              Client-side JSON beautifiers, regex debuggers, Base64 converters, cryptographic WebCrypto hashes,
              JWT inspection, UUID batch generators, and SEO analyzers.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-950 border border-slate-800 text-xs font-mono text-slate-400 space-y-1.5 shrink-0 hidden sm:block">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero external payload dispatch</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-400">
              <Cpu className="w-4 h-4" />
              <span>SubtleCrypto & Native RegExp engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls: Search & Category Filter Pills */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search developer tools (e.g. json, regex, hash, jwt, uuid)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-slate-500 self-center">
            {filteredTools.length} dev tool(s) found
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {DEV_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/20'
                  : 'bg-white dark:bg-surface-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Tools */}
      {filteredTools.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-surface-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Code2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white font-mono">No matching tools</h3>
          <p className="mt-1 text-xs text-slate-500">
            Check your query or select &quot;All&quot; categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
};
