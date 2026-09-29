import json

with open('Meal/data/raw/ocr_json/fct_page_013.json', 'r', encoding='utf-8') as f:
    p13 = json.load(f)
with open('Meal/data/raw/ocr_json/fct_page_014.json', 'r', encoding='utf-8') as f:
    p14 = json.load(f)

print('=== Page 13: Row for Sr 8 (740 <= y <= 775) ===')
for b in sorted(p13['boxes'], key=lambda x: x['x_center']):
    if 740 <= b['y_center'] <= 775:
        print(f"x={b['x_center']:.1f}, y={b['y_center']:.1f}: '{b['text']}' (conf={b['confidence']:.2f})")

print('\n=== Page 14: Row for Sr 8 (740 <= y <= 775) ===')
for b in sorted(p14['boxes'], key=lambda x: x['x_center']):
    if 740 <= b['y_center'] <= 775:
        print(f"x={b['x_center']:.1f}, y={b['y_center']:.1f}: '{b['text']}' (conf={b['confidence']:.2f})")

print('\n=== Page 13: Row for Sr 12 (945 <= y <= 980) ===')
for b in sorted(p13['boxes'], key=lambda x: x['x_center']):
    if 945 <= b['y_center'] <= 980:
        print(f"x={b['x_center']:.1f}, y={b['y_center']:.1f}: '{b['text']}' (conf={b['confidence']:.2f})")

print('\n=== Page 14: Row for Sr 12 (945 <= y <= 980) ===')
for b in sorted(p14['boxes'], key=lambda x: x['x_center']):
    if 945 <= b['y_center'] <= 980:
        print(f"x={b['x_center']:.1f}, y={b['y_center']:.1f}: '{b['text']}' (conf={b['confidence']:.2f})")
