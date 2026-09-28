import json

# Quadrant boundaries:
# Top: y roughly 80 to 520
# Bottom: y roughly 520 to 1050
# Left: x roughly 100 to 800
# Right: x roughly 800 to 1600

dishes_config = [
    # (page, dish_num, dish_name, y_min, y_max, x_min, x_max)
    (54, 1, "Chapati", 500, 1050, 200, 1600),
    (55, 2, "Daal Masoor Curry", 80, 520, 100, 800),
    (55, 4, "Kalool", 80, 520, 800, 1600),
    (55, 3, "Alu Gosht", 520, 1050, 100, 800),
    (55, 5, "Kofta", 520, 1050, 800, 1600),
    (56, 6, "Pulao Gosht", 80, 520, 100, 800),
    (56, 8, "Chapal Kabab", 80, 520, 800, 1600),
    (56, 7, "Shami Kabab", 520, 1050, 100, 800),
    (56, 9, "Chicken Curry", 520, 1050, 800, 1600),
    (57, 10, "Haleem", 80, 520, 100, 800),
    (57, 12, "Sajji", 80, 520, 800, 1600),
    (57, 11, "Machli", 520, 1050, 100, 800),
    (57, 13, "Biryani", 520, 1050, 800, 1600),
    (58, 14, "Halwa Suji", 80, 520, 100, 800),
    (58, 16, "Kheer", 80, 520, 800, 1600),
    (58, 15, "Zarda", 520, 1050, 100, 800),
    (58, 17, "Halwa Gajar", 520, 1050, 800, 1600),
]

for p, num, name, y0, y1, x0, x1 in dishes_config:
    with open(f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json', 'r', encoding='utf-8') as f:
        d = json.load(f)
    dish_boxes = [b for b in d['boxes'] if y0 <= b['y_center'] <= y1 and x0 <= b['x_center'] <= x1]
    dish_boxes.sort(key=lambda b: (round(b['y_center']/12)*12, b['x_center']))
    print(f"\n================ Dish {num}: {name} (Page {p}) ================")
    for b in dish_boxes:
        print(f"  y={b['y_center']:5.1f} x={b['x_center']:5.1f}: '{b['text']}'")
