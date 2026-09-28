import json

for p in range(60, 67):
    with open(f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json', 'r', encoding='utf-8') as f:
        d = json.load(f)
    print(f"\n--- Page {p} ---")
    for b in sorted(d['boxes'], key=lambda x: (round(x['y_center']/12)*12, x['x_center'])):
        t = b['text'].strip()
        if any(w in t.lower() for w in ['serv', 'yield', 'portion', 'weight', 'person', 'cooked']):
            print(f"  {t}")
