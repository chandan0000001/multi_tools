import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Wrench, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-surface-950 py-10 text-xs text-slate-500 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-slate-900 dark:text-white">
                Multi<span className="text-brand-500">_Tools</span>
              </span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              A responsive, browser-first multi-utility platform built with local-first
              processing, transparent network disclosures, and zero unnecessary server-side data collection.
            </p>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero server logging • Client-side Web APIs • 24h cache max</span>
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

          {/* Legal & About */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-xs tracking-wider uppercase">
              Transparency & Docs
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-brand-500 transition-colors">
                  About Multi_Tools
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-brand-500 transition-colors flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span>Privacy Architecture</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-500 transition-colors">
                  Feedback & Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Multi_Tools. All rights reserved. Open browser utilities.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Engineered with care & privacy</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
