import pandas as pd

df_ing = pd.read_csv('Meal/data/processed/pakistan_recipe_ingredients.csv')
print("Columns:", df_ing.columns.tolist())
print("\nUnmapped or missing food_id:")
print(df_ing[df_ing['food_id'].isna()][['recipe_ingredient_id', 'recipe_id', 'ingredient_name_original', 'quantity_original', 'quantity_g', 'match_method']])

print("\nMissing or NaN quantity_g:")
print(df_ing[df_ing['quantity_g'].isna()][['recipe_ingredient_id', 'recipe_id', 'ingredient_name_original', 'quantity_original', 'quantity_g', 'food_id']])

print("\nWater ingredients:")
print(df_ing[df_ing['ingredient_name_original'].str.contains('water', case=False, na=False)][['recipe_ingredient_id', 'recipe_id', 'ingredient_name_original', 'quantity_g', 'food_id']])
