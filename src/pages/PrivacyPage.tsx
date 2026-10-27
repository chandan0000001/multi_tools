import React from 'react';
import { ShieldCheck, Lock, Trash2, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCache } from '../context/CacheContext';
import { useToast } from '../context/ToastContext';

export const PrivacyPage: React.FC = () => {
  const { stats, clearCache } = useCache();
  const { showToast } = useToast();

  const handleClear = () => {
    const cleared = clearCache();
    showToast(`Removed ${cleared} item(s) from your browser storage.`, 'info');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Privacy & Data Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Transparent Privacy Principles
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Multi_Tools is designed so you retain full control and confidentiality over your data.
        </p>
      </div>

      {/* Storage Management Panel */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-brand-500" />
              <span>Browser Storage Status</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Currently holding <strong>{stats.count}</strong> cached calculation result(s) (~{(stats.totalSizeBytes / 1024).toFixed(1)} KB)
              with an automatic 24-hour expiration rule.
            </p>
          </div>

          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge All Local Cache Now</span>
          </button>
        </div>
      </div>

      {/* Section 8 Details */}
      <div className="space-y-6 text-sm text-slate-600 dark:text-slate-400">
        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>1. Local-First Processing Guarantee</span>
          </h3>
          <p className="leading-relaxed">
            All primary file conversions (PDF merging, image resizing/compression), text manipulations, hashes,
            regex evaluations, and UUID generations execute strictly inside your local browser runtime. No files
            or texts are transmitted to any backend web service.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-500" />
            <span>2. Strict Security Exceptions (No Secret Persistence)</span>
          </h3>
          <p className="leading-relaxed">
            As outlined in our Product Requirements Document (PRD Section 8), the 24-hour browser result cache
            strictly forbids storing:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-500 dark:text-slate-400 pl-2">
            <li>Generated passwords and Diceware passphrases</li>
            <li>JWT input tokens and decoded claims</li>
            <li>Wi-Fi network credentials and contact vCard data</li>
            <li>Raw uploaded document files or binary blobs</li>
            <li>API keys or authentication bearer credentials</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>3. Explicit Network Utility Disclosures</span>
          </h3>
          <p className="leading-relaxed">
            Certain network benchmarking tools inherently require external connections:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white">Network Speed Test:</span>
              <p className="mt-1 text-slate-500">
                Transfers temporary random chunk payloads via public edge nodes to measure bandwidth, latency, and jitter.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white">IP & Geolocation Checker:</span>
              <p className="mt-1 text-slate-500">
                Queries public IP endpoints (ipify / ipapi) to retrieve your public-facing network address and ASN.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
