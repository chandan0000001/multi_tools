# Multi_Tools Test Fixtures & Sample Assets

This directory contains pre-generated sample documents and images designed to verify the performance, quality, and edge cases of the Multi_Tools suite.

---

## 📁 Sample PDFs (`test/samples/pdfs/`)

| Filename | Description | Ideal For Testing |
| :--- | :--- | :--- |
| **`sample_scanned_invoice_ocr.pdf`** | 1-page PDF document embedding a realistic scanned invoice graphic. | **OCR PDF**, Searchable PDF generation, Text Transcript extraction. |
| **`sample_multipage_report.pdf`** | 4-page structured document with cover page, architecture table, and text. | **Split PDF**, **Organize PDF**, **Add Page Numbers**, **Watermark**, **Remove Pages**. |
| **`sample_contract_agreement.pdf`** | 2-page mutual NDA draft with dedicated signature blocks. | **Sign PDF**, **Protect PDF** (password encrypt), **Unlock PDF**, **Redact PDF**. |
| **`sample_merge_part1.pdf`** | Volume 1 introduction document. | **Merge PDF** (combine with Part 2). |
| **`sample_merge_part2.pdf`** | Volume 2 appendix document. | **Merge PDF** (combine with Part 1). |
| **`sample_presentation_slides.pdf`** | Landscape presentation slide deck. | **PDF to JPG**, **Crop PDF**, **PDF to Markdown**. |

---

## 🖼️ Sample Images (`test/samples/images/`)

| Filename | Dimensions & Format | Ideal For Testing |
| :--- | :--- | :--- |
| **`sample_highres_4k.jpg`** | 3840 × 2160 (4K JPEG) | **Image Compressor**, **Image Resizer**, high-resolution scaling benchmark. |
| **`sample_scanned_invoice.png`** | 1200 × 1600 (Document PNG) | **JPG/PNG to PDF**, optical clarity, and document conversion. |
| **`sample_landscape.jpg`** | 1600 × 1000 (Color JPEG) | **JPG to PDF**, format converter (PNG / WebP), thumbnail generator. |
| **`sample_transparent_stamp.png`**| 600 × 600 (RGBA Transparent PNG) | **Watermark**, stamp overlay, transparent signature compositing. |

---

## 🔄 Re-generating Test Files

To rebuild these sample files at any time, execute:

```bash
# Generate images
python3 test/generate_images.py

# Generate PDFs
node test/generate_pdfs.mjs
```
