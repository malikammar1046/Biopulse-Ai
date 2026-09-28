import json
import os

with open('Meal/data/raw/ocr_json/fct_page_013.json', 'r', encoding='utf-8') as f:
    p13 = json.load(f)
with open('Meal/data/raw/ocr_json/fct_page_014.json', 'r', encoding='utf-8') as f:
    p14 = json.load(f)

print('=== Page 13 boxes near Y for Sr 8 (y ~ 820-920) ===')
for b in sorted(p13['boxes'], key=lambda x: (x['y_center'], x['x_center'])):
    if 820 <= b['y_center'] <= 920:
        print(f"y={b['y_center']:.1f}, x={b['x_center']:.1f}: '{b['text']}' (conf={b['confidence']:.2f})")

print('\n=== Page 14 boxes near Y for Sr 8 (y ~ 820-920) ===')
for b in sorted(p14['boxes'], key=lambda x: (x['y_center'], x['x_center'])):
    if 820 <= b['y_center'] <= 920:
        print(f"y={b['y_center']:.1f}, x={b['x_center']:.1f}: '{b['text']}' (conf={b['confidence']:.2f})")

print('\n=== Page 13 boxes near Y for Sr 12 (y ~ 1050-1180) ===')
for b in sorted(p13['boxes'], key=lambda x: (x['y_center'], x['x_center'])):
    if 1050 <= b['y_center'] <= 1180:
        print(f"y={b['y_center']:.1f}, x={b['x_center']:.1f}: '{b['text']}' (conf={b['confidence']:.2f})")

print('\n=== Page 14 boxes near Y for Sr 12 (y ~ 1050-1180) ===')
for b in sorted(p14['boxes'], key=lambda x: (x['y_center'], x['x_center'])):
    if 1050 <= b['y_center'] <= 1180:
        print(f"y={b['y_center']:.1f}, x={b['x_center']:.1f}: '{b['text']}' (conf={b['confidence']:.2f})")
