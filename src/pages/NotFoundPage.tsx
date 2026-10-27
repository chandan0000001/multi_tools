import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Code2, AlertTriangle, ArrowRight } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        404 — Tool Not Found
      </h1>

      <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md">
        The tool or page you requested does not exist or has moved. Choose a workspace catalogue below to continue:
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full max-w-md justify-center">
        <Link
          to="/normalUser"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/20 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Everyday Tools</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <Link
          to="/developers"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 transition-all"
        >
          <Code2 className="w-4 h-4" />
          <span>Developer Tools</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
