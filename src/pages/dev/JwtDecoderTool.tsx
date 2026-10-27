import React, { useState, useMemo } from 'react';
import { ToolHeader } from '../../components/common/ToolHeader';
import { RelatedTools } from '../../components/common/RelatedTools';
import { TOOLS } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';
import {
  ShieldAlert,
  Copy,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Key,
} from 'lucide-react';

export const JwtDecoderTool: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'jwt-decoder')!;
  const { showToast } = useToast();

  const [jwtInput, setJwtInput] = useState(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTc2MTU2MDAwMCwiZXhwIjoxNzkyMDAwMDAwfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
  );

  // Decode base64url string
  const base64UrlDecode = (str: string): string => {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += '==';
        break;
      case 3:
        output += '=';
        break;
      default:
        throw new Error('Illegal base64url string');
    }
    const binString = atob(output);
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  };

  const decoded = useMemo(() => {
    if (!jwtInput.trim()) return null;

    const parts = jwtInput.trim().split('.');
    if (parts.length !== 3) {
      return { error: 'Invalid JWT structure. A JWT must consist of 3 dot-separated segments.' };
    }

    try {
      const headerJson = base64UrlDecode(parts[0]);
      const payloadJson = base64UrlDecode(parts[1]);

      const headerObj = JSON.parse(headerJson);
      const payloadObj = JSON.parse(payloadJson);

      return {
        header: headerObj,
        payload: payloadObj,
        signature: parts[2],
        error: null,
      };
    } catch (err: any) {
      return { error: `Failed to decode JWT segments: ${err.message}` };
    }
  }, [jwtInput]);

  // Claims humanizer
  const claimsStatus = useMemo(() => {
    if (!decoded || !decoded.payload) return null;
    const { exp, iat, nbf } = decoded.payload;
    const nowSec = Math.floor(Date.now() / 1000);

    let isExpired = false;
    let expDate = null;
    let iatDate = null;

    if (exp && typeof exp === 'number') {
      isExpired = nowSec > exp;
      expDate = new Date(exp * 1000).toLocaleString();
    }
    if (iat && typeof iat === 'number') {
      iatDate = new Date(iat * 1000).toLocaleString();
    }

    return { isExpired, expDate, iatDate, nowSec };
  }, [decoded]);

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    showToast('Copied decoded JSON');
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} />

      {/* Prominent Security Notice Requirement (PRD Section 7.6 & 3) */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs space-y-1">
        <div className="flex items-center gap-2 font-bold text-sm">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>Security Notice: Decoding is NOT Cryptographic Signature Verification</span>
        </div>
        <p className="leading-relaxed">
          Decoding simply parses the base64url payload. It does <strong>not</strong> verify that the token was signed with the correct private/secret key or that the payload has not been tampered with. Tokens are processed purely in-memory and are never transmitted to any external server.
        </p>
      </div>

      {/* Input token textarea */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>Encoded JWT Token String</span>
          <button
            onClick={() => setJwtInput('')}
            className="text-slate-400 hover:text-rose-500 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
        <textarea
          rows={4}
          value={jwtInput}
          onChange={(e) => setJwtInput(e.target.value)}
          placeholder="Paste JWT here (e.g. eyJhbGci...)"
          className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:border-brand-500"
        />
      </div>

      {decoded?.error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-mono flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{decoded.error}</span>
        </div>
      )}

      {/* Decoded Inspection Panels */}
      {decoded && !decoded.error && (
        <div className="space-y-6">
          {/* Claims Expiry Status */}
          {claimsStatus && (
            <div className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-500" />
                <span className="font-semibold text-slate-900 dark:text-white">Token Expiration Status:</span>
                {claimsStatus.expDate ? (
                  claimsStatus.isExpired ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 font-semibold border border-rose-500/20">
                      Expired ({claimsStatus.expDate})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                      Active / Valid (Expires: {claimsStatus.expDate})
                    </span>
                  )
                ) : (
                  <span className="text-slate-400">No &quot;exp&quot; claim present</span>
                )}
              </div>

              {claimsStatus.iatDate && (
                <div className="text-slate-400 font-mono text-[11px]">
                  Issued At (iat): {claimsStatus.iatDate}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Header */}
            <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-indigo-400">Header: Algorithm & Token Type</span>
                <button
                  onClick={() => copyToClipboard(decoded.header)}
                  className="text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
              <pre className="p-3 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 font-mono text-xs overflow-x-auto text-slate-800 dark:text-slate-200">
                {JSON.stringify(decoded.header, null, 2)}
              </pre>
            </div>

            {/* Payload */}
            <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-emerald-400">Payload: Data Claims</span>
                <button
                  onClick={() => copyToClipboard(decoded.payload)}
                  className="text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
              <pre className="p-3 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-slate-800 font-mono text-xs overflow-x-auto text-slate-800 dark:text-slate-200">
                {JSON.stringify(decoded.payload, null, 2)}
              </pre>
            </div>
          </div>

          {/* Signature Segment */}
          <div className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <span className="text-slate-400 block mb-1 font-sans font-semibold">Signature Checksum Segment</span>
            <div className="text-slate-600 dark:text-slate-400 break-all">{decoded.signature}</div>
          </div>
        </div>
      )}

      <RelatedTools currentTool={tool} />
    </div>
  );
};
