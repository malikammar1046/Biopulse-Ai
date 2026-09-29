import re

with open('Meal/scripts/fct_pages_54_67_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

print("=== AUDITING ALL 17 FCT DISHES FOR SERVINGS, PORTIONS, AND COOKED WEIGHTS ===")

keywords = ['serv', 'portion', 'yield', 'person', 'cooked wt', 'total wt', 'cooked weight', 'serving size', 'servings']

for i in range(1, 18):
    pattern = rf'Appendix-{i}\b|Appendix {i}\b'
    m = re.search(pattern, text, re.IGNORECASE)
    if not m:
        print(f"Appendix {i:02d}: NOT FOUND")
        continue
    pos = m.start()
    sub = text[pos:pos+1500]
    next_m = re.search(r'Appendix-\d+|SWEET DISHES|STATISTICAL', sub[30:], re.IGNORECASE)
    chunk = sub[:30+next_m.start()] if next_m else sub[:800]
    
    found_kw = [k for k in keywords if k in chunk.lower()]
    print(f"\n--- Dish {i:02d} (Appendix-{i}) ---")
    print(f"Keywords matched: {found_kw}")
    for line in chunk.split('\n')[:25]:
        line_s = line.strip()
        if any(k in line_s.lower() for k in ['ball', 'piece', 'shape', 'make', 'divide', 'yield', 'serv', 'portion', 'cook', 'tender', 'bake', 'fry', 'plate']):
            print(f"   [text]: {line_s}")
