import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, ExternalLink } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { TelegramIcon } from '../components/layout/Footer';

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'Feedback', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message) {
      showToast('Please fill out the required fields', 'error');
      return;
    }
    setSubmitted(true);
    showToast('Feedback submitted locally! Thank you.');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Contact & Feedback
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Have an idea for a new local-first browser tool, or found a bug? We’d love to hear from you.
        </p>
      </div>

      {/* Direct Telegram Developer Contact */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-100/80 dark:bg-surface-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
            <TelegramIcon className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Direct Telegram Line
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chat directly with developer <strong className="text-slate-900 dark:text-white font-semibold">Chandan</strong> for quick feature requests & bug reports.
            </p>
          </div>
        </div>
        <a
          href="https://t.me/coder_chandan"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1e8cc0] text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all shrink-0 hover:scale-[1.02]"
        >
          <TelegramIcon className="w-3.5 h-3.5 fill-white" />
          <span>@coder_chandan</span>
          <ExternalLink className="w-3 h-3 text-white/80" />
        </a>
      </div>

      {submitted ? (
        <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Thank you for your feedback!</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your message has been received. Because this platform is privacy-focused, no personal tracking cookies were stored.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({ name: '', email: '', subject: 'Feedback', message: '' });
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-500"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jane@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-brand-500"
            >
              <option value="Feature Request">Request New Tool</option>
              <option value="Bug Report">Report a Bug / Issue</option>
              <option value="Privacy Question">Privacy Inquiry</option>
              <option value="Feedback">General Feedback</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Message *
            </label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell us what tool you need or what we can improve..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-brand-500/20"
          >
            <Send className="w-4 h-4" />
            <span>Submit Feedback</span>
          </button>
        </form>
      )}
    </div>
  );
};
