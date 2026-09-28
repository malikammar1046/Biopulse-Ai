import json
import os

with open('Meal/scripts/fct_pages_54_67_text.txt', 'w', encoding='utf-8') as out_f:
    out_f.write("=== AUDIT OF APPENDICES 1-17 FOR SERVINGS, PORTIONS, AND COOKED WEIGHTS ===\n")
    for p in range(54, 68):
        fname = f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json'
        if not os.path.exists(fname):
            continue
        with open(fname, 'r', encoding='utf-8') as f:
            d = json.load(f)
        out_f.write(f"\n--- PAGE {p} (boxes: {len(d['boxes'])}) ---\n")
        boxes = sorted(d['boxes'], key=lambda b: (round(b['y_center']/15)*15, b['x_center']))
        for b in boxes:
            t = b['text'].strip()
            out_f.write(f"  {t}\n")
print("Dumped successfully to Meal/scripts/fct_pages_54_67_text.txt")

