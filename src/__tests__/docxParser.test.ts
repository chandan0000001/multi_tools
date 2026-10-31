import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseDocxFile } from '../utils/docxParser';

describe('docxParser', () => {
  it('parses real sample_word_report.docx and extracts headings and paragraphs', async () => {
    const docxPath = path.resolve(__dirname, '../../TEST/wordToPdf/sample_word_report.docx');
    if (!fs.existsSync(docxPath)) {
      console.warn('sample_word_report.docx not found, skipping');
      return;
    }

    const fileBuf = fs.readFileSync(docxPath);
    const paragraphs = await parseDocxFile(fileBuf);

    expect(paragraphs.length).toBeGreaterThan(0);
    const textAll = paragraphs.map((p) => p.text).join(' ');
    expect(textAll).toContain('BPUT OS Exam Prediction Report');
    expect(textAll).toContain('Process Scheduling');
  });
});
