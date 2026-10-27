import React, { useState, useEffect } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import {
  KeyRound,
  RefreshCw,
  Copy,
  ShieldCheck,
  Check,
  Sliders,
  ListFilter,
  Sparkles,
} from 'lucide-react';

const WORDLIST = [
  'apple', 'beach', 'cabin', 'delta', 'eagle', 'forest', 'galaxy', 'harbor',
  'island', 'jungle', 'knight', 'lemon', 'meadow', 'nebula', 'ocean', 'planet',
  'quartz', 'river', 'sunset', 'timber', 'valley', 'winter', 'zenith', 'anchor',
  'breeze', 'cloud', 'desert', 'falcon', 'glacier', 'horizon', 'indigo', 'jasper',
  'matrix', 'oasis', 'prism', 'radiant', 'summit', 'tiger', 'vortex', 'whisper'
];

export const PasswordGeneratorTool: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'password-generator')!;
  const { showToast } = useToast();

  const [genMode, setGenMode] = useState<'password' | 'passphrase'>('password');
  // Password settings
  const [length, setLength] = useState<number>(16);
  const [useUpper, setUseUpper] = useState<boolean>(true);
  const [useLower, setUseLower] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState<boolean>(true);
  const [batchCount, setBatchCount] = useState<number>(5);

  // Passphrase settings
  const [wordCount, setWordCount] = useState<number>(4);
  const [separator, setSeparator] = useState<string>('-');
  const [capitalize, setCapitalize] = useState<boolean>(true);

  // Generated items list
  const [generatedList, setGeneratedList] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateSinglePassword = (): string => {
    let charset = '';
    if (useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (avoidAmbiguous) {
      // Remove easily confused characters: 0, O, o, 1, l, I
      charset = charset.replace(/[0Oo1lI|]/g, '');
    }

    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz';

    // Cryptographically secure Web Crypto API
    const randomBuffer = new Uint32Array(length);
    window.crypto.getRandomValues(randomBuffer);

    let pass = '';
    for (let i = 0; i < length; i++) {
      pass += charset[randomBuffer[i] % charset.length];
    }
    return pass;
  };

  const generateSinglePassphrase = (): string => {
    const randomBuffer = new Uint32Array(wordCount);
    window.crypto.getRandomValues(randomBuffer);

    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      let word = WORDLIST[randomBuffer[i] % WORDLIST.length];
      if (capitalize) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      words.push(word);
    }
    return words.join(separator);
  };

  const generateAll = () => {
    const results: string[] = [];
    for (let i = 0; i < batchCount; i++) {
      results.push(genMode === 'password' ? generateSinglePassword() : generateSinglePassphrase());
    }
    setGeneratedList(results);
    setCopiedIndex(null);
  };

  useEffect(() => {
    generateAll();
  }, [
    genMode,
    length,
    useUpper,
    useLower,
    useNumbers,
    useSymbols,
    avoidAmbiguous,
    wordCount,
    separator,
    capitalize,
    batchCount,
  ]);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Entropy Calculation
  const calculateEntropy = () => {
    if (genMode === 'passphrase') {
      // log2(40^wordCount)
      return Math.round(wordCount * Math.log2(WORDLIST.length));
    }
    let poolSize = 0;
    if (useUpper) poolSize += 26;
    if (useLower) poolSize += 26;
    if (useNumbers) poolSize += 10;
    if (useSymbols) poolSize += 26;
    if (avoidAmbiguous) poolSize -= 6;
    if (poolSize <= 0) poolSize = 26;
    return Math.round(length * Math.log2(poolSize));
  };

  const entropy = calculateEntropy();
  const getStrengthBadge = () => {
    if (entropy < 40) return { label: 'Weak', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    if (entropy < 65) return { label: 'Moderate', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    if (entropy < 85) return { label: 'Strong', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    return { label: 'Very Strong (Bulletproof)', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
  };

  const strength = getStrengthBadge();

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Mode Switcher */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 max-w-md">
        <button
          onClick={() => setGenMode('password')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            genMode === 'password'
              ? 'bg-white dark:bg-surface-800 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Random Password</span>
        </button>

        <button
          onClick={() => setGenMode('passphrase')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            genMode === 'passphrase'
              ? 'bg-white dark:bg-surface-800 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Diceware Passphrase</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Configuration (Left) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-slate-900 dark:text-white" />
                <span>Generator Settings</span>
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${strength.color}`}>
                {strength.label} ({entropy} bits)
              </span>
            </div>

            {genMode === 'password' ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Password Length</span>
                    <span className="font-mono text-brand-500">{length} chars</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="64"
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    className="w-full accent-brand-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-2.5 pt-2">
                  <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
                    <span>Include Uppercase (A-Z)</span>
                    <input
                      type="checkbox"
                      checked={useUpper}
                      onChange={(e) => setUseUpper(e.target.checked)}
                      className="rounded accent-brand-600 w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
                    <span>Include Lowercase (a-z)</span>
                    <input
                      type="checkbox"
                      checked={useLower}
                      onChange={(e) => setUseLower(e.target.checked)}
                      className="rounded accent-brand-600 w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
                    <span>Include Numbers (0-9)</span>
                    <input
                      type="checkbox"
                      checked={useNumbers}
                      onChange={(e) => setUseNumbers(e.target.checked)}
                      className="rounded accent-brand-600 w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
                    <span>Include Symbols (!@#$)</span>
                    <input
                      type="checkbox"
                      checked={useSymbols}
                      onChange={(e) => setUseSymbols(e.target.checked)}
                      className="rounded accent-brand-600 w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
                    <span>Avoid Ambiguous (0, O, l, 1)</span>
                    <input
                      type="checkbox"
                      checked={avoidAmbiguous}
                      onChange={(e) => setAvoidAmbiguous(e.target.checked)}
                      className="rounded accent-brand-600 w-4 h-4"
                    />
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Word Count</span>
                    <span className="font-mono text-brand-500">{wordCount} words</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-full accent-brand-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Word Separator
                    </label>
                    <select
                      value={separator}
                      onChange={(e) => setSeparator(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    >
                      <option value="-">Hyphen (-)</option>
                      <option value="_">Underscore (_)</option>
                      <option value=".">Period (.)</option>
                      <option value=" ">Space ( )</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
                    <span>Capitalize First Letters</span>
                    <input
                      type="checkbox"
                      checked={capitalize}
                      onChange={(e) => setCapitalize(e.target.checked)}
                      className="rounded accent-brand-600 w-4 h-4"
                    />
                  </label>
                </div>
              </>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Batch Count
              </label>
              <select
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              >
                <option value={1}>1 Result</option>
                <option value={5}>5 Results</option>
                <option value={10}>10 Results</option>
                <option value={20}>20 Results</option>
              </select>
            </div>

            <button
              onClick={generateAll}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-semibold text-xs shadow-md transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Regenerate Batch</span>
            </button>
          </div>
        </div>

        {/* Results Stream (Right) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-1 text-xs text-slate-500">
            <span>Generated Passwords (crypto.getRandomValues)</span>
            <span className="text-[11px] text-emerald-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> In-Memory Only
            </span>
          </div>

          <div className="space-y-2">
            {generatedList.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 group hover:border-brand-500/40 transition-colors shadow-sm"
              >
                <div className="font-mono text-sm sm:text-base text-slate-900 dark:text-white break-all select-all font-semibold">
                  {item}
                </div>

                <button
                  onClick={() => copyToClipboard(item, idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    copiedIndex === idx
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-surface-900/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <strong>Security Architecture Guarantee:</strong> Generated passwords are created using the browser&apos;s cryptographically secure pseudorandom number generator (CSPRNG). They are never sent over the network or saved in local storage.
          </div>
        </div>
      </div>

      <RelatedTools currentTool={tool} />
    </div>
  );
};
