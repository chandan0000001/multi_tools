import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Wrench,
  Search,
  Moon,
  Sun,
  Trash2,
  Menu,
  X,
  Code2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useCache } from '../../context/CacheContext';
import { useToast } from '../../context/ToastContext';

interface NavbarProps {
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch }) => {
  const { theme, toggleTheme } = useTheme();
  const { stats, clearCache } = useCache();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleClearCache = () => {
    const cleared = clearCache();
    showToast(`Cleared ${cleared} cached result(s) from local storage`, 'info');
  };

  const isDevActive = location.pathname.startsWith('/developers');
  const isNormalActive = location.pathname.startsWith('/normalUser');

  return (
    <header className="sticky top-0 z-40 w-full custom-glass border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/normalUser" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                Multi<span className="text-brand-500">_Tools</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                Browser-First Utility
              </span>
            </div>
          </Link>

          {/* Experience Switcher Tabs */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800/80 text-xs font-semibold">
            <NavLink
              to="/normalUser"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  isActive || (!isDevActive && isNormalActive)
                    ? 'bg-white dark:bg-surface-800 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Everyday Tools</span>
            </NavLink>

            <NavLink
              to="/developers"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white dark:bg-surface-800 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Developers</span>
            </NavLink>
          </nav>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Trigger Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
            title="Search tools (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search tools...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
              Ctrl+K
            </kbd>
          </button>

          {/* Cache Status & Clear Control (PRD Section 8) */}
          {stats.count > 0 && (
            <button
              onClick={handleClearCache}
              title={`Clear ${stats.count} cached result(s) (${(stats.totalSizeBytes / 1024).toFixed(1)} KB)`}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cache ({stats.count})</span>
            </button>
          )}

          {/* Privacy badge */}
          <div className="hidden xl:flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Local First</span>
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-900 px-4 pt-3 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <NavLink
            to="/normalUser"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${
                isActive
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <Sparkles className="w-4 h-4" />
            <span>Everyday Tools</span>
          </NavLink>

          <NavLink
            to="/developers"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${
                isActive
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <Code2 className="w-4 h-4" />
            <span>Developer Tools</span>
          </NavLink>

          {stats.count > 0 && (
            <button
              onClick={() => {
                handleClearCache();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-xl"
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cached Results</span>
              </span>
              <span>{stats.count} item(s)</span>
            </button>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <Link to="/privacy" onClick={() => setMobileMenuOpen(false)} className="hover:underline">
              Privacy
            </Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="hover:underline">
              About
            </Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="hover:underline">
              Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
