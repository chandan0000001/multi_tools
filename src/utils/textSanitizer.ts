/**
 * Utility to sanitize text strings for safe embedding into pdf-lib StandardFonts (Helvetica, TimesRoman, Courier).
 * Standard fonts strictly adhere to Adobe WinAnsi / Windows-1252 character encoding.
 * Any character outside this range (e.g. smart quotes, em-dashes, bullets, emoji, or control codes like 0x0003)
 * will cause pdf-lib to throw "WinAnsi cannot encode ...".
 */

// Common typographical and unicode replacements for standard Latin/WinAnsi fonts
const REPLACEMENTS: { [key: string]: string } = {
  // Smart single quotes & apostrophes
  '‘': "'",
  '’': "'",
  '‚': "'",
  '‛': "'",
  '´': "'",
  '`': "'",

  // Smart double quotes
  '“': '"',
  '”': '"',
  '„': '"',
  '‟': '"',
  '«': '"',
  '»': '"',

  // Hyphens, dashes, minus
  '—': '-', // em-dash
  '–': '-', // en-dash
  '−': '-', // minus
  '‐': '-',
  '‑': '-',
  '‒': '-',

  // Bullets & symbols
  '•': '*',
  '◦': '*',
  '▪': '*',
  '▫': '*',
  '‣': '*',
  '⁃': '*',
  '…': '...',

  // Currencies
  '€': 'EUR ',
  '£': 'GBP ',
  '¥': 'JPY ',
  '₹': 'INR ',
  '₽': 'RUB ',
  '₩': 'KRW ',
  '₿': 'BTC ',

  // Math & comparison
  '≤': '<=',
  '≥': '>=',
  '≠': '!=',
  '≈': '~=',
  '±': '+/-',
  '×': 'x',
  '÷': '/',
  '°': ' deg',
  '∞': 'infinity',
  '√': 'sqrt',
  '∑': 'sum',
  'µ': 'u',

  // Legal & copyright
  '©': '(c)',
  '®': '(R)',
  '™': '(TM)',

  // Arrows
  '→': '->',
  '←': '<-',
  '↔': '<->',
  '⇒': '=>',
  '⇐': '<=',
};

/**
 * Strips unprintable control characters and normalizes Unicode strings for standard PDF fonts.
 */
export function sanitizeTextForWinAnsi(input: string): string {
  if (!input) return '';

  // 1. Replace known multi-byte typography and special symbols
  let text = input;
  for (const [search, replace] of Object.entries(REPLACEMENTS)) {
    text = text.split(search).join(replace);
  }

  // 2. Strip unprintable control characters (0x00 - 0x1F except \t, \n, \r)
  // This removes binary zip headers such as 0x0003 from docx files
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

  // 3. Normalize Unicode accents (e.g. café -> cafe)
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 4. Fallback for any remaining un-encodable characters (charCode > 255)
  // Replace characters outside WinAnsi with safe ASCII approximations or spaces
  let sanitized = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 32 && code <= 126) {
      // Standard printable ASCII
      sanitized += text[i];
    } else if (code === 9 || code === 10 || code === 13) {
      // Tab, LF, CR
      sanitized += text[i];
    } else if (code >= 160 && code <= 255) {
      // ISO-8859-1 / WinAnsi extended range
      sanitized += text[i];
    } else {
      // Out of bounds character
      sanitized += ' ';
    }
  }

  return sanitized;
}
