import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Filter,
  X,
  ShieldCheck,
  FileText,
  Merge,
  Scissors,
  Minimize2,
  FileEdit,
  FileSignature,
  ImageIcon,
  Lock,
  ArrowRight,
  Camera,
} from 'lucide-react';
import { TOOLS } from '../data/toolsData';
import { ToolCard } from '../components/common/ToolCard';
import { NormalCategory } from '../types/tools';

const CATEGORIES: NormalCategory[] = [
  'All',
  'Files',
  'Math',
  'Images',
  'Generate',
  'Text',
  'Network',
  'Time',
  'Security',
];

const TOP_PDF_ACTIONS = [
  { id: 'merge', name: 'Merge PDF', icon: Merge, color: 'bg-rose-500 text-white', desc: 'Combine multiple PDFs' },
  { id: 'split', name: 'Split PDF', icon: Scissors, color: 'bg-amber-500 text-white', desc: 'Extract pages & ranges' },
  { id: 'compress', name: 'Compress PDF', icon: Minimize2, color: 'bg-emerald-500 text-white', desc: 'Reduce PDF file size' },
  { id: 'ocr', name: 'OCR PDF', icon: FileText, color: 'bg-emerald-600 text-white', desc: 'Make PDF searchable' },
  { id: 'pdf-to-word', name: 'PDF to Word', icon: FileEdit, color: 'bg-blue-500 text-white', desc: 'Convert to DOCX' },
  { id: 'sign', name: 'Sign PDF', icon: FileSignature, color: 'bg-indigo-600 text-white', desc: 'Draw & stamp signatures' },
  { id: 'protect', name: 'Protect PDF', icon: Lock, color: 'bg-blue-700 text-white', desc: 'Encrypt with password' },
  { id: 'scan-pdf', name: 'Scan to PDF', icon: Camera, color: 'bg-orange-500 text-white', desc: 'Capture from camera' },
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
    <div className="space-y-10 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* TOP BUSINESS SHOWCASE: ALL-IN-ONE PDF SUITE (ON TOP)     */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50/80 via-white to-indigo-50/70 dark:from-surface-900 dark:via-surface-900 dark:to-indigo-950/40 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/70 dark:border-slate-800/80">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <FileText className="w-3.5 h-3.5" />
              <span>Featured PDF Productivity Suite</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Professional PDF Tools, <span className="text-rose-600 dark:text-rose-400">100% In Your Browser</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Merge, split, compress, convert, sign, watermark, and encrypt documents. No uploads to external servers, no limits, and complete client-side data privacy.
            </p>
          </div>

          <Link
            to="/normalUser/pdf-tools"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md shadow-slate-900/10 shrink-0 transition-all"
          >
            <span>Explore All 31 PDF Utilities</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Quick Access PDF Cards Carousel / Grid */}
        <div className="pt-6">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
            Quick Actions
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
            {TOP_PDF_ACTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={`/normalUser/pdf-tools?mode=${item.id}`}
                  className="premium-card group p-3.5 rounded-2xl bg-white dark:bg-surface-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:border-rose-500/50 flex flex-col items-center text-center justify-between"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm mb-2 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors block">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* EVERYDAY TOOLS CATALOGUE                                 */}
      {/* ======================================================== */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Everyday Utility Catalogue
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Calculators, image studio, speed benchmarks, Wi-Fi QR generator, and world clocks.
            </p>
          </div>

          {/* Local Only Toggle */}
          <button
            onClick={() => setLocalOnly(!localOnly)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all self-start sm:self-auto ${
              localOnly
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-white dark:bg-surface-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>100% Local Only</span>
          </button>
        </div>

        {/* Search Bar & Category Pills */}
        <div className="space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search utilities (e.g. calculator, qr, speed, words, ip)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-sm transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
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
          <div className="text-center py-16 bg-white dark:bg-surface-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">No utilities matching &ldquo;{search}&rdquo;</h3>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your search query or reset category filter.</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setLocalOnly(false);
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-500"
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
    </div>
  );
};
