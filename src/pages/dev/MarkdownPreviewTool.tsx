import React, { useState, useMemo } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import {
  FileCode,
  Copy,
  Download,
  Trash2,
  Eye,
  Edit3,
  Columns,
} from 'lucide-react';

const INITIAL_MD = `# Multi_Tools — Browser-First Utilities

Multi_Tools is designed with **local-first** processing, strict **24-hour cache policies**, and zero unnecessary backend collection.

## Key Features
- **Fast:** Instant client-side execution.
- **Private:** Files never leave your browser sandbox.
- **Developer Workspace:** Formatter, Regex, Hashes, and SEO preview.

### Sample Code Block
\`\`\`javascript
const computeHash = async (text) => {
  const enc = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};
\`\`\`

> "Local-first software gives users ownership, agency, and data longevity."

| Feature | Local | Cloud Dependency |
| :--- | :---: | :---: |
| PDF Merge | Yes | No |
| Image Optimize | Yes | No |
| Network Speed | No | Yes |
`;

export const MarkdownPreviewTool: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'markdown-preview')!;
  const { showToast } = useToast();

  const [markdown, setMarkdown] = useState<string>(INITIAL_MD);
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');

  // Lightweight safe Markdown to HTML parser with XSS defense
  const safeHtml = useMemo(() => {
    // 1. Escape HTML special characters to prevent script injection
    let out = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Fenced code blocks
    out = out.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="p-3 my-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs overflow-x-auto"><code>${code.trim()}</code></pre>`;
    });

    // 3. Inline code
    out = out.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 font-mono text-xs">$1</code>');

    // 4. Headers
    out = out.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">$1</h3>');
    out = out.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2 pb-1 border-b border-slate-200 dark:border-slate-800">$1</h2>');
    out = out.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold text-slate-900 dark:text-white mt-6 mb-3">$1</h1>');

    // 5. Blockquotes
    out = out.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-brand-500 pl-4 py-1 my-3 text-slate-600 dark:text-slate-400 italic text-sm">$1</blockquote>');

    // 6. Emphasis
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

    // 7. Unordered lists
    out = out.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-sm text-slate-700 dark:text-slate-300">$1</li>');

    // 8. Paragraphs & line breaks
    out = out.replace(/\n\n/g, '<p class="my-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300"></p>');

    return out;
  }, [markdown]);

  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const chars = markdown.length;

  const downloadMd = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded .md document');
  };

  const downloadHtml = () => {
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Exported Markdown</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333;}</style></head><body>${safeHtml}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded sanitized HTML');
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              viewMode === 'split' ? 'bg-white dark:bg-surface-900 text-brand-500 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>
          <button
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              viewMode === 'edit' ? 'bg-white dark:bg-surface-900 text-brand-500 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor Only</span>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              viewMode === 'preview' ? 'bg-white dark:bg-surface-900 text-brand-500 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Only</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadMd}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export MD</span>
          </button>
          <button
            onClick={downloadHtml}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export HTML</span>
          </button>
          <button
            onClick={() => setMarkdown('')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500"
            title="Clear markdown"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor & Preview Viewport */}
      <div className={`grid gap-4 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {(viewMode === 'split' || viewMode === 'edit') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Markdown Source</span>
              <span className="font-mono text-slate-400">{words} words • {chars} chars</span>
            </div>
            <textarea
              rows={22}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Type markdown here..."
              className="w-full p-4 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed focus:outline-none focus:border-brand-500 shadow-sm"
            />
          </div>
        )}

        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Sanitized Render Preview</span>
              <span className="text-emerald-500 font-medium">Safe HTML sandbox</span>
            </div>
            <div
              className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 min-h-[460px] overflow-y-auto prose dark:prose-invert max-w-none shadow-sm"
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          </div>
        )}
      </div>

      <RelatedTools currentTool={tool} />
    </div>
  );
};
