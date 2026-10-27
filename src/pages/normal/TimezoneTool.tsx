import React, { useState, useEffect } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import {
  Clock,
  Plus,
  Trash2,
  Users,
  Sun,
  Moon,
  Search,
} from 'lucide-react';

interface CityZone {
  id: string;
  cityName: string;
  timezone: string;
}

const DEFAULT_ZONES: CityZone[] = [
  { id: 'london', cityName: 'London, UK', timezone: 'Europe/London' },
  { id: 'newyork', cityName: 'New York, US', timezone: 'America/New_York' },
  { id: 'sanfrancisco', cityName: 'San Francisco, US', timezone: 'America/Los_Angeles' },
  { id: 'tokyo', cityName: 'Tokyo, Japan', timezone: 'Asia/Tokyo' },
  { id: 'sydney', cityName: 'Sydney, Australia', timezone: 'Australia/Sydney' },
];

const AVAILABLE_ZONES: CityZone[] = [
  { id: 'paris', cityName: 'Paris, France', timezone: 'Europe/Paris' },
  { id: 'berlin', cityName: 'Berlin, Germany', timezone: 'Europe/Berlin' },
  { id: 'dubai', cityName: 'Dubai, UAE', timezone: 'Asia/Dubai' },
  { id: 'singapore', cityName: 'Singapore', timezone: 'Asia/Singapore' },
  { id: 'mumbai', cityName: 'Mumbai, India', timezone: 'Asia/Kolkata' },
  { id: 'toronto', cityName: 'Toronto, Canada', timezone: 'America/Toronto' },
  { id: 'saopaulo', cityName: 'São Paulo, Brazil', timezone: 'America/Sao_Paulo' },
  { id: 'auckland', cityName: 'Auckland, New Zealand', timezone: 'Pacific/Auckland' },
];

export const TimezoneTool: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'timezone')!;
  const { showToast } = useToast();

  const [zones, setZones] = useState<CityZone[]>(DEFAULT_ZONES);
  const [use24Hour, setUse24Hour] = useState(false);
  const [selectedHourUtc, setSelectedHourUtc] = useState<number>(new Date().getUTCHours());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Update live clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCityTime = (timezone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: !use24Hour,
    }).format(currentTime);
  };

  const formatCityDate = (timezone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(currentTime);
  };

  const getUtcOffset = (timezone: string): string => {
    try {
      const d = new Date();
      const str = d.toLocaleString('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' });
      const match = str.match(/GMT([+-]\d+(:?\d+)?)/);
      return match ? `UTC${match[1]}` : 'UTC';
    } catch {
      return 'UTC';
    }
  };

  // Convert UTC hour into local hour in given timezone for Meeting Planner
  const getMeetingHourInZone = (timezone: string, utcHour: number) => {
    const d = new Date(Date.UTC(2026, 0, 1, utcHour, 0, 0));
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: !use24Hour,
    }).format(d);
  };

  const isWorkingHour = (timezone: string, utcHour: number): boolean => {
    const d = new Date(Date.UTC(2026, 0, 1, utcHour, 0, 0));
    const h24Str = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(d);
    const h = parseInt(h24Str, 10);
    return h >= 9 && h <= 18; // 9:00 AM to 6:00 PM standard working hours
  };

  const removeCity = (id: string) => {
    setZones(zones.filter((z) => z.id !== id));
    showToast('Removed time zone');
  };

  const addCity = (city: CityZone) => {
    if (zones.some((z) => z.id === city.id)) {
      showToast('City already added', 'error');
      return;
    }
    setZones([...zones, city]);
    setShowAddModal(false);
    showToast(`Added ${city.cityName}`);
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Top Controls: 12h/24h toggle & Add City */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setUse24Hour(false)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                !use24Hour
                  ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              12-Hour
            </button>
            <button
              onClick={() => setUse24Hour(true)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                use24Hour
                  ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              24-Hour
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add City / Zone</span>
        </button>
      </div>

      {/* World Clocks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-brand-500/40 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{item.cityName}</h3>
                <span className="text-[11px] font-mono text-brand-500 font-semibold">
                  {getUtcOffset(item.timezone)}
                </span>
              </div>
              <button
                onClick={() => removeCity(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-opacity"
                title="Remove city"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4">
              <div className="text-3xl font-mono font-extrabold text-slate-900 dark:text-white">
                {formatCityTime(item.timezone)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {formatCityDate(item.timezone)}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono">
              {item.timezone}
            </div>
          </div>
        ))}
      </div>

      {/* Meeting Overlap Finder Workspace */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-500" />
              <span>International Meeting Overlap Coordinator</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Drag the timeline hour slider to identify optimal working hours across all selected team zones.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <Sun className="w-3.5 h-3.5" /> Work Hours (9am-6pm)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Moon className="w-3.5 h-3.5" /> Off Hours
            </span>
          </div>
        </div>

        {/* Hour Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Selected Reference Hour: {selectedHourUtc}:00 UTC</span>
            <span className="font-mono text-brand-500">UTC {selectedHourUtc}:00</span>
          </div>
          <input
            type="range"
            min="0"
            max="23"
            value={selectedHourUtc}
            onChange={(e) => setSelectedHourUtc(Number(e.target.value))}
            className="w-full accent-brand-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
        </div>

        {/* Timeline Matrix for Zones */}
        <div className="space-y-3">
          {zones.map((z) => {
            const isWork = isWorkingHour(z.timezone, selectedHourUtc);
            const timeAtHour = getMeetingHourInZone(z.timezone, selectedHourUtc);

            return (
              <div
                key={z.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="w-1/3">
                  <div className="font-semibold text-slate-900 dark:text-white">{z.cityName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{getUtcOffset(z.timezone)}</div>
                </div>

                <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                  {timeAtHour}
                </div>

                <div className="w-1/3 flex justify-end">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                      isWork
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-500'
                    }`}
                  >
                    {isWork ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                    <span>{isWork ? 'In Office' : 'Outside Office'}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add City Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-surface-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Add World City</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {AVAILABLE_ZONES.filter((c) =>
                c.cityName.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((city) => (
                <div
                  key={city.id}
                  onClick={() => addCity(city)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{city.cityName}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{city.timezone}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <RelatedTools currentTool={tool} />
    </div>
  );
};
