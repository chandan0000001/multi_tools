import React, { useState, useRef, useEffect } from 'react';
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
  Upload,
  Sparkles,
  Download,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';

export const SeoTools: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'seo-tools')!;
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [title, setTitle] = useState('Berhampur Cab Service | Subham Travelers');
  const [description, setDescription] = useState(
    'Book reliable cab services in Berhampur with Subham Travelers. Choose one-way trips, round trips and local rentals for comfortable travel.'
  );
  const [url, setUrl] = useState('https://berhampurcab.vercel.app/');
  const [siteName, setSiteName] = useState('Subham Travelers');
  const [bannerImageUrl, setBannerImageUrl] = useState<string>('');
  const [bannerPreviewSrc, setBannerPreviewSrc] = useState<string>('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewType, setPreviewType] = useState<'google' | 'social'>('social');
  const [imageLoadError, setImageLoadError] = useState(false);

  // Generate dynamic canvas banner (1200x630 standard Open Graph aspect ratio)
  const generateDynamicBanner = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 630;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#1e1b4b'); // Deep indigo
    gradient.addColorStop(0.5, '#312e81');
    gradient.addColorStop(1, '#0f172a'); // Dark slate
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Decorative circle glows
    ctx.beginPath();
    ctx.arc(1050, 150, 260, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(124, 58, 237, 0.25)'; // Purple glow
    ctx.fill();

    ctx.beginPath();
    ctx.arc(150, 520, 200, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; // Blue glow
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, 1184, 614);

    // Site Name Pill / Badge
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.roundRect(80, 80, 280, 48, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Inter, system-ui, sans-serif';
    ctx.fillText(siteName.toUpperCase(), 105, 112);

    // Main Title (Multi-line wrap)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px Inter, system-ui, sans-serif';
    const words = title.split(' ');
    let line = '';
    let y = 220;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 1000 && n > 0) {
        ctx.fillText(line, 80, y);
        line = words[n] + ' ';
        y += 72;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 80, y);

    // Description / Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '30px Inter, system-ui, sans-serif';
    const descWords = description.split(' ');
    let descLine = '';
    let descY = y + 75;
    for (let n = 0; n < descWords.length; n++) {
      const testLine = descLine + descWords[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 1000 && n > 0) {
        ctx.fillText(descLine, 80, descY);
        descLine = descWords[n] + ' ';
        descY += 44;
        if (descY > 520) break; // prevent overflowing bottom
      } else {
        descLine = testLine;
      }
    }
    if (descY <= 520) {
      ctx.fillText(descLine, 80, descY);
    }

    // Hostname bottom bar
    try {
      const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      ctx.fillStyle = '#a78bfa';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`🌐 ${hostname}`, 80, 560);
    } catch {
      // ignore
    }

    const dataUrl = canvas.toDataURL('image/png');
    setBannerPreviewSrc(dataUrl);
    setBannerImageUrl(url.replace(/\/$/, '') + '/og-image.png');
    setImageLoadError(false);
    showToast('Generated 1200×630 dynamic social banner!');
  };

  // Generate an initial banner when component mounts or title changes
  useEffect(() => {
    if (!bannerPreviewSrc && title) {
      generateDynamicBanner();
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBannerPreviewSrc(reader.result as string);
      setBannerImageUrl(url.replace(/\/$/, '') + `/${file.name}`);
      setImageLoadError(false);
      showToast(`Loaded ${file.name} as social banner`);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (newImgUrl: string) => {
    setBannerImageUrl(newImgUrl);
    if (newImgUrl.trim().startsWith('http') || newImgUrl.trim().startsWith('data:')) {
      setBannerPreviewSrc(newImgUrl.trim());
      setImageLoadError(false);
    }
  };

  const downloadBanner = () => {
    if (!bannerPreviewSrc) return;
    const a = document.createElement('a');
    a.href = bannerPreviewSrc;
    a.download = `og-banner-1200x630-${Date.now()}.png`;
    a.click();
    showToast('Downloaded banner image (1200×630)');
  };

  // Title / Desc metrics
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
  const effectiveImageUrl = bannerImageUrl || (url.replace(/\/$/, '') + '/og-image.png');
  const generatedMetaTags = `<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}">
<meta name="description" content="${description}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${effectiveImageUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="${siteName}">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${url}">
<meta property="twitter:title" content="${title}">
<meta property="twitter:description" content="${description}">
<meta property="twitter:image" content="${effectiveImageUrl}">`;

  const copyMetaTags = () => {
    navigator.clipboard.writeText(generatedMetaTags);
    showToast('Copied HTML Meta tags to clipboard!');
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Hidden canvas for generating dynamic 1200x630 OG Banner */}
      <canvas ref={canvasRef} className="hidden" />

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

            {/* Social Banner Image Controls */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-brand-500" />
                  <span>Social Banner (og:image / twitter:image)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">1200 × 630</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste banner image URL (e.g. https://.../og.jpg)"
                  value={bannerImageUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors shrink-0"
                  title="Upload local banner image"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                </button>

                <button
                  type="button"
                  onClick={generateDynamicBanner}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs font-semibold transition-colors shrink-0"
                  title="Auto-generate 1200x630 banner from title"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Auto Generate</span>
                </button>
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
                  onClick={() => setPreviewType('social')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    previewType === 'social' ? 'bg-white dark:bg-surface-900 text-brand-500 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Social Card (OG/Twitter)
                </button>
                <button
                  onClick={() => setPreviewType('google')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    previewType === 'google' ? 'bg-white dark:bg-surface-900 text-brand-500 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Google SERP
                </button>
              </div>

              {previewType === 'google' ? (
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
              ) : (
                bannerPreviewSrc && (
                  <button
                    onClick={downloadBanner}
                    className="flex items-center gap-1 text-xs text-brand-500 hover:underline font-semibold"
                    title="Download 1200x630 banner image"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Banner</span>
                  </button>
                )
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                    Open Graph & Twitter Share Preview
                  </span>
                  {bannerPreviewSrc && (
                    <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Banner Loaded</span>
                    </span>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-surface-950 shadow-md">
                  {/* Loaded Social Banner Image */}
                  <div className="relative w-full aspect-[1200/630] bg-slate-900 flex items-center justify-center overflow-hidden">
                    {bannerPreviewSrc && !imageLoadError ? (
                      <img
                        src={bannerPreviewSrc}
                        alt="Loaded Social Media Banner"
                        onError={() => setImageLoadError(true)}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex flex-col items-center justify-center text-white p-6 text-center space-y-2">
                        <ImageIcon className="w-10 h-10 opacity-70" />
                        <span className="font-bold text-sm">1200 × 630 Social Banner Preview</span>
                        <span className="text-xs text-slate-200">
                          {imageLoadError
                            ? 'Could not load image URL. Check URL or click "Auto Generate".'
                            : 'Click "Auto Generate" or "Upload" to load your social banner.'}
                        </span>
                        <button
                          onClick={generateDynamicBanner}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
                        >
                          Generate from Title Now
                        </button>
                      </div>
                    )}

                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-semibold">
                      1200 × 630 px
                    </div>
                  </div>

                  {/* Card Metadata info */}
                  <div className="p-4 space-y-1 bg-white dark:bg-surface-900 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 uppercase font-mono block">
                      {(() => {
                        try {
                          return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
                        } catch {
                          return 'website.com';
                        }
                      })()}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Simulates Facebook, LinkedIn, Twitter/X & Slack link unfurl</span>
                  <button
                    onClick={generateDynamicBanner}
                    className="text-brand-500 hover:underline flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Regenerate Banner</span>
                  </button>
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
