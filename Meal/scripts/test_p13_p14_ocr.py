import os
import json
from rapidocr_onnxruntime import RapidOCR
from PIL import Image

def analyze_page(img_path):
    engine = RapidOCR()
    res, elapse = engine(img_path)
    boxes = []
    for box, text, score in (res or []):
        y_center = sum(p[1] for p in box) / 4.0
        x_center = sum(p[0] for p in box) / 4.0
        boxes.append({'text': text.strip(), 'x': x_center, 'y': y_center, 'score': float(score)})

    boxes.sort(key=lambda b: b['y'])
    rows = []
    curr_row = []
    curr_y = None

    for b in boxes:
        if curr_y is None or abs(b['y'] - curr_y) < 18:
            curr_row.append(b)
            curr_y = b['y'] if curr_y is None else (curr_y * 0.7 + b['y'] * 0.3)
        else:
            curr_row.sort(key=lambda b: b['x'])
            rows.append(curr_row)
            curr_row = [b]
            curr_y = b['y']
    if curr_row:
        curr_row.sort(key=lambda b: b['x'])
        rows.append(curr_row)

    return rows

if __name__ == '__main__':
    scratch = r'C:\Users\hp\.gemini\antigravity-ide\brain\22e0b40b-57d2-427f-9800-65f1d1550fab\scratch'
    for p_name in ['fct_page_13.png', 'fct_page_14.png']:
        p_path = os.path.join(scratch, p_name)
        if os.path.exists(p_path):
            rows = analyze_page(p_path)
            with open('Meal/scripts/ocr_test_output.txt', 'a', encoding='utf-8') as out_f:
                out_f.write(f'=== {p_name} ({len(rows)} detected rows) ===\n')
                for i, r in enumerate(rows):
                    line = ' | '.join(f"{b['text']} (x={b['x']:.0f})" for b in r)
                    out_f.write(f'R{i:02d}: {line}\n')
            print(f'Done {p_name}')
