import json
import re

for p in range(60, 69):
    json_path = f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        d = json.load(f)
    print(f"=== Page {p} ({len(d['boxes'])} boxes) ===")
    for b in d['boxes']:
        txt = b['text']
        if any(w in txt.lower() for w in [
            'curry', 'salan', 'daal', 'dal', 'gosht', 'alu', 'bhindi', 'gobi', 
            'matar', 'chapati', 'roti', 'paratha', 'halwa', 'kheer', 'ingredients', 
            'method', 'cooked weight', 'recipe', 'chicken', 'mutton', 'beef', 'dish'
        ]):
            print(f"  {txt}")
