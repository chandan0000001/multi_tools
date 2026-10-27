import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ArrowUpDown,
  Check,
} from 'lucide-react';

const INITIAL_MD = `# Multi_Tools — Browser-First Utilities

Multi_Tools is designed with **local-first** processing, strict **24-hour cache policies**, and zero unnecessary backend collection.

## Key Features
- **Fast:** Instant client-side execution.
- **Private:** Files never leave your browser sandbox.
- **Developer Workspace:** Formatter, Regex, Hashes, and SEO preview.
- [x] 100% Local PDF & Image Manipulation
- [x] Synchronized Split-View Markdown Editor
- [ ] Upcoming Offline Sidecar Tools

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

### Feature Matrix Comparison

| Feature | Local Engine | Network Required | Cache Age |
| :--- | :---: | :---: | :---: |
| PDF Merge & Split | Yes (pdf-lib) | No | None |
| Image Optimize | Yes (Canvas) | No | None |
| Speed Test | Local Streamer | Yes | 24 Hours |
| Hash Calculator | WebCrypto API | No | 24 Hours |
| JWT Decoder | Base64URL | No | In-Memory |

---
*Tip: You can edit on the left, and the preview scrolls in real-time on the right!*
`;

export const MarkdownPreviewTool: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'markdown-preview')!;
  const { showToast } = useToast();

  const [markdown, setMarkdown] = useState<string>(INITIAL_MD);
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [syncScroll, setSyncScroll] = useState<boolean>(true);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef<'editor' | 'preview' | null>(null);

  // Synchronized scroll handlers
  const handleEditorScroll = () => {
    if (!syncScroll || isScrollingRef.current === 'preview' || !editorRef.current || !previewRef.current) return;
    isScrollingRef.current = 'editor';
    const { scrollTop, scrollHeight, clientHeight } = editorRef.current;
    const maxScrollTop = scrollHeight - clientHeight;
    const scrollRatio = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;

    const previewMaxScroll = previewRef.current.scrollHeight - previewRef.current.clientHeight;
    previewRef.current.scrollTop = scrollRatio * previewMaxScroll;

    setTimeout(() => {
      if (isScrollingRef.current === 'editor') isScrollingRef.current = null;
    }, 50);
  };

  const handlePreviewScroll = () => {
    if (!syncScroll || isScrollingRef.current === 'editor' || !editorRef.current || !previewRef.current) return;
    isScrollingRef.current = 'preview';
    const { scrollTop, scrollHeight, clientHeight } = previewRef.current;
    const maxScrollTop = scrollHeight - clientHeight;
    const scrollRatio = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;

    const editorMaxScroll = editorRef.current.scrollHeight - editorRef.current.clientHeight;
    editorRef.current.scrollTop = scrollRatio * editorMaxScroll;

    setTimeout(() => {
      if (isScrollingRef.current === 'preview') isScrollingRef.current = null;
    }, 50);
  };

  // Robust, Safe Markdown-to-HTML parser including GFM Tables
  const safeHtml = useMemo(() => {
    // 1. Initial sanitization of raw HTML entities
    let text = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Fenced Code Blocks: ```lang ... ```
    const codeBlocks: string[] = [];
    text = text.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push(
        `<pre class="p-4 my-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs overflow-x-auto shadow-inner"><code class="language-${lang}">${code.trim()}</code></pre>`
      );
      return `%%CODEBLOCK_${idx}%%`;
    });

    // 3. Tables: match markdown tables (| col1 | col2 | ... \n | --- | --- | ...)
    const tableRegex = /(?:^|\n)((?:\|[^\n]+\|\r?\n)(?:\|[\s:-|-]+\|\r?\n)(?:\|[^\n]+\|\r?\n?)+)/g;
    text = text.replace(tableRegex, (match) => {
      const lines = match.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return match;

      const headerCells = lines[0]
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      const alignments = lines[1]
        .split('|')
        .slice(1, -1)
        .map((a) => {
          const trimmed = a.trim();
          if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
          if (trimmed.endsWith(':')) return 'right';
          return 'left';
        });

      const bodyRows = lines.slice(2).map((rowLine) => {
        return rowLine
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
      });

      let tableHtml = `<div class="overflow-x-auto my-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"><table class="w-full text-xs text-left border-collapse">`;
      // Header
      tableHtml += `<thead class="bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white font-semibold"><tr>`;
      headerCells.forEach((h, i) => {
        const align = alignments[i] || 'left';
        tableHtml += `<th class="p-3 border-b border-slate-200 dark:border-slate-800 text-${align}">${h}</th>`;
      });
      tableHtml += `</tr></thead><tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">`;

      // Rows
      bodyRows.forEach((row) => {
        tableHtml += `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">`;
        row.forEach((cell, i) => {
          const align = alignments[i] || 'left';
          tableHtml += `<td class="p-3 text-${align} text-slate-700 dark:text-slate-300 font-medium">${cell}</td>`;
        });
        tableHtml += `</tr>`;
      });
      tableHtml += `</tbody></table></div>`;
      return '\n\n' + tableHtml + '\n\n';
    });

    // 4. Inline code: `code`
    text = text.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-mono text-xs border border-slate-200 dark:border-slate-700/60">$1</code>');

    // 5. Horizontal rule: --- or ***
    text = text.replace(/^(?:---|___|\*\*\*)$/gim, '<hr class="my-5 border-slate-200 dark:border-slate-800" />');

    // 6. Headers
    text = text.replace(/^#### (.*$)/gim, '<h4 class="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1.5">$1</h4>');
    text = text.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2 pb-1 border-b border-slate-200 dark:border-slate-800">$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold text-slate-900 dark:text-white mt-6 mb-3">$1</h1>');

    // 7. Blockquotes
    text = text.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-brand-500 pl-4 py-1.5 my-3 bg-brand-500/5 rounded-r-xl text-slate-700 dark:text-slate-300 italic text-sm">$1</blockquote>');

    // 8. Task lists: - [x] or - [ ]
    text = text.replace(/^\s*-\s*\[x\]\s+(.*$)/gim, '<li class="ml-4 list-none flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 my-1"><input type="checkbox" checked disabled class="accent-brand-500 rounded" /> <span class="line-through text-slate-400 dark:text-slate-500">$1</span></li>');
    text = text.replace(/^\s*-\s*\[ \]\s+(.*$)/gim, '<li class="ml-4 list-none flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 my-1"><input type="checkbox" disabled class="rounded" /> <span>$1</span></li>');

    // 9. Unordered lists: - or *
    text = text.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-5 list-disc text-sm text-slate-700 dark:text-slate-300 my-0.5">$1</li>');

    // 10. Links: [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-brand-600 dark:text-brand-400 font-medium underline underline-offset-2 hover:text-brand-500">$1</a>');

    // 11. Strikethrough & Emphasis
    text = text.replace(/~~([^~]+)~~/g, '<del class="line-through text-slate-400">$1</del>');
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-800 dark:text-slate-200">$1</em>');

    // 12. Paragraphs
    text = text.replace(/\n\n/g, '<p class="my-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300"></p>');

    // 13. Restore code blocks
    codeBlocks.forEach((cb, idx) => {
      text = text.replace(`%%CODEBLOCK_${idx}%%`, cb);
    });

    return text;
  }, [markdown]);

  const words = markdown.trim() ? markdown.trim().split(/\s+/).filter(Boolean).length : 0;
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
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Exported Markdown</title><style>body{font-family:sans-serif;max-width:860px;margin:40px auto;padding:0 24px;line-height:1.6;color:#333;}table{width:100%;border-collapse:collapse;margin:16px 0;}th,td{border:1px solid #ddd;padding:8px;}th{background:#f4f4f4;}pre{background:#1e293b;color:#f8fafc;padding:12px;border-radius:8px;overflow-x:auto;}code{font-family:monospace;}</style></head><body>${safeHtml}</body></html>`;
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
        <div className="flex flex-wrap items-center gap-2">
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

          {viewMode === 'split' && (
            <button
              onClick={() => {
                setSyncScroll(!syncScroll);
                showToast(`Synchronized scroll ${!syncScroll ? 'enabled' : 'disabled'}`);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                syncScroll
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
              title="Synchronize scrolling between editor and preview"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sync Scroll: {syncScroll ? 'ON' : 'OFF'}</span>
            </button>
          )}
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

      {/* Editor & Preview Viewport with matching, scrollable height */}
      <div className={`grid gap-4 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {(viewMode === 'split' || viewMode === 'edit') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Markdown Source</span>
              <span className="font-mono text-slate-400">{words} words • {chars} chars</span>
            </div>
            <textarea
              ref={editorRef}
              onScroll={handleEditorScroll}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Type markdown here..."
              className="w-full h-[580px] max-h-[580px] p-4 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed focus:outline-none focus:border-brand-500 shadow-sm overflow-y-auto resize-none"
            />
          </div>
        )}

        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Sanitized Render Preview</span>
              <span className="text-emerald-500 font-medium">Safe HTML sandbox • Scrollable</span>
            </div>
            <div
              ref={previewRef}
              onScroll={handlePreviewScroll}
              className="w-full h-[580px] max-h-[580px] p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 overflow-y-auto shadow-sm"
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          </div>
        )}
      </div>

      <RelatedTools currentTool={tool} />
    </div>
  );
};
