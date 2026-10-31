import { describe, it, expect } from 'vitest';
import { sanitizeTextForWinAnsi } from '../utils/textSanitizer';
import { PDFDocument, StandardFonts } from 'pdf-lib';

describe('textSanitizer', () => {
  it('sanitizes smart quotes, em-dashes, bullets, and currencies', () => {
    const raw = '“Hello World” — it’s a test with • bullet & ₹500 price & €20.';
    const sanitized = sanitizeTextForWinAnsi(raw);
    expect(sanitized).toBe('"Hello World" - it\'s a test with * bullet & INR 500 price & EUR 20.');
  });

  it('removes control characters like 0x0003 without crashing', () => {
    const binaryGarbage = 'PK\x03\x04\x00\x00SomeText';
    const sanitized = sanitizeTextForWinAnsi(binaryGarbage);
    expect(sanitized).toBe('PKSomeText');
  });

  it('guarantees that pdf-lib can encode the sanitized text without throwing', async () => {
    const problematicText = `
      Operating System Report 2025-26:
      “Special Quotes” & ‘Single Quotes’
      Mathematical: α + β ≤ γ, x ≥ y, ± 5%
      Currency: $100, €85, £75, ¥12000, ₹7500
      Bullet: • Point 1 — Description…
      Binary chars: \x01\x02\x03\x04\x05\x06\x07\x08
    `;

    const sanitized = sanitizeTextForWinAnsi(problematicText);
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage();

    expect(() => {
      page.drawText(sanitized, { x: 50, y: 700, font, size: 10 });
    }).not.toThrow();

    const pdfBytes = await doc.save();
    expect(pdfBytes.length).toBeGreaterThan(100);
  });
});
