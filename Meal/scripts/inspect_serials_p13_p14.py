import json

with open('Meal/data/raw/ocr_json/fct_page_013.json', 'r', encoding='utf-8') as f:
    p13 = json.load(f)
with open('Meal/data/raw/ocr_json/fct_page_014.json', 'r', encoding='utf-8') as f:
    p14 = json.load(f)

print('=== Page 13: All boxes in left column (x < 280) ===')
for b in sorted(p13['boxes'], key=lambda x: x['y_center']):
    if b['x_center'] < 280:
        print(f"y={b['y_center']:.1f}, x={b['x_center']:.1f}: '{b['text']}'")

print('\n=== Page 14: All boxes in left column (x < 130) ===')
for b in sorted(p14['boxes'], key=lambda x: x['y_center']):
    if b['x_center'] < 130:
        print(f"y={b['y_center']:.1f}, x={b['x_center']:.1f}: '{b['text']}'")
