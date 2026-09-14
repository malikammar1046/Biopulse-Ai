import pandas as pd

df = pd.read_csv('Meal/data/processed/pakistan_food_composition.csv')
terms = ['fish', 'machli', 'mutton', 'lamb', 'chicken', 'coriander', 'chilli', 'turmeric', 'garam', 'ajwain', 'salt', 'garlic', 'onion', 'potato', 'rice', 'ghee']

for term in terms:
    m = df[df['food_name_en'].str.contains(term, case=False, na=False) | df['food_name_ur'].str.contains(term, case=False, na=False)]
    print(f"\n=== Matches for {term} ({len(m)} found): ===")
    for idx, r in m.iterrows():
        print(f"  {r['food_id']}: {r['food_name_en']} ({r['food_name_ur']})")
