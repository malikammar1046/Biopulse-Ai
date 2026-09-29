import json

# Let's inspect page by page how boxes are positioned
# Each dish table has:
# Header: <Dish Number>. <Dish Name>
# Followed by:
# "Nutrient composition of edible portion" / "Amount in 100 g"
# Energy (Kcal)
# Moisture (g)
# Protein (g)
# Fat (g)
# Carbohydrates (g)
# Fibre (g)
# Ash (g)
# Calcium (mg)
# Iron (mg)
# Vitamin-C (mg)
# Followed by:
# Ingredients and Method of Preparation (Appendix-X)

for p in range(54, 59):
    with open(f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json', 'r', encoding='utf-8') as f:
        d = json.load(f)
    print(f"\n=================== PAGE {p} ===================")
    # let's find boxes with dish numbers
    boxes = d['boxes']
    for b in sorted(boxes, key=lambda x: (x['y_center'], x['x_center'])):
        t = b['text'].strip()
        if any(t.startswith(f"{i}.") or t.startswith(f"{i} ") or f"{i}." in t for i in range(1, 18)):
            if not any(unit in t.lower() for unit in ['g', 'mg', 'kcal']):
                print(f"Dish title: '{t}' at y={b['y_center']:.1f}, x={b['x_center']:.1f}")
