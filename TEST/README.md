# MultiTools PRO — Comprehensive Suite Test Assets (All 33 Tools)

This directory provides verified test inputs and assets for each of the 33 browser-native tools in the PDF Productivity Suite:

| # | Tool ID | Folder | Primary Test Assets | Test Purpose |
|---|---|---|---|---|
| 1 | `merge` | `TEST/pdfMerge/` | `pdf1.pdf`, `pdf2.pdf`, `pdf3.pdf` | Combining multi-document sets |
| 2 | `split` | `TEST/pdfSplit/` | `sample_14pages.pdf` | Testing range extraction (`0 1`, `4 2`, `0 9`, `12 7`, `98 9`) |
| 3 | `organize` | `TEST/organize/` | `sample_organize_6pages.pdf` | Reordering and deleting individual pages |
| 4 | `remove-pages` | `TEST/removePages/` | `sample_remove_8pages.pdf` | Selective page elimination |
| 5 | `extract-pages` | `TEST/extractPages/` | `sample_extract_10pages.pdf` | Extracting subsets of pages |
| 6 | `scan-pdf` | `TEST/scanPdf/` | `sample_receipt_scan.jpg`, `sample_document_scan.png` | Camera and scan imports |
| 7 | `compress` | `TEST/pdfCompress/` | `sample_compress.pdf` | Extreme, Recommended, Less downsampling |
| 8 | `ocr` | `TEST/ocr/` | `sample_scanned_ocr.pdf` | Optical character recognition layer |
| 9 | `repair` | `TEST/repair/` | `corrupted_sample.pdf`, `sample_valid.pdf` | Corrupted xref table reconstruction |
| 10 | `jpg-to-pdf` | `TEST/jpgToPdf/` | `photo1.jpg`, `photo2.jpg`, `photo3.png` | Converting images to PDF |
| 11 | `word-to-pdf` | `TEST/wordToPdf/` | `sample_word_report.docx` | Converting Word docx to PDF without WinAnsi errors |
| 12 | `ppt-to-pdf` | `TEST/pptToPdf/` | `sample_presentation_deck.pptx`, `slides_notes.txt` | Presentation slides conversion |
| 13 | `excel-to-pdf` | `TEST/excelToPdf/` | `sample_financial_sheet.csv` | Converting spreadsheet data to PDF sheets |
| 14 | `html-to-pdf` | `TEST/htmlToPdf/` | `sample_report.html` | Visual styled webpage & source code conversion |
| 15 | `txt-to-pdf` | `TEST/txtToPdf/` | `sample_unicode.txt` | Unicode, smart quotes, bullets, math typography |
| 16 | `pdf-to-txt` | `TEST/pdfToTxt/` | `sample_text_extract.pdf` | In-memory text extraction |
| 17 | `pdf-to-jpg` | `TEST/pdfToJpg/` | `sample_13pages.pdf` | 13-page batch rendering and ZIP download |
| 18 | `pdf-to-word` | `TEST/pdfToWord/` | `sample_doc_to_convert.pdf` | Exporting PDF text to editable format |
| 19 | `pdf-to-ppt` | `TEST/pdfToPpt/` | `sample_presentation_slides.pdf` | Exporting slides to presentation deck |
| 20 | `pdf-to-excel` | `TEST/pdfToExcel/` | `sample_tabular_data.pdf` | Exporting tabular data to spreadsheet |
| 21 | `pdf-to-pdfa` | `TEST/pdfToPdfa/` | `sample_archival_candidate.pdf` | ISO 19005-1 archival standard |
| 22 | `pdf-to-markdown` | `TEST/pdfToMarkdown/` | `sample_structured.pdf` | Extracting headings and markdown lists |
| 23 | `rotate` | `TEST/rotate/` | `sample_mixed_orientation.pdf` | 90°, 180°, 270° orientation rotation |
| 24 | `page-numbers` | `TEST/pageNumbers/` | `sample_unnumbered_doc.pdf` | Adding bottom/top page numbers |
| 25 | `watermark` | `TEST/watermark/` | `sample_confidential_contract.pdf`, `confidential_stamp.png` | Text and image watermarks |
| 26 | `crop` | `TEST/crop/` | `sample_wide_margins_doc.pdf` | Trimming page margins |
| 27 | `edit` | `TEST/edit/` | `sample_draft_for_annotation.pdf` | Annotating, notes, stamps |
| 28 | `forms` | `TEST/forms/` | `sample_interactive_form.pdf` | Interactive fillable text fields and checkboxes |
| 29 | `unlock` | `TEST/unlock/` | `protected_password_1234.pdf` | Unlocking AES-encrypted PDF (Password: `1234`) |
| 30 | `protect` | `TEST/protect/` | `sample_unprotected_file.pdf` | AES-256 client-side encryption |
| 31 | `sign` | `TEST/sign/` | `sample_service_agreement.pdf` | Canvas signature and digital stamp |
| 32 | `redact` | `TEST/redact/` | `sample_confidential_records.pdf` | Blackout redaction of sensitive info |
| 33 | `compare` | `TEST/compare/` | `document_version_1.pdf`, `document_version_2.pdf` | Side-by-side visual difference comparison |

All files are created locally and run 100% in-browser with zero server reliance.
