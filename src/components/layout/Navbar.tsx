import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Search,
  Moon,
  Sun,
  Trash2,
  Menu,
  X,
  Code2,
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
    const res = clearCache();
    if (res.count > 0) {
      const sizeKb = (res.freedBytes / 1024).toFixed(1);
      showToast(`Purged ${res.count} cached item(s) (${sizeKb} KB) from storage`, 'success');
    } else {
      showToast('Cache is already clean (0 items stored)', 'info');
    }
  };

  const isDevActive = location.pathname.startsWith('/developers');
  const isNormalActive = location.pathname.startsWith('/normalUser');

  return (
    <header className="sticky top-0 z-40 w-full custom-glass border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/normalUser" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-md shadow-slate-900/10 ring-1 ring-slate-900/5 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-white dark:text-slate-900" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" fillOpacity="0.9" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.65" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-[15px] tracking-tight text-slate-900 dark:text-white">
                  MultiTools
                </span>
                <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-tight mt-0.5">
                Client-Side Privacy Suite
              </span>
            </div>
          </Link>

          {/* Experience Switcher Tabs */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-surface-900 border border-slate-200/90 dark:border-slate-800 text-xs font-semibold">
            <NavLink
              to="/normalUser"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                  isActive || (!isDevActive && isNormalActive)
                    ? 'bg-white dark:bg-surface-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Everyday Tools</span>
            </NavLink>

            <NavLink
              to="/developers"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white dark:bg-surface-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
              `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive || (!isDevActive && isNormalActive)
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Everyday Tools</span>
          </NavLink>

          <NavLink
            to="/developers"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <Code2 className="w-4 h-4" />
            <span>Developer Tools</span>
          </NavLink>

          {/* Cache Status & Actions in Mobile Drawer */}
          <div className="pt-1">
            <button
              onClick={() => {
                handleClearCache();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Trash2 className={`w-3.5 h-3.5 ${stats.count > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>{stats.count > 0 ? 'Purge Cached Data' : 'Local Cache Status'}</span>
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {stats.count > 0 ? `${stats.count} item(s) • ${(stats.totalSizeBytes / 1024).toFixed(1)} KB` : 'Clean (0 items)'}
              </span>
            </button>
          </div>

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
