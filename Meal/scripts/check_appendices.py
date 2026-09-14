import json

for p in [64, 65, 67]:
    with open(f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json', 'r', encoding='utf-8') as f:
        d = json.load(f)
    print(f"=== Page {p} ===")
    for b in sorted(d['boxes'], key=lambda x: (x['y_center'], x['x_center'])):
        if b['y_center'] < 300:
            print(f"  y={b['y_center']:5.1f} x={b['x_center']:5.1f}: {b['text']}")
