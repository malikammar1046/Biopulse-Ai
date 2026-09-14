import pymupdf
import os

sources = [
    'Meal/Nutrition_sources/Pakistan_Dietary_Nutrition_2019.pdf',
    'Meal/Nutrition_sources/CoD_Pakistan_July_2016.pdf',
    'Meal/Nutrition_sources/3_v3_1_24.pdf'
]

terms = ['nihari', 'sarson', 'karahi', 'saag']

for src in sources:
    if not os.path.exists(src):
        continue
    doc = pymupdf.open(src)
    print(f"\n--- Checking {os.path.basename(src)} ({len(doc)} pages) ---")
    matches = {t: [] for t in terms}
    for p_idx in range(len(doc)):
        txt = doc[p_idx].get_text().lower()
        for t in terms:
            if t in txt:
                matches[t].append(p_idx + 1)
    for t, pages in matches.items():
        if pages:
            print(f"  '{t}' found on pages: {pages[:10]}")
        else:
            print(f"  '{t}': not found")
