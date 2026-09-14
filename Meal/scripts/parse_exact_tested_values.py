import json
import re

dishes_config = [
    # (page, dish_num, dish_name, y_min, y_max, x_min, x_max, appendix)
    (54, 1, "Chapati", 500, 1050, 200, 1600, 1),
    (55, 2, "Daal Masoor Curry", 80, 520, 100, 800, 2),
    (55, 3, "Alu Gosht", 520, 1050, 100, 800, 3),
    (55, 4, "Kalool", 80, 520, 800, 1600, 4),
    (55, 5, "Kofta", 520, 1050, 800, 1600, 5),
    (56, 6, "Pulao Gosht", 80, 520, 100, 800, 6),
    (56, 7, "Shami Kabab", 520, 1050, 100, 800, 7),
    (56, 8, "Chapal Kabab", 80, 520, 800, 1600, 8),
    (56, 9, "Chicken Curry", 520, 1050, 800, 1600, 9),
    (57, 10, "Haleem", 80, 520, 100, 800, 10),
    (57, 11, "Machli", 520, 1050, 100, 800, 11),
    (57, 12, "Sajji", 80, 520, 800, 1600, 12),
    (57, 13, "Biryani", 520, 1050, 800, 1600, 13),
    (58, 14, "Halwa Suji", 80, 520, 100, 800, 14),
    (58, 15, "Zarda", 520, 1050, 100, 800, 15),
    (58, 16, "Kheer", 80, 520, 800, 1600, 16),
    (58, 17, "Halwa Gajar", 520, 1050, 800, 1600, 17),
]

for p, num, name, y0, y1, x0, x1, app in sorted(dishes_config, key=lambda x: x[1]):
    with open(f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json', 'r', encoding='utf-8') as f:
        d = json.load(f)
    dish_boxes = [b for b in d['boxes'] if y0 <= b['y_center'] <= y1 and x0 <= b['x_center'] <= x1]
    dish_boxes.sort(key=lambda b: (round(b['y_center']/14)*14, b['x_center']))
    print(f"\nDish {num}: {name} (FCT page {p}, Appendix-{app})")
    # print line by line sorted by y
    current_y = None
    line_boxes = []
    for b in dish_boxes:
        y_bin = round(b['y_center'] / 14) * 14
        if current_y is None or y_bin == current_y:
            line_boxes.append(b)
            current_y = y_bin
        else:
            line_boxes.sort(key=lambda x: x['x_center'])
            print(f"  y~{current_y:4.0f}: " + " | ".join(f"{bx['text']} (x={bx['x_center']:.0f})" for bx in line_boxes))
            line_boxes = [b]
            current_y = y_bin
    if line_boxes:
        line_boxes.sort(key=lambda x: x['x_center'])
        print(f"  y~{current_y:4.0f}: " + " | ".join(f"{bx['text']} (x={bx['x_center']:.0f})" for bx in line_boxes))
