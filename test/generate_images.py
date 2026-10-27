import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('test/samples/images', exist_ok=True)

# 1. Sample Landscape / Photo (JPEG)
img_landscape = Image.new('RGB', (1600, 1000), color=(245, 247, 250))
draw = ImageDraw.Draw(img_landscape)
# Gradient simulation
for y in range(1000):
    r = int(30 + (y / 1000) * 80)
    g = int(60 + (y / 1000) * 120)
    b = int(140 + (y / 1000) * 90)
    draw.line([(0, y), (1600, y)], fill=(r, g, b))

# Add some geometric design
draw.ellipse([200, 150, 600, 550], fill=(255, 200, 80, 180), outline=(255, 255, 255), width=4)
draw.polygon([(800, 300), (1200, 700), (400, 700)], fill=(34, 197, 94))
draw.polygon([(1100, 250), (1450, 750), (750, 750)], fill=(16, 185, 129))
draw.text((100, 850), "Multi_Tools Test Landscape Image (1600x1000)", fill=(255, 255, 255))
img_landscape.save('test/samples/images/sample_landscape.jpg', quality=95)

# 2. Scanned Invoice / Document (PNG)
img_scan = Image.new('RGB', (1200, 1600), color=(252, 252, 250))
draw_scan = ImageDraw.Draw(img_scan)
# Header
draw_scan.rectangle([60, 60, 1140, 180], fill=(238, 242, 246))
draw_scan.text((100, 90), "GLOBAL TECH LOGISTICS - INVOICE", fill=(15, 23, 42))
draw_scan.text((100, 130), "Invoice #: INV-2026-98124  |  Date: 2026-10-27  |  Status: PAID", fill=(71, 85, 105))

# Table
draw_scan.rectangle([60, 240, 1140, 290], fill=(226, 232, 240))
draw_scan.text((80, 255), "ITEM DESCRIPTION", fill=(30, 41, 59))
draw_scan.text((600, 255), "QTY", fill=(30, 41, 59))
draw_scan.text((800, 255), "UNIT PRICE", fill=(30, 41, 59))
draw_scan.text((1000, 255), "TOTAL", fill=(30, 41, 59))

items = [
    ("Cloud Server Compute Cluster", "4", "$450.00", "$1,800.00"),
    ("High-Speed Dedicated Fiber Port", "1", "$250.00", "$250.00"),
    ("Automated Backup Storage 20TB", "2", "$80.00", "$160.00"),
    ("Enterprise SSL & Security Suite", "1", "$190.00", "$190.00"),
    ("Client-side OCR Optimization License", "1", "$320.00", "$320.00")
]

y_pos = 320
for item, qty, price, total in items:
    draw_scan.line([(60, y_pos - 10), (1140, y_pos - 10)], fill=(241, 245, 249), width=1)
    draw_scan.text((80, y_pos), item, fill=(51, 65, 85))
    draw_scan.text((620, y_pos), qty, fill=(51, 65, 85))
    draw_scan.text((800, y_pos), price, fill=(51, 65, 85))
    draw_scan.text((1000, y_pos), total, fill=(15, 23, 42))
    y_pos += 60

draw_scan.line([(60, y_pos + 10), (1140, y_pos + 10)], fill=(148, 163, 184), width=2)
draw_scan.text((750, y_pos + 40), "SUBTOTAL: $2,720.00", fill=(71, 85, 105))
draw_scan.text((750, y_pos + 70), "TAX (8%): $217.60", fill=(71, 85, 105))
draw_scan.text((750, y_pos + 110), "GRAND TOTAL: $2,937.60", fill=(225, 29, 72))

draw_scan.text((80, 1450), "Thank you for your business! Scanned document test asset for Multi_Tools OCR & PDF conversion.", fill=(148, 163, 184))
img_scan.save('test/samples/images/sample_scanned_invoice.png')

# 3. Transparent Watermark / Logo (PNG with Alpha)
img_logo = Image.new('RGBA', (600, 600), color=(0, 0, 0, 0))
draw_logo = ImageDraw.Draw(img_logo)
draw_logo.ellipse([50, 50, 550, 550], fill=(225, 29, 72, 220), outline=(255, 255, 255, 255), width=8)
draw_logo.rectangle([150, 260, 450, 340], fill=(255, 255, 255, 240))
draw_logo.text((180, 285), "APPROVED", fill=(225, 29, 72, 255))
img_logo.save('test/samples/images/sample_transparent_stamp.png')

# 4. Large High-Res Image (JPEG 3840x2160)
img_large = Image.new('RGB', (3840, 2160), color=(15, 23, 42))
draw_large = ImageDraw.Draw(img_large)
for i in range(0, 3840, 160):
    draw_large.line([(i, 0), (i, 2160)], fill=(30, 41, 59), width=1)
for j in range(0, 2160, 160):
    draw_large.line([(0, j), (3840, j)], fill=(30, 41, 59), width=1)
draw_large.text((200, 300), "MULTI_TOOLS 4K ULTRA HD TEST ASSET (3840x2160)", fill=(56, 189, 248))
draw_large.text((200, 400), "Ideal for benchmarking Image Resizer, Image Compressor, and WebP Converter", fill=(203, 213, 225))
img_large.save('test/samples/images/sample_highres_4k.jpg', quality=90)

print("Generated sample images successfully in test/samples/images/")
