import React from 'react';
import { ToolMetadata } from '../../types/tools';
import { TOOLS } from '../../data/toolsData';
import { ToolCard } from './ToolCard';
import { Sparkles } from 'lucide-react';

interface RelatedToolsProps {
  currentTool: ToolMetadata;
}

export const RelatedTools: React.FC<RelatedToolsProps> = ({ currentTool }) => {
  const related = TOOLS.filter(
    (t) =>
      t.id !== currentTool.id &&
      (t.audience === currentTool.audience || t.category === currentTool.category)
  ).slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-brand-500" />
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Related Tools</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {related.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
};
