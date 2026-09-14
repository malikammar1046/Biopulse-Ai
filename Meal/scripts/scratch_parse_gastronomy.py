import pymupdf
import re

doc = pymupdf.open('Meal/Nutrition_sources/3_v3_1_24.pdf')

table2_text = doc[4].get_text() + '\n' + doc[5].get_text()
lines = [l.strip() for l in table2_text.split('\n') if l.strip()]

# Let's parse Table 2 rows
# Pattern: sr number, followed by dish name (may span 1-3 lines), frequency, relative frequency, percent
parsed = []
current_sr = None
current_name = []
current_vals = []

i = 0
while i < len(lines):
    line = lines[i]
    if re.match(r'^\d+$', line) and 1 <= int(line) <= 62:
        # Check if next lines are not headers
        sr = int(line)
        i += 1
        # Now collect text until next number which represents frequency
        name_parts = []
        while i < len(lines) and not re.match(r'^\d+$', lines[i]):
            name_parts.append(lines[i])
            i += 1
        
        freq = None
        rel_freq = None
        pct = None
        
        if i < len(lines) and re.match(r'^\d+$', lines[i]):
            freq = int(lines[i])
            i += 1
        if i < len(lines) and re.match(r'^0?\.\d+$', lines[i]):
            rel_freq = float(lines[i])
            i += 1
        if i < len(lines) and '%' in lines[i]:
            pct = lines[i]
            i += 1
            
        full_name = ' '.join(name_parts)
        is_std = '*' in pct if pct else False
        parsed.append({
            'sr_no': sr,
            'dish_name': full_name,
            'frequency': freq,
            'relative_frequency': rel_freq,
            'percent': pct,
            'is_selected_for_standardization': is_std
        })
    else:
        i += 1

print(f"Total dishes parsed: {len(parsed)}")
for p in parsed:
    print(f"[{p['sr_no']:02d}] {p['dish_name']} | n={p['frequency']} | rel={p['relative_frequency']} | pct={p['percent']} | std={p['is_selected_for_standardization']}")
