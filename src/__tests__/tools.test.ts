import { describe, it, expect } from 'vitest';

describe('Developer & Math Utilities Logic', () => {
  // UTF-8 Base64
  it('correctly encodes and decodes UTF-8 text with emojis', () => {
    const input = 'Multi_Tools 🚀 — 100% Local 🌍';
    const bytes = new TextEncoder().encode(input);
    const binString = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    const encoded = btoa(binString);

    const decodedBin = atob(encoded);
    const decodedBytes = Uint8Array.from(decodedBin, (m) => m.charCodeAt(0));
    const decoded = new TextDecoder().decode(decodedBytes);

    expect(decoded).toBe(input);
  });

  // URL parsing & encoding
  it('parses URL query params accurately', () => {
    const raw = 'https://example.com/search?query=react+tools&sort=asc&limit=25';
    const parsed = new URL(raw);
    expect(parsed.searchParams.get('query')).toBe('react tools');
    expect(parsed.searchParams.get('sort')).toBe('asc');
    expect(parsed.searchParams.get('limit')).toBe('25');
  });

  // JSON Minification & Formatting
  it('formats and minifies JSON without loss', () => {
    const data = { app: 'Multi_Tools', version: 1, active: true };
    const formatted = JSON.stringify(data, null, 2);
    const minified = JSON.stringify(data);

    expect(JSON.parse(formatted)).toEqual(data);
    expect(JSON.parse(minified)).toEqual(data);
    expect(minified).not.toContain('\n');
  });

  // Loan EMI formula
  it('calculates standard loan EMI correctly', () => {
    const p = 10000;
    const r = 10 / 12 / 100; // 10% annual
    const n = 12; // 1 year
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    expect(Number(emi.toFixed(2))).toBe(879.16);
  });
});
