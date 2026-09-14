import json
import re

print("="*30 + " PAGES 54 to 58 (Tested Nutrients) " + "="*30)
for p in range(54, 59):
    with open(f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json', 'r', encoding='utf-8') as f:
        d = json.load(f)
    print(f"\n--- PDF Page {p} ---")
    boxes = sorted(d['boxes'], key=lambda x: (x['y_center'], x['x_center']))
    for b in boxes:
        t = b['text'].strip()
        # Look for dish numbers or Appendix references
        if re.search(r'\b([1-9]|1[0-7])[\.\s]', t) or 'appendix' in t.lower():
            # filter out simple numbers like 100 g, 1.0 g
            if not re.match(r'^\d+(\.\d+)?\s*(g|mg|kcal|ppm|mcg)?$', t, re.IGNORECASE):
                print(f"y={b['y_center']:6.1f}, x={b['x_center']:6.1f}: {t}")

print("\n" + "="*30 + " PAGES 59 to 68 (Recipe Appendices) " + "="*30)
for p in range(59, 69):
    with open(f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json', 'r', encoding='utf-8') as f:
        d = json.load(f)
    print(f"\n--- PDF Page {p} ---")
    boxes = sorted(d['boxes'], key=lambda x: (x['y_center'], x['x_center']))
    for b in boxes:
        t = b['text'].strip()
        if 'appendix' in t.lower() or any(w in t.lower() for w in ['chapati', 'masur', 'masoor', 'gosht', 'kalool', 'kaloo', 'kofta', 'pulao', 'kabab', 'chicken', 'haleem', 'nihari', 'saag', 'karahi', 'halwa', 'kheer', 'zarda', 'gajar', 'machli', 'sajji', 'biryani']):
            print(f"y={b['y_center']:6.1f}, x={b['x_center']:6.1f}: {t}")
