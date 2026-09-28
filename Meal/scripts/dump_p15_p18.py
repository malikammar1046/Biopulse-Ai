import json

def dump_rows_from_json(json_path, out_txt):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    boxes = data['boxes']
    boxes.sort(key=lambda b: b['y_center'])
    
    rows = []
    curr_row = []
    curr_y = None
    
    for b in boxes:
        if curr_y is None or abs(b['y_center'] - curr_y) < 18:
            curr_row.append(b)
            curr_y = b['y_center'] if curr_y is None else (curr_y * 0.7 + b['y_center'] * 0.3)
        else:
            curr_row.sort(key=lambda b: b['x_center'])
            rows.append(curr_row)
            curr_row = [b]
            curr_y = b['y_center']
    if curr_row:
        curr_row.sort(key=lambda b: b['x_center'])
        rows.append(curr_row)
        
    with open(out_txt, 'w', encoding='utf-8') as out:
        out.write(f"=== {json_path} ({len(rows)} rows) ===\n")
        for i, r in enumerate(rows):
            line = ' | '.join(f"{b['text']} (x={b['x_center']:.0f})" for b in r)
            out.write(f"R{i:02d}: {line}\n")
    print(f"Dumped {len(rows)} rows to {out_txt}")

if __name__ == '__main__':
    for p in [15, 16, 17, 18]:
        dump_rows_from_json(f'Meal/data/raw/ocr_json/fct_page_{p:03d}.json', f'Meal/scripts/dump_p{p}.txt')
