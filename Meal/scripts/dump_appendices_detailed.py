import json

with open('Meal/scripts/appendices_raw_text.txt', 'w', encoding='utf-8') as out:
    for p in [64, 65, 66]:
        with open(f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json', 'r', encoding='utf-8') as f:
            d = json.load(f)
        out.write(f"\n=================== Page {p} ===================\n")
        for b in sorted(d['boxes'], key=lambda x: (round(x['y_center']/12)*12, x['x_center'])):
            t = b['text'].strip()
            out.write(f"y={b['y_center']:5.1f} x={b['x_center']:5.1f}: '{t}'\n")

print("Wrote appendices_raw_text.txt successfully!")
