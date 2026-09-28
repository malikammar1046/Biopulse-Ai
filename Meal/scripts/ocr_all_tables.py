import sys
sys.path.insert(0, '.')
import os
import pymupdf
from Meal.scripts.run_ocr_pages import render_and_ocr_page

def run_bulk_ocr():
    pdf_path = 'Meal/Nutrition_sources/ilide.info-book-food-composition-table-for-pakistan-pr_8d2bac791f57d28d0e413a3ac68a8f0b.pdf'
    doc = pymupdf.open(pdf_path)
    
    # Table pages: 19 to 46 (Primary Food Tables)
    # Recipe pages: 54 to 68 (Traditional Foods Formulation & Composition)
    pages_to_process = list(range(19, 47)) + list(range(54, 69))
    print(f"Starting bulk OCR for {len(pages_to_process)} pages...")
    
    for i, p in enumerate(pages_to_process, 1):
        json_path = f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json'
        if os.path.exists(json_path):
            print(f"[{i}/{len(pages_to_process)}] Page {p}: already cached.")
            continue
            
        data = render_and_ocr_page(doc, p, "fct")
        print(f"[{i}/{len(pages_to_process)}] Page {p}: {len(data['boxes'])} boxes extracted.")
        
    print("Bulk OCR complete!")

if __name__ == '__main__':
    run_bulk_ocr()
