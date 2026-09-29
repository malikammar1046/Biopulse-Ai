import pymupdf

doc = pymupdf.open('Meal/Nutrition_sources/Pakistan_Dietary_Nutrition_2019.pdf')
# Let's inspect page 93 (0-indexed 92) and surrounding pages
for p in [91, 92, 93, 94]:
    print(f"\n=== Page {p+1} ===")
    txt = doc[p].get_text()
    for line in txt.splitlines():
        if any(w in line.lower() for w in ['chapati', 'rice', 'cereal', 'portion', 'annexure', 'serving', 'exchange', 'recipe', 'ingredient']):
            print(f"  {line.strip()}")
