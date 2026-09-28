import pymupdf

doc = pymupdf.open('Meal/Nutrition_sources/3_v3_1_24.pdf')
print("Pages count:", len(doc))
for i in range(len(doc)):
    txt = doc[i].get_text()
    for line in txt.splitlines():
        if any(w in line.lower() for w in ['table', 'recipe', 'standardized', 'dish', 'saag', 'sarson', 'nihari', 'karahi', 'ingredients']):
            if len(line.strip()) < 80:
                print(f"P{i+1}: {line.strip()}")
