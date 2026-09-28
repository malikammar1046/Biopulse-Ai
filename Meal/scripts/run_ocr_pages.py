import os
import json
import pymupdf
from PIL import Image
from rapidocr_onnxruntime import RapidOCR

def ensure_dirs():
    os.makedirs('Meal/data/raw/rendered_pages', exist_ok=True)
    os.makedirs('Meal/data/raw/ocr_json', exist_ok=True)

def render_and_ocr_page(doc, page_num, pdf_name="fct", force_reocr=False):
    ensure_dirs()
    img_path = f'Meal/data/raw/rendered_pages/{pdf_name}_page_{page_num:03d}.png'
    json_path = f'Meal/data/raw/ocr_json/{pdf_name}_page_{page_num:03d}.json'

    if not force_reocr and os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    # Render page if needed
    if not os.path.exists(img_path):
        page = doc[page_num - 1] # 0-indexed
        pix = page.get_pixmap(dpi=150)
        pix.save(img_path)

    engine = RapidOCR()
    
    # Pass 1: Full page OCR
    res_full, _ = engine(img_path)
    
    ocr_data = {
        'pdf_name': pdf_name,
        'page_num': page_num,
        'img_path': img_path,
        'boxes': []
    }
    
    existing_coords = []
    if res_full:
        for box, text, score in res_full:
            y_center = sum(p[1] for p in box) / 4.0
            x_center = sum(p[0] for p in box) / 4.0
            ocr_data['boxes'].append({
                'text': text.strip(),
                'confidence': float(score),
                'box': [[float(p[0]), float(p[1])] for p in box],
                'x_center': round(x_center, 2),
                'y_center': round(y_center, 2)
            })
            existing_coords.append((x_center, y_center))
            
    # Pass 2: High-resolution Numeric Grid crop for table pages (p. 13 to 46)
    # Even pages have numbers grid at x: [780, 1550], y: [280, 1150]
    # Odd pages have numbers grid at x: [120, 1450], y: [280, 1150]
    if 13 <= page_num <= 46:
        im = Image.open(img_path)
        is_even = (page_num % 2 == 1) # Note: PDF page 13 is Even in book (p. 6), PDF 14 is Odd (p. 7)
        # Check if page has English/Urdu text on left (Even)
        # In our PDF: Page 13 has English/Urdu, so it is the proximate table.
        # Page 14 has Minerals/Vitamins, so it is the micronutrient table.
        if page_num % 2 == 1: # PDF 13, 15, 17... proximate table
            crop_box = (780, 280, min(im.width, 1550), min(im.height, 1150))
        else: # PDF 14, 16, 18... micronutrient table
            crop_box = (120, 280, min(im.width, 1450), min(im.height, 1150))
            
        crop_img = im.crop(crop_box)
        crop_temp_path = f'Meal/data/raw/rendered_pages/temp_grid_{page_num:03d}.png'
        crop_img.save(crop_temp_path)
        
        res_grid, _ = engine(crop_temp_path)
        if os.path.exists(crop_temp_path):
            os.remove(crop_temp_path)
            
        if res_grid:
            ox, oy = crop_box[0], crop_box[1]
            for box, text, score in res_grid:
                cy = (sum(p[1] for p in box) / 4.0) + oy
                cx = (sum(p[0] for p in box) / 4.0) + ox
                
                # Check if this box is already covered by full page pass
                already_covered = any(abs(cx - ex) < 25 and abs(cy - ey) < 15 for ex, ey in existing_coords)
                if not already_covered and text.strip():
                    ocr_data['boxes'].append({
                        'text': text.strip(),
                        'confidence': float(score),
                        'box': [[float(p[0]) + ox, float(p[1]) + oy] for p in box],
                        'x_center': round(cx, 2),
                        'y_center': round(cy, 2),
                        'source_pass': 'grid_refinement'
                    })
                    existing_coords.append((cx, cy))
                    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(ocr_data, f, indent=2, ensure_ascii=False)
        
    return ocr_data

if __name__ == '__main__':
    pdf_path = 'Meal/Nutrition_sources/ilide.info-book-food-composition-table-for-pakistan-pr_8d2bac791f57d28d0e413a3ac68a8f0b.pdf'
    doc = pymupdf.open(pdf_path)
    print("Testing dual-pass OCR on pages 13, 14, 15, 16, 17, 18 with force_reocr=True...")
    for p in [13, 14, 15, 16, 17, 18]:
        d = render_and_ocr_page(doc, p, "fct", force_reocr=True)
        print(f"Page {p}: {len(d['boxes'])} total boxes after grid refinement.")
