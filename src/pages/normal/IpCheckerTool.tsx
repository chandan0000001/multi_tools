import React, { useState, useEffect } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import { setCachedResult, getCachedResult } from '../../utils/cacheManager';
import {
  Globe,
  Search,
  RotateCcw,
  Copy,
  Trash2,
  ShieldAlert,
  Server,
  MapPin,
  Building,
  Check,
} from 'lucide-react';

interface IpDetails {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  org?: string;
  asn?: string;
  timezone?: string;
  timestamp: string;
}

export const IpCheckerTool: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'ip-checker')!;
  const { showToast } = useToast();

  const [currentIpData, setCurrentIpData] = useState<IpDetails | null>(null);
  const [manualQuery, setManualQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<IpDetails | null>(null);

  const [history, setHistory] = useState<IpDetails[]>(() => {
    return getCachedResult<IpDetails[]>('ip-checker', 'history') || [];
  });

  useEffect(() => {
    setCachedResult('ip-checker', 'history', history);
  }, [history]);

  // Fetch visitor's public IP automatically on click or mount
  const fetchMyIp = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        const details: IpDetails = {
          ip: data.ip,
          country: data.country_name,
          region: data.region,
          city: data.city,
          org: data.org,
          asn: data.asn,
          timezone: data.timezone,
          timestamp: new Date().toLocaleTimeString(),
        };
        setCurrentIpData(details);
        setHistory((prev) => [details, ...prev.filter((h) => h.ip !== details.ip).slice(0, 9)]);
        showToast('Public IP resolved successfully');
      } else {
        // Fallback to ipify if ipapi rate limited
        const ipifyRes = await fetch('https://api.ipify.org?format=json');
        const ipifyData = await ipifyRes.json();
        const details: IpDetails = {
          ip: ipifyData.ip,
          country: 'Unknown (ipify fallback)',
          timestamp: new Date().toLocaleTimeString(),
        };
        setCurrentIpData(details);
      }
    } catch {
      showToast('Could not query IP service; please check network connection', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyIp();
  }, []);

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = manualQuery.trim();
    if (!query) return;

    setIsLoading(true);
    try {
      const res = await fetch(`https://ipapi.co/${query}/json/`);
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          showToast(`Lookup error: ${data.reason || 'Invalid IP'}`, 'error');
        } else {
          const details: IpDetails = {
            ip: data.ip,
            country: data.country_name,
            region: data.region,
            city: data.city,
            org: data.org,
            asn: data.asn,
            timezone: data.timezone,
            timestamp: new Date().toLocaleTimeString(),
          };
          setLookupResult(details);
          setHistory((prev) => [details, ...prev.filter((h) => h.ip !== details.ip).slice(0, 9)]);
          showToast(`Resolved IP: ${details.ip}`);
        }
      } else {
        showToast('Could not resolve target IP', 'error');
      }
    } catch {
      showToast('Lookup request failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (val: string) => {
    navigator.clipboard.writeText(val);
    showToast(`Copied ${val}`);
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Primary IP Card */}
      <div className="p-8 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Your Visible Public IP Address
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-extrabold text-brand-600 dark:text-brand-400 mt-1">
              {currentIpData ? currentIpData.ip : isLoading ? 'Resolving IP...' : 'Unavailable'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentIpData && (
              <button
                onClick={() => copyToClipboard(currentIpData.ip)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy IP</span>
              </button>
            )}
            <button
              onClick={fetchMyIp}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Network & Geolocation Metadata */}
        {currentIpData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Country & Region
              </span>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {currentIpData.city ? `${currentIpData.city}, ` : ''}{currentIpData.country || 'N/A'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-emerald-400" /> ISP / Organization
              </span>
              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={currentIpData.org}>
                {currentIpData.org || 'N/A'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-amber-400" /> ASN Identifier
              </span>
              <div className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                {currentIpData.asn || 'N/A'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-purple-400" /> Timezone
              </span>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {currentIpData.timezone || 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual IP Lookup Search */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Inspect Any Custom IP / Domain
        </h3>

        <form onSubmit={handleManualLookup} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Enter any IPv4 or IPv6 (e.g. 8.8.8.8, 1.1.1.1)..."
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !manualQuery}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
          >
            Lookup
          </button>
        </form>

        {lookupResult && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-brand-500">{lookupResult.ip}</span>
              <button
                onClick={() => copyToClipboard(lookupResult.ip)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div><strong>Country:</strong> {lookupResult.country || 'N/A'}</div>
              <div><strong>City:</strong> {lookupResult.city || 'N/A'}</div>
              <div><strong>Org:</strong> {lookupResult.org || 'N/A'}</div>
              <div><strong>ASN:</strong> {lookupResult.asn || 'N/A'}</div>
            </div>
          </div>
        )}
      </div>

      {/* History table */}
      {history.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Lookup History ({history.length})
            </span>
            <button
              onClick={() => {
                setHistory([]);
                showToast('History cleared');
              }}
              className="text-xs text-rose-500 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>

          <div className="space-y-1.5">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 dark:text-white">{item.ip}</span>
                  <span className="text-slate-400 font-sans">
                    {item.city ? `${item.city}, ` : ''}{item.country} ({item.org || 'ISP'})
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(item.ip)}
                  className="p-1 text-slate-400 hover:text-brand-500"
                  title="Copy IP"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>Geolocation Notice:</strong> IP geolocation is based on public ISP allocation registries and points of presence. It provides approximate country/city region data and does not represent precise physical or GPS coordinates.
        </span>
      </div>

      <RelatedTools currentTool={tool} />
    </div>
  );
};
