import React from 'react';
import { ShieldCheck, Cpu, Database, EyeOff, Zap, CheckCircle2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          About Multi_Tools
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400">
          A modern, privacy-first multi-utility platform executing tasks directly in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Local-First Architecture</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Whenever technically possible, operations run inside browser sandboxes using WebCrypto, Canvas API, and Web Workers.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Zero Surveillance</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            We don&apos;t store your passwords, JWT tokens, files, or sensitive queries on any remote server.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Instantaneous & Free</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            No signup forms, credit cards, or account requirements. Instant deep links and offline-ready utilities.
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-slate-100 dark:bg-surface-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-brand-500" />
          <span>Core Engineering Standards</span>
        </h2>
        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>Transparent Network Disclosures:</strong> Any tool that requires external network communication (such as public IP checks or speed test chunk streaming) clearly states what is requested and why.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>24-Hour Cache Policy:</strong> Deterministic non-sensitive calculations are cached in browser localStorage for up to 24 hours to accelerate repeated tasks, automatically purging upon expiration.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>Strict Security Boundary:</strong> Passwords, private contact details, and JWT claims are strictly excluded from persistent storage.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
