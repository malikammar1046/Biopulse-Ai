import json

for p in range(54, 60):
    json_path = f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        d = json.load(f)
    print(f"=== Page {p} ({len(d['boxes'])} boxes) ===")
    for b in sorted(d['boxes'], key=lambda x: x['y_center']):
        if any(w in b['text'].lower() for w in ['chapati', 'masur', 'gosht', 'kalool', 'kofta', 'pulao', 'kabab', 'chicken', 'haleem', 'nihari', 'saag', 'karahi', 'halwa', 'kheer', 'zarda', 'gajar']):
            print(f"  y={b['y_center']:.0f}, x={b['x_center']:.0f}: '{b['text']}'")
