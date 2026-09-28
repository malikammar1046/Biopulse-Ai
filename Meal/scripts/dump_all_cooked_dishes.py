import json
import glob
import re

with open('Meal/data/raw/ocr_json/fct_page_055.json', 'r', encoding='utf-8') as f:
    d = json.load(f)
for b in sorted(d['boxes'], key=lambda x: (x['y_center'], x['x_center'])):
    if 500 <= b['y_center'] <= 700 and b['x_center'] < 600:
        print(f"y={b['y_center']:.1f}, x={b['x_center']:.1f}: '{b['text']}'")


