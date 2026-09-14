import re

# Read tested_dishes_extracted.txt with utf-16 (or utf-8 fallback)
try:
    with open('Meal/scripts/tested_dishes_extracted.txt', 'r', encoding='utf-16') as f:
        content = f.read()
except:
    with open('Meal/scripts/tested_dishes_extracted.txt', 'r', encoding='utf-8') as f:
        content = f.read()

sections = content.split('================ Dish ')
for s in sections[1:]:
    lines = s.strip().splitlines()
    header = lines[0]
    print(f"\n*** {header} ***")
    for l in lines[1:]:
        # only show nutrient lines
        if any(w in l.lower() for w in ['energy', 'moisture', 'protein', 'fat', 'carb', 'fibre', 'fiber', 'ash', 'calcium', 'iron', 'vitamin-c', 'vit', 'kcal', 'appendix']):
            print("  ", l.strip())
