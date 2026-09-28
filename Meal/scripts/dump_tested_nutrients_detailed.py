import json
import re

for p in range(54, 59):
    with open(f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json', 'r', encoding='utf-8') as f:
        d = json.load(f)
    print(f"\n=======================================================")
    print(f"                       PAGE {p}                        ")
    print(f"=======================================================")
    # Sort boxes primarily by vertical position, then horizontal
    boxes = sorted(d['boxes'], key=lambda x: (round(x['y_center']/15)*15, x['x_center']))
    for b in boxes:
        print(f"y={b['y_center']:5.1f} x={b['x_center']:5.1f}: {b['text']}")
