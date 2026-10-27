import React, { useState, useEffect } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import { setCachedResult, getCachedResult } from '../../utils/cacheManager';
import {
  Type,
  AlignLeft,
  Clock,
  Mic,
  Copy,
  Trash2,
  BookOpen,
  Hash,
} from 'lucide-react';

export const WordCounterTool: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'word-counter')!;
  const { showToast } = useToast();

  const [text, setText] = useState<string>(() => {
    return getCachedResult<string>('word-counter', 'saved-text') || '';
  });

  useEffect(() => {
    if (text) {
      setCachedResult('word-counter', 'saved-text', text);
    }
  }, [text]);

  // Text metrics calculation
  const charactersWithSpaces = text.length;
  const charactersWithoutSpaces = text.replace(/\s+/g, '').length;

  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length : 0;
  const paragraphs = text.trim() ? text.split(/\n+/).filter((p) => p.trim().length > 0).length : 0;

  // Reading time (average 225 wpm) & Speaking time (130 wpm)
  const readingTimeMin = (words / 225).toFixed(1);
  const speakingTimeMin = (words / 130).toFixed(1);

  // Readability formula: Flesch Reading Ease
  // 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
  const calculateFleschScore = (): { score: number; label: string } => {
    if (words < 5 || sentences < 1) return { score: 100, label: 'Very Easy' };

    // Approximate syllable count
    const syllables = text
      .toLowerCase()
      .split(/\s+/)
      .reduce((acc, word) => {
        const clean = word.replace(/[^a-z]/g, '');
        if (!clean) return acc;
        const matches = clean.match(/[aeiouy]{1,2}/g);
        return acc + (matches ? matches.length : 1);
      }, 0);

    const score = Math.round(
      206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    );

    const clamped = Math.max(0, Math.min(100, score));
    let label = 'Standard / Plain English';
    if (clamped >= 90) label = 'Very Easy (5th grade)';
    else if (clamped >= 80) label = 'Easy (6th grade)';
    else if (clamped >= 70) label = 'Fairly Easy (7th grade)';
    else if (clamped >= 60) label = 'Standard (8th-9th grade)';
    else if (clamped >= 50) label = 'Fairly Difficult (High school)';
    else if (clamped >= 30) label = 'Difficult (College level)';
    else label = 'Very Difficult (Professional / Academic)';

    return { score: clamped, label };
  };

  // Top Keywords Frequency
  const getTopKeywords = () => {
    if (!text.trim()) return [];
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
      'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by',
      'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all',
      'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
      'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him',
      'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
      'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
      'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
      'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were'
    ]);

    const wordList = text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const freq: Record<string, number> = {};
    wordList.forEach((w) => {
      freq[w] = (freq[w] || 0) + 1;
    });

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  };

  const flesch = calculateFleschScore();
  const topKeywords = getTopKeywords();

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    showToast('Text copied to clipboard!');
  };

  const handleClear = () => {
    setText('');
    showToast('Text cleared');
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] font-medium text-slate-400">Words</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{words}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] font-medium text-slate-400">Characters (all)</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{charactersWithSpaces}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] font-medium text-slate-400">Chars (no spaces)</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{charactersWithoutSpaces}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] font-medium text-slate-400">Sentences</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{sentences}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] font-medium text-slate-400">Paragraphs</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{paragraphs}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] font-medium text-slate-400">Reading Time</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">~{readingTimeMin}m</div>
        </div>
      </div>

      {/* Editor & Side Intelligence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Live Text Input
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!text}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-40"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
              <button
                onClick={handleClear}
                disabled={!text}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <textarea
            rows={14}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your essay, article, or code notes here..."
            className="w-full p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 shadow-sm transition-colors"
          />
        </div>

        {/* Readability & Keyword Breakdown (Right) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <BookOpen className="w-4 h-4 text-slate-900 dark:text-white" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">Readability Grade</h3>
            </div>

            <div className="text-center py-2">
              <div className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                {flesch.score}
              </div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                {flesch.label}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Flesch Reading Ease (Higher is easier to comprehend)
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" /> Speaking duration
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">~{speakingTimeMin} min</span>
              </div>
            </div>
          </div>

          {/* Top Keywords */}
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Hash className="w-4 h-4 text-brand-500" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">Top Frequency Words</h3>
            </div>

            {topKeywords.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Type text to see keyword density.</p>
            ) : (
              <div className="space-y-1.5">
                {topKeywords.map(([kw, count]) => (
                  <div
                    key={kw}
                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">{kw}</span>
                    <span className="font-mono text-brand-500 font-semibold">{count}×</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <RelatedTools currentTool={tool} />
    </div>
  );
};
