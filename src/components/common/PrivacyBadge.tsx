import React from 'react';
import { ShieldCheck, Wifi, Cpu } from 'lucide-react';
import { PrivacyClassification } from '../../types/tools';

interface PrivacyBadgeProps {
  type: PrivacyClassification;
  showDetails?: boolean;
  detailedText?: string;
}

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({ type, showDetails = false, detailedText }) => {
  if (type === 'local') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>100% Local</span>
        {showDetails && detailedText && (
          <span className="hidden sm:inline text-emerald-700/80 dark:text-emerald-300/80 font-normal">
            — {detailedText}
          </span>
        )}
      </div>
    );
  }

  if (type === 'network') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <Wifi className="w-3.5 h-3.5" />
        <span>Network Required</span>
        {showDetails && detailedText && (
          <span className="hidden sm:inline text-amber-700/80 dark:text-amber-300/80 font-normal">
            — {detailedText}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
      <Cpu className="w-3.5 h-3.5" />
      <span>Local Core + Live Network</span>
      {showDetails && detailedText && (
        <span className="hidden sm:inline text-blue-700/80 dark:text-blue-300/80 font-normal">
          — {detailedText}
        </span>
      )}
    </div>
  );
};
