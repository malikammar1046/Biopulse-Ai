import json

for p in range(47, 54):
    fpath = f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json'
    try:
        with open(fpath, 'r', encoding='utf-8') as f:
            d = json.load(f)
        texts = [b['text'] for b in d['boxes']]
        preview = " ".join(texts[:10])
        print(f"Page {p}: {len(texts)} boxes. Preview: {preview}")
    except Exception as e:
        print(f"Page {p}: {e}")
