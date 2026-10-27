import React, { useState, useEffect } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import { setCachedResult, getCachedResult } from '../../utils/cacheManager';
import {
  Calculator as CalcIcon,
  Scale,
  DollarSign,
  TrendingUp,
  Heart,
  Calendar,
  Trash2,
  Copy,
  History,
  RotateCcw,
} from 'lucide-react';

type CalcMode = 'standard' | 'unit' | 'currency' | 'loan' | 'bmi' | 'date';

export const CalculatorTool: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'calculator')!;
  const { showToast } = useToast();
  const [mode, setMode] = useState<CalcMode>('standard');

  // --- Standard Calculator State ---
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<string>('0');
  const [history, setHistory] = useState<string[]>(() => {
    return getCachedResult<string[]>('calculator', 'history') || [];
  });

  // Save history to 24h cache
  useEffect(() => {
    if (history.length > 0) {
      setCachedResult('calculator', 'history', history);
    }
  }, [history]);

  const handleKeypad = (val: string) => {
    if (val === 'C') {
      setExpression('');
      setResult('0');
      return;
    }
    if (val === 'DEL') {
      setExpression((prev) => prev.slice(0, -1));
      return;
    }
    if (val === '=') {
      try {
        if (!expression.trim()) return;
        // Safe evaluation of arithmetic only
        const sanitized = expression.replace(/×/g, '*').replace(/÷/g, '/');
        if (!/^[0-9+\-*/().%^ ]+$/.test(sanitized)) {
          showToast('Invalid characters in expression', 'error');
          return;
        }
        // eslint-disable-next-line no-eval
        const evaluated = Function(`"use strict"; return (${sanitized})`)();
        if (evaluated === Infinity || evaluated === -Infinity || isNaN(evaluated)) {
          setResult('Division by zero / Undefined');
          return;
        }
        const strRes = String(Number(evaluated.toFixed(8)));
        setResult(strRes);
        setHistory((prev) => [`${expression} = ${strRes}`, ...prev.slice(0, 19)]);
        showToast('Calculated successfully');
      } catch (err) {
        setResult('Error');
        showToast('Syntax Error in expression', 'error');
      }
      return;
    }
    setExpression((prev) => prev + val);
  };

  // Keyboard support for standard calc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'standard') return;
      const key = e.key;
      if (/[0-9+\-*/().%]/.test(key)) {
        setExpression((prev) => prev + key);
      } else if (key === 'Enter') {
        handleKeypad('=');
      } else if (key === 'Backspace') {
        handleKeypad('DEL');
      } else if (key === 'Escape') {
        handleKeypad('C');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, expression]);

  // --- Unit Converter State ---
  const [unitCategory, setUnitCategory] = useState<'length' | 'weight' | 'temp'>('length');
  const [unitValue, setUnitValue] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('ft');

  const convertUnits = () => {
    if (unitCategory === 'length') {
      const inMeters: Record<string, number> = { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, yd: 0.9144, ft: 0.3048, in: 0.0254 };
      const meters = unitValue * (inMeters[fromUnit] || 1);
      return (meters / (inMeters[toUnit] || 1)).toFixed(4);
    }
    if (unitCategory === 'weight') {
      const inKg: Record<string, number> = { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495 };
      const kg = unitValue * (inKg[fromUnit] || 1);
      return (kg / (inKg[toUnit] || 1)).toFixed(4);
    }
    if (unitCategory === 'temp') {
      let celsius = unitValue;
      if (fromUnit === 'F') celsius = (unitValue - 32) * (5 / 9);
      if (fromUnit === 'K') celsius = unitValue - 273.15;

      if (toUnit === 'C') return celsius.toFixed(2);
      if (toUnit === 'F') return (celsius * (9 / 5) + 32).toFixed(2);
      if (toUnit === 'K') return (celsius + 273.15).toFixed(2);
    }
    return '0';
  };

  // --- Currency State ---
  const [currAmount, setCurrAmount] = useState<number>(100);
  const [currFrom, setCurrFrom] = useState('USD');
  const [currTo, setCurrTo] = useState('EUR');
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1, EUR: 0.92, GBP: 0.79, JPY: 154.5, CAD: 1.38, AUD: 1.52, INR: 84.1, CNY: 7.24 });
  const [ratesUpdated, setRatesUpdated] = useState<string>('Offline baseline (October 2026)');
  const [loadingRates, setLoadingRates] = useState(false);

  const fetchLiveRates = async () => {
    setLoadingRates(true);
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${currFrom}`);
      if (res.ok) {
        const data = await res.json();
        setRates(data.rates);
        const updateTime = new Date().toLocaleTimeString();
        setRatesUpdated(`Live update at ${updateTime} (via open.er-api.com)`);
        showToast('Live rates updated successfully');
      } else {
        showToast('Could not fetch live rates; using offline rates', 'error');
      }
    } catch {
      showToast('Network error fetching live rates', 'error');
    } finally {
      setLoadingRates(false);
    }
  };

  // --- Loan / EMI State ---
  const [principal, setPrincipal] = useState<number>(100000);
  const [rate, setRate] = useState<number>(7.5);
  const [tenureYears, setTenureYears] = useState<number>(5);

  const calculateLoan = () => {
    const p = principal;
    const r = rate / 12 / 100;
    const n = tenureYears * 12;
    if (r === 0) {
      const emi = p / n;
      return { emi: emi.toFixed(2), totalInterest: '0.00', totalPayment: p.toFixed(2) };
    }
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - p;
    return {
      emi: emi.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      totalPayment: totalPayment.toFixed(2),
    };
  };

  // --- BMI State ---
  const [bmiHeight, setBmiHeight] = useState<number>(175); // cm
  const [bmiWeight, setBmiWeight] = useState<number>(70); // kg
  const calculateBMI = () => {
    if (bmiHeight <= 0 || bmiWeight <= 0) return { score: '0', category: 'Invalid' };
    const hM = bmiHeight / 100;
    const score = Number((bmiWeight / (hM * hM)).toFixed(1));
    let category = 'Normal weight';
    let color = 'text-emerald-500';
    if (score < 18.5) {
      category = 'Underweight';
      color = 'text-amber-500';
    } else if (score >= 25 && score < 29.9) {
      category = 'Overweight';
      color = 'text-amber-500';
    } else if (score >= 30) {
      category = 'Obesity';
      color = 'text-rose-500';
    }
    return { score: String(score), category, color };
  };

  // --- Date Math State ---
  const [date1, setDate1] = useState(new Date().toISOString().split('T')[0]);
  const [date2, setDate2] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const calculateDateDiff = () => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = Math.abs(d2.getTime() - d1.getTime());
    const days = Math.floor(diffMs / 86400000);
    const weeks = (days / 7).toFixed(1);
    const months = (days / 30.44).toFixed(1);
    return { days, weeks, months };
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'standard', label: 'Standard Math', icon: CalcIcon },
          { id: 'unit', label: 'Unit Converter', icon: Scale },
          { id: 'currency', label: 'Currency', icon: DollarSign },
          { id: 'loan', label: 'Loan & EMI', icon: TrendingUp },
          { id: 'bmi', label: 'BMI Calculator', icon: Heart },
          { id: 'date', label: 'Date Math', icon: Calendar },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setMode(item.id as CalcMode)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                mode === item.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-surface-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mode 1: Standard Arithmetic Calculator */}
      {mode === 'standard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            {/* Display screen */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 text-right space-y-1">
              <div className="text-xs font-mono text-slate-400 h-5 overflow-x-auto">
                {expression || ' '}
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-slate-900 dark:text-white truncate">
                {result}
              </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
              {['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', 'DEL', '='].map((key) => {
                const isOp = ['÷', '×', '-', '+', '='].includes(key);
                const isAction = ['C', 'DEL', '(', ')'].includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => handleKeypad(key)}
                    className={`py-3 sm:py-3.5 rounded-xl text-base font-semibold transition-all active:scale-95 ${
                      key === '='
                        ? 'col-span-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-bold shadow-md'
                        : isOp
                        ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : isAction
                        ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        : 'bg-slate-50 dark:bg-surface-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 text-slate-900 dark:text-white'
                    }`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculation History */}
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <History className="w-4 h-4 text-brand-500" />
                  <span>History (Saved 24h)</span>
                </span>
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      setHistory([]);
                      showToast('History cleared');
                    }}
                    className="text-xs text-rose-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No calculations yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs font-mono flex items-center justify-between group"
                    >
                      <span className="truncate">{item}</span>
                      <button
                        onClick={() => {
                          const resPart = item.split('=')[1]?.trim();
                          if (resPart) {
                            navigator.clipboard.writeText(resPart);
                            showToast(`Copied ${resPart}`);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-brand-500 transition-opacity"
                        title="Copy result"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              Keyboard friendly: Supports numbers, +, -, *, /, Enter, Backspace, and Esc.
            </p>
          </div>
        </div>
      )}

      {/* Mode 2: Unit Converter */}
      {mode === 'unit' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex gap-2">
            {(['length', 'weight', 'temp'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setUnitCategory(cat);
                  if (cat === 'length') {
                    setFromUnit('m');
                    setToUnit('ft');
                  } else if (cat === 'weight') {
                    setFromUnit('kg');
                    setToUnit('lb');
                  } else {
                    setFromUnit('C');
                    setToUnit('F');
                  }
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                  unitCategory === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Amount & From</label>
              <input
                type="number"
                value={unitValue}
                onChange={(e) => setUnitValue(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              >
                {unitCategory === 'length' && (
                  <>
                    <option value="m">Meters (m)</option>
                    <option value="km">Kilometers (km)</option>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="mm">Millimeters (mm)</option>
                    <option value="ft">Feet (ft)</option>
                    <option value="in">Inches (in)</option>
                    <option value="yd">Yards (yd)</option>
                    <option value="mi">Miles (mi)</option>
                  </>
                )}
                {unitCategory === 'weight' && (
                  <>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="mg">Milligrams (mg)</option>
                    <option value="lb">Pounds (lb)</option>
                    <option value="oz">Ounces (oz)</option>
                  </>
                )}
                {unitCategory === 'temp' && (
                  <>
                    <option value="C">Celsius (°C)</option>
                    <option value="F">Fahrenheit (°F)</option>
                    <option value="K">Kelvin (K)</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Converted Output</label>
              <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 text-lg font-mono font-bold text-brand-600 dark:text-brand-400">
                {convertUnits()}
              </div>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              >
                {unitCategory === 'length' && (
                  <>
                    <option value="ft">Feet (ft)</option>
                    <option value="m">Meters (m)</option>
                    <option value="km">Kilometers (km)</option>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="in">Inches (in)</option>
                    <option value="yd">Yards (yd)</option>
                    <option value="mi">Miles (mi)</option>
                  </>
                )}
                {unitCategory === 'weight' && (
                  <>
                    <option value="lb">Pounds (lb)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="oz">Ounces (oz)</option>
                  </>
                )}
                {unitCategory === 'temp' && (
                  <>
                    <option value="F">Fahrenheit (°F)</option>
                    <option value="C">Celsius (°C)</option>
                    <option value="K">Kelvin (K)</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Currency Conversion */}
      {mode === 'currency' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="font-semibold text-sm text-slate-900 dark:text-white">Exchange Rate Converter</span>
              <p className="text-xs text-slate-400">{ratesUpdated}</p>
            </div>
            <button
              onClick={fetchLiveRates}
              disabled={loadingRates}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loadingRates ? 'animate-spin' : ''}`} />
              <span>{loadingRates ? 'Fetching...' : 'Update Live Rates'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Amount</label>
              <input
                type="number"
                value={currAmount}
                onChange={(e) => setCurrAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
              />
              <select
                value={currFrom}
                onChange={(e) => setCurrFrom(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                {Object.keys(rates).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Converted Value</label>
              <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 text-xl font-mono font-bold text-emerald-500">
                {((currAmount / (rates[currFrom] || 1)) * (rates[currTo] || 1)).toFixed(2)} {currTo}
              </div>
              <select
                value={currTo}
                onChange={(e) => setCurrTo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                {Object.keys(rates).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Disclosed Provider: Rates fetched from open.er-api.com. Baseline offline rates apply when network is disconnected.
          </p>
        </div>
      )}

      {/* Mode 4: Loan / EMI Calculator */}
      {mode === 'loan' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Loan Amount ($ / ₹)
              </label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Interest Rate (% per year)
              </label>
              <input
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tenure (Years)
              </label>
              <input
                type="number"
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
          </div>

          {/* Results grid */}
          {(() => {
            const loan = calculateLoan();
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                  <span className="text-xs text-indigo-400 font-medium">Monthly EMI</span>
                  <div className="text-2xl font-bold text-indigo-500 mt-1">${loan.emi}</div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-xs text-amber-400 font-medium">Total Interest</span>
                  <div className="text-2xl font-bold text-amber-500 mt-1">${loan.totalInterest}</div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-xs text-emerald-400 font-medium">Total Repayment</span>
                  <div className="text-2xl font-bold text-emerald-500 mt-1">${loan.totalPayment}</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Mode 5: BMI Calculator */}
      {mode === 'bmi' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                value={bmiHeight}
                onChange={(e) => setBmiHeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                value={bmiWeight}
                onChange={(e) => setBmiWeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
          </div>

          {(() => {
            const bmi = calculateBMI();
            return (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <span className="text-xs text-slate-400">Your Body Mass Index</span>
                <div className="text-4xl font-extrabold text-slate-900 dark:text-white">{bmi.score}</div>
                <div className={`text-sm font-bold ${bmi.color}`}>{bmi.category}</div>
                <p className="text-[11px] text-slate-400 pt-2">
                  Standard classifications: Underweight (&lt;18.5), Normal (18.5 - 24.9), Overweight (25 - 29.9), Obesity (&ge;30).
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Mode 6: Date Calculator */}
      {mode === 'date' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={date1}
                onChange={(e) => setDate1(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                End Date
              </label>
              <input
                type="date"
                value={date2}
                onChange={(e) => setDate2(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
          </div>

          {(() => {
            const diff = calculateDateDiff();
            return (
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 text-center">
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{diff.days}</div>
                  <span className="text-[11px] text-slate-400">Days</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{diff.weeks}</div>
                  <span className="text-[11px] text-slate-400">Weeks</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{diff.months}</div>
                  <span className="text-[11px] text-slate-400">Months</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <RelatedTools currentTool={tool} />
    </div>
  );
};
