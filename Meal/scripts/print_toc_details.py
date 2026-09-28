import json

with open('Meal/data/raw/ocr_json/fct_toc_page_007.json', 'r', encoding='utf-8') as f:
    d = json.load(f)
for b in sorted(d['boxes'], key=lambda x: x['y_center']):
    print(f"y={b['y_center']:.0f}, x={b['x_center']:.0f}: '{b['text']}'")
