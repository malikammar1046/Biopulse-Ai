import pandas as pd

df = pd.read_csv('Meal/data/processed/pakistan_food_composition.csv')
print("Food groups in primary FCT:")
print(df['food_group'].value_counts())

for cat in df['food_group'].unique():
    sub = df[df['food_group'] == cat]
    print(f"\n=== {cat} ({len(sub)} items) ===")
    for _, r in sub.head(5).iterrows():
        print(f"  {r['food_id']}: {r['food_name_en']} ({r['food_name_ur']}) - kcal: {r['energy_kcal']}, p: {r['protein_g']}, f: {r['fat_g']}, c: {r['carb_g']}, fib: {r['fiber_g']}")

