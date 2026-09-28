with open('Meal/scripts/appendices_raw_text.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Let's extract lines on page 64 with x > 800 (which is right column: Machlee)
print("=== Machlee (Page 64, Right Column) ===")
p64_right = []
in_p64 = False
for l in lines:
    if 'Page 64' in l:
        in_p64 = True
        continue
    elif 'Page 65' in l:
        in_p64 = False
        continue
    if in_p64:
        # check x coordinate
        # format: y=  ... x= ...: '...'
        import re
        m = re.search(r'x=\s*(\d+\.?\d*): \'(.*)\'', l)
        if m:
            x_val = float(m.group(1))
            txt = m.group(2)
            if x_val > 800:
                print(f"  x={x_val:.0f}: {txt}")

print("\n=== Page 65 (Saji, Biryani, Halwa Suji, Zarda) ===")
in_p65 = False
for l in lines:
    if 'Page 65' in l:
        in_p65 = True
        continue
    elif 'Page 66' in l:
        in_p65 = False
        continue
    if in_p65:
        m = re.search(r'y=\s*(\d+\.?\d*)\s+x=\s*(\d+\.?\d*): \'(.*)\'', l)
        if m:
            y_val = float(m.group(1))
            x_val = float(m.group(2))
            txt = m.group(3)
            print(f"  y={y_val:4.0f} x={x_val:4.0f}: {txt}")
