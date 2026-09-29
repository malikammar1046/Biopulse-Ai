import json

for p in range(54, 59):
    with open(f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json', 'r', encoding='utf-8') as f:
        d = json.load(f)
    print(f'================= PAGE {p} =================')
    boxes = sorted(d['boxes'], key=lambda x: (x['y_center'], x['x_center']))
    for b in boxes:
        print(f"y={b['y_center']:6.1f} x={b['x_center']:6.1f}: {b['text']}")
