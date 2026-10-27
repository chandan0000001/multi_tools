import React, { useState } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import {
  Search,
  Copy,
  Globe,
  Smartphone,
  Monitor,
  Share2,
  CheckCircle2,
  AlertCircle,
  Code2,
} from 'lucide-react';

export const SeoTools: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'seo-tools')!;
  const { showToast } = useToast();

  const [title, setTitle] = useState('Multi_Tools — Browser-First Multi-Utility Platform');
  const [description, setDescription] = useState(
    'Local-first everyday utilities and developer tools with zero unnecessary backend processing and complete client-side privacy.'
  );
  const [url, setUrl] = useState('https://multitools.local');
  const [siteName, setSiteName] = useState('Multi_Tools');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewType, setPreviewType] = useState<'google' | 'social'>('google');

  // Guidelines
  // Title: 50-60 characters
  // Description: 120-160 characters
  const titleLen = title.length;
  const descLen = description.length;

  const getTitleStatus = () => {
    if (titleLen === 0) return { label: 'Empty', color: 'text-rose-500' };
    if (titleLen > 65) return { label: 'Too Long (Will Truncate)', color: 'text-amber-500' };
    if (titleLen < 30) return { label: 'Short', color: 'text-slate-400' };
    return { label: 'Optimal Length', color: 'text-emerald-500' };
  };

  const getDescStatus = () => {
    if (descLen === 0) return { label: 'Empty', color: 'text-rose-500' };
    if (descLen > 160) return { label: 'Too Long (May Truncate)', color: 'text-amber-500' };
    if (descLen < 80) return { label: 'Short', color: 'text-slate-400' };
    return { label: 'Optimal Length', color: 'text-emerald-500' };
  };

  const titleStatus = getTitleStatus();
  const descStatus = getDescStatus();

  // Generated Meta HTML Tags
  const generatedMetaTags = `<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}">
<meta name="description" content="${description}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:site_name" content="${siteName}">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${url}">
<meta property="twitter:title" content="${title}">
<meta property="twitter:description" content="${description}">`;

  const copyMetaTags = () => {
    navigator.clipboard.writeText(generatedMetaTags);
    showToast('Copied HTML Meta tags to clipboard!');
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Inputs (Left) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Metadata Parameters
            </h3>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Page Title ({titleLen}/60 chars)</span>
                <span className={`text-[11px] font-medium ${titleStatus.color}`}>{titleStatus.label}</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Meta Description ({descLen}/160 chars)</span>
                <span className={`text-[11px] font-medium ${descStatus.color}`}>{descStatus.label}</span>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Canonical URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Generated Meta HTML code */}
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-brand-500" />
                <span>Generated HTML Meta Tags</span>
              </span>
              <button
                onClick={copyMetaTags}
                className="flex items-center gap-1 text-xs text-brand-500 hover:underline font-semibold"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </button>
            </div>
            <pre className="p-3.5 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto">
              {generatedMetaTags}
            </pre>
          </div>
        </div>

        {/* Live SERP & Social Simulator (Right) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            {/* View switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setPreviewType('google')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    previewType === 'google' ? 'bg-white dark:bg-surface-900 text-brand-500 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Google SERP
                </button>
                <button
                  onClick={() => setPreviewType('social')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    previewType === 'social' ? 'bg-white dark:bg-surface-900 text-brand-500 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Social Card
                </button>
              </div>

              {previewType === 'google' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-lg text-xs ${previewDevice === 'desktop' ? 'bg-brand-500/10 text-brand-500' : 'text-slate-400'}`}
                    title="Desktop Preview"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-lg text-xs ${previewDevice === 'mobile' ? 'bg-brand-500/10 text-brand-500' : 'text-slate-400'}`}
                    title="Mobile Preview"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {previewType === 'google' ? (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                  Google Search Result Snippet ({previewDevice})
                </span>

                <div className={`p-4 rounded-2xl bg-white text-left font-sans border border-slate-200 shadow-sm ${previewDevice === 'mobile' ? 'max-w-xs mx-auto' : 'w-full'}`}>
                  {/* Google result format */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                      {siteName.charAt(0)}
                    </div>
                    <div className="text-xs text-slate-800 leading-none">
                      <span className="font-semibold block">{siteName}</span>
                      <span className="text-[11px] text-slate-500 truncate block max-w-xs">{url}</span>
                    </div>
                  </div>

                  <h4 className="text-base font-medium text-blue-700 hover:underline cursor-pointer line-clamp-1">
                    {title || 'Page Title Simulator'}
                  </h4>

                  <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {description || 'Page description will appear here as the search engine snippet.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                  Open Graph & Twitter Share Preview
                </span>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-surface-950">
                  <div className="h-36 bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    1200 × 630 Social Banner Preview
                  </div>
                  <div className="p-4 space-y-1">
                    <span className="text-[11px] text-slate-400 uppercase font-mono block">
                      {new URL(url.startsWith('http') ? url : `https://${url}`).hostname}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <RelatedTools currentTool={tool} />
    </div>
  );
};
