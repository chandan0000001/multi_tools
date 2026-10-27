import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Lock, ExternalLink, MessageSquare } from 'lucide-react';

export const TelegramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.196 1.006.128.832.941z" />
  </svg>
);

export const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-surface-950 py-10 text-xs text-slate-500 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 shadow-sm">
                <svg className="w-4 h-4 text-white dark:text-slate-950" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" fillOpacity="0.9" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.65" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                  MultiTools
                </span>
                <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                  PRO
                </span>
              </div>
            </div>

            <p className="max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              A responsive, browser-first multi-utility platform built with local-first
              processing, transparent network disclosures, and zero unnecessary server-side data collection.
            </p>

            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Zero server logging • Client-side Web APIs • 24h cache max</span>
            </div>

            {/* Direct Telegram Developer Contact Badge */}
            <div className="pt-1">
              <a
                href="https://t.me/coder_chandan"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-sky-50 dark:bg-surface-900 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-800 hover:border-sky-400/50 dark:hover:border-sky-500/50 transition-all shadow-sm group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#229ED9] text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                  <TelegramIcon className="w-4 h-4 fill-white" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      Contact Developer
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Available for feedback"></span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
                    @coder_chandan
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 ml-1 transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-xs tracking-wider uppercase">
              Platform Catalogues
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/normalUser" className="hover:text-brand-500 transition-colors">
                  Everyday Utilities
                </Link>
              </li>
              <li>
                <Link to="/developers" className="hover:text-brand-500 transition-colors">
                  Developer Workspace
                </Link>
              </li>
              <li>
                <Link to="/normalUser/pdf-tools" className="hover:text-brand-500 transition-colors">
                  PDF Productivity Suite
                </Link>
              </li>
              <li>
                <Link to="/normalUser/speed-test" className="hover:text-brand-500 transition-colors">
                  Network Speed Test
                </Link>
              </li>
              <li>
                <Link to="/developers/json-formatter" className="hover:text-brand-500 transition-colors">
                  JSON Formatter & Validator
                </Link>
              </li>
            </ul>
          </div>

          {/* Developer & Community */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-xs tracking-wider uppercase">
              Developer & Community
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://t.me/coder_chandan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors group"
                >
                  <div className="w-4 h-4 rounded-full bg-[#229ED9] text-white flex items-center justify-center shrink-0">
                    <TelegramIcon className="w-2.5 h-2.5 fill-white" />
                  </div>
                  <span className="font-medium">Telegram: @coder_chandan</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-sky-500 opacity-70" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/chandan0000001/multi_tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group"
                >
                  <GithubIcon className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white shrink-0" />
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-900 opacity-70" />
                </a>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-500 transition-colors flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Feedback & Inquiries</span>
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-brand-500 transition-colors flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Privacy Architecture</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-500 transition-colors">
                  About MultiTools
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>© {new Date().getFullYear()} MultiTools PRO.</span>
            <span>•</span>
            <span>Developer:</span>
            <a
              href="https://t.me/coder_chandan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-500 transition-colors"
            >
              <TelegramIcon className="w-3 h-3 text-[#229ED9]" />
              <span>@coder_chandan</span>
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Engineered with care & privacy</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
