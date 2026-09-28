import sys
sys.path.insert(0, '.')
import json
import pymupdf
from Meal.scripts.run_ocr_pages import render_and_ocr_page

doc = pymupdf.open('Meal/Nutrition_sources/ilide.info-book-food-composition-table-for-pakistan-pr_8d2bac791f57d28d0e413a3ac68a8f0b.pdf')
for p in [5, 6]:
    d = render_and_ocr_page(doc, p, 'fct_toc')
    print(f"TOC Page {p}: {len(d['boxes'])} boxes")
    for b in d['boxes']:
        txt = b['text']
        print(f"  {txt}")
