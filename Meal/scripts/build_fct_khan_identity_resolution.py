"""
Builds the FCT vs Khan (2019) Identity Resolution Dataset.
Resolves provisional matches between FCT 2001 (Appendix 1-17) and Khan et al. (2019)
based on manual review of source names, common names, major ingredients, and preparation methods.

Classifies each comparison as:
- CONFIRMED_SAME_DISH
- RELATED_VARIANT
- DIFFERENT_DISH
- INSUFFICIENT_EVIDENCE
"""

import pandas as pd

def build_identity_resolution():
    resolution_records = [
        {
            'fct_recipe_id': 'PK_RCP_003',
            'fct_name': 'Alu Gosht',
            'khan_dish_id': 'KHAN_2019_001',
            'khan_name': 'Potato meat (Aloo gosht)',
            'name_similarity': 'HIGH',
            'major_ingredient_similarity': 'HIGH',
            'preparation_similarity': 'HIGH',
            'final_identity_status': 'CONFIRMED_SAME_DISH',
            'review_notes': 'Both sources evaluate traditional Pakistani beef-and-potato curry. Formulations share identical core ingredients (beef, potato, onion, tomato, garlic, ginger, spices, oil/ghee, water) and traditional braising/simmering preparation.'
        },
        {
            'fct_recipe_id': 'PK_RCP_004',
            'fct_name': 'Kalool',
            'khan_dish_id': 'KHAN_2019_020',
            'khan_name': 'Kidney beans (Lobia)',
            'name_similarity': 'MODERATE_HIGH',
            'major_ingredient_similarity': 'HIGH',
            'preparation_similarity': 'HIGH',
            'final_identity_status': 'CONFIRMED_SAME_DISH',
            'review_notes': 'Kalool is the regional Pashto designation for Lobia (red kidney bean curry). Both sources evaluate boiled red kidney beans simmered in spiced onion-tomato gravy.'
        },
        {
            'fct_recipe_id': 'PK_RCP_005',
            'fct_name': 'Kofta',
            'khan_dish_id': 'KHAN_2019_019',
            'khan_name': 'Meat balls curry (Koftay)',
            'name_similarity': 'HIGH',
            'major_ingredient_similarity': 'HIGH',
            'preparation_similarity': 'HIGH',
            'final_identity_status': 'CONFIRMED_SAME_DISH',
            'review_notes': 'Both sources evaluate minced beef meatballs bound with chickpea flour and simmered in seasoned curry gravy.'
        },
        {
            'fct_recipe_id': 'PK_RCP_006',
            'fct_name': 'Pulao Gosht',
            'khan_dish_id': 'KHAN_2019_027',
            'khan_name': 'Beef pulao (Pulao gosht)',
            'name_similarity': 'HIGH',
            'major_ingredient_similarity': 'HIGH',
            'preparation_similarity': 'HIGH',
            'final_identity_status': 'CONFIRMED_SAME_DISH',
            'review_notes': 'Both sources evaluate traditional composite beef and rice cooked in broth. FCT uses clear broth without tomato; Khan includes tomato and chili in household preparation, but both represent the same traditional dish.'
        },
        {
            'fct_recipe_id': 'PK_RCP_008',
            'fct_name': 'Chapal Kabab',
            'khan_dish_id': 'KHAN_2019_006',
            'khan_name': 'Chapli kabab',
            'name_similarity': 'HIGH',
            'major_ingredient_similarity': 'HIGH',
            'preparation_similarity': 'HIGH',
            'final_identity_status': 'CONFIRMED_SAME_DISH',
            'review_notes': 'Chapal Kabab and Chapli Kabab are phonetic spelling variants of the same traditional Pashto minced beef flat patty shallow-fried on a tawa. Formulations share minced beef, tomato, onion, flour binder, spices, and fat.'
        },
        {
            'fct_recipe_id': 'PK_RCP_010',
            'fct_name': 'Haleem',
            'khan_dish_id': 'KHAN_2019_014',
            'khan_name': 'Haleem',
            'name_similarity': 'IDENTICAL',
            'major_ingredient_similarity': 'HIGH',
            'preparation_similarity': 'IDENTICAL',
            'final_identity_status': 'CONFIRMED_SAME_DISH',
            'review_notes': 'Identical classical grain-pulse-meat porridge. Both sources combine shredded beef, whole wheat, and mixed lentils (channa, moong, masoor, mash) slow-cooked to a thick consistency.'
        },
        {
            'fct_recipe_id': 'PK_RCP_011',
            'fct_name': 'Machli',
            'khan_dish_id': 'KHAN_2019_013',
            'khan_name': 'Fish (Machli)',
            'name_similarity': 'HIGH',
            'major_ingredient_similarity': 'MODERATE',
            'preparation_similarity': 'MODERATE',
            'final_identity_status': 'RELATED_VARIANT',
            'review_notes': 'Distinct culinary preparations. FCT PK_RCP_011 is gram-flour battered fried fish (Lahori style with 30g besan coating). Khan 2019 KHAN_2019_013 is fish marinated in lemon, vinegar, and fish masala without flour batter. Retained separately as RELATED_VARIANT and not merged.'
        },
        {
            'fct_recipe_id': 'PK_RCP_013',
            'fct_name': 'Biryani',
            'khan_dish_id': 'KHAN_2019_007',
            'khan_name': 'Chicken biryani',
            'name_similarity': 'HIGH',
            'major_ingredient_similarity': 'HIGH',
            'preparation_similarity': 'HIGH',
            'final_identity_status': 'CONFIRMED_SAME_DISH',
            'review_notes': 'FCT PK_RCP_013 formulation explicitly specifies chicken meat layered with rice, yogurt, tomato, onion, and spices. Matches Khan 2019 Chicken Biryani in dish identity, core components, and dum preparation.'
        }
    ]

    cols = [
        'fct_recipe_id', 'fct_name', 'khan_dish_id', 'khan_name',
        'name_similarity', 'major_ingredient_similarity', 'preparation_similarity',
        'final_identity_status', 'review_notes'
    ]

    df = pd.DataFrame(resolution_records, columns=cols)
    out_path = 'Meal/data/research/fct_khan_identity_resolution.csv'
    df.to_csv(out_path, index=False)
    print(f"Saved {out_path} ({len(df)} pairs evaluated).")

    # Metrics computation
    confirmed_overlap = (df['final_identity_status'] == 'CONFIRMED_SAME_DISH').sum()
    related_variants = (df['final_identity_status'] == 'RELATED_VARIANT').sum()
    diff_dishes = (df['final_identity_status'] == 'DIFFERENT_DISH').sum()

    total_fct = 17
    total_khan = 30
    unique_khan = total_khan - confirmed_overlap # Non-merged Khan dishes (includes related variants)
    total_unique_dishes = total_fct + unique_khan

    print("\n" + "=" * 60)
    print("FCT / KHAN IDENTITY RESOLUTION METRICS")
    print("=" * 60)
    print(f"  • Evaluated Pairs: {len(df)}")
    print(f"  • Confirmed Identical Overlap: {confirmed_overlap}")
    print(f"  • Related Variants Retained Separately: {related_variants}")
    print(f"  • Different Dishes: {diff_dishes}")
    print(f"  • Confirmed Unique Khan Additions: {unique_khan}")
    print(f"  • Total Unique Laboratory-Tested Pakistani Dishes: {total_unique_dishes}")
    print("=" * 60)

if __name__ == '__main__':
    build_identity_resolution()
