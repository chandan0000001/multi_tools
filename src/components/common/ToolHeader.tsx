import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ToolMetadata } from '../../types/tools';
import { PrivacyBadge } from './PrivacyBadge';
import { IconResolver } from './IconResolver';

interface ToolHeaderProps {
  tool: ToolMetadata;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({ tool }) => {
  const [showGuide, setShowGuide] = useState(false);
  const catalogueUrl = tool.audience === 'developers' ? '/developers' : '/normalUser';
  const catalogueName = tool.audience === 'developers' ? 'Developer Tools' : 'Everyday Tools';

  return (
    <div className="mb-6 space-y-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link
          to={catalogueUrl}
          className="hover:text-brand-500 dark:hover:text-brand-400 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {catalogueName}</span>
        </Link>
        <span>/</span>
        <span className="text-slate-400 dark:text-slate-500">{tool.category}</span>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-200 font-medium">{tool.title}</span>
      </nav>

      {/* Main Title & Privacy Meta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0">
            <IconResolver name={tool.iconName} className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {tool.title}
              </h1>
              {tool.badge && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-brand-500 text-white shadow-sm">
                  {tool.badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              {tool.shortDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <PrivacyBadge type={tool.privacy} />
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Guide & Limits</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Guide / "Before you use this tool" */}
      {showGuide && (
        <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
            <Info className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Before you use this tool: </span>
              {tool.beforeYouUse || tool.privacyNotice}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
            {tool.bestFor && tool.bestFor.length > 0 && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
                <div className="font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Best For</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-emerald-900/80 dark:text-emerald-300/80">
                  {tool.bestFor.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {tool.limitations && tool.limitations.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                <div className="font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Limitations & Security</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-900/80 dark:text-amber-300/80">
                  {tool.limitations.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {tool.networkDisclosure && (
            <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="font-semibold">Network behavior: </span>
              {tool.networkDisclosure}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
