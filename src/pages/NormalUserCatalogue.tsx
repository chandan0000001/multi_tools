import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Filter, X, ShieldCheck } from 'lucide-react';
import { TOOLS } from '../data/toolsData';
import { ToolCard } from '../components/common/ToolCard';
import { NormalCategory } from '../types/tools';

const CATEGORIES: NormalCategory[] = [
  'All',
  'Math',
  'Files',
  'Images',
  'Generate',
  'Text',
  'Network',
  'Time',
  'Security',
];

export const NormalUserCatalogue: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NormalCategory>('All');
  const [localOnly, setLocalOnly] = useState(false);

  const normalTools = useMemo(() => {
    return TOOLS.filter((t) => t.audience === 'normalUser');
  }, []);

  const filteredTools = useMemo(() => {
    return normalTools.filter((t) => {
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
      const matchesLocal = !localOnly || t.privacy === 'local';
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.shortDesc.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q));

      return matchesCategory && matchesLocal && matchesSearch;
    });
  }, [normalTools, selectedCategory, localOnly, search]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900/40 via-surface-900 to-indigo-950/40 border border-brand-500/20 p-6 sm:p-10 shadow-lg">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Everyday Browser Utilities</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Fast, Private & <span className="text-brand-400">Local-First</span> Utilities
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Manipulate PDFs, compress images, generate Wi-Fi QR codes, calculate loans, and test speeds.
            Everything processes directly in your browser without tracking or uploading your personal files.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> No file uploads to servers
            </span>
            <span>•</span>
            <span>No account required</span>
            <span>•</span>
            <span>24h offline cache</span>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Controls: Search & Category Filter Pills */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter everyday tools (e.g. calculator, qr, image, speed)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors shadow-sm"
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

          {/* Local Only Toggle */}
          <button
            onClick={() => setLocalOnly(!localOnly)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              localOnly
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-white dark:bg-surface-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>100% Local Only</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-1 text-slate-400 text-xs mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'bg-white dark:bg-surface-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-surface-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No utilities found</h3>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search query or reset category filter.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setLocalOnly(false);
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-colors"
          >
            Reset Filters
          </button>
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
