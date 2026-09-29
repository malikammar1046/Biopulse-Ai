"""
Builds the comprehensive overlap audit dataset for all 30 Khan et al. (2019) dishes
against:
- 17 FCT LEVEL_A recipes
- 3 Cultural Reference dishes
- 62 Gastronomy candidates

Classifies matches into:
- exact_match
- normalized_match
- possible_match_needs_review
- new_dish
"""

import pandas as pd

def build_overlap_audit():
    audit_data = [
        # (dish_id, local_name, common_name, fct_match_id, fct_match_name, fct_match_type, cult_match_id, cult_match_name, cult_match_type, gastro_match_sr, gastro_match_name, gastro_match_type, overall_status, notes)
        (
            'KHAN_2019_001', 'Aloo gosht', 'Potato meat',
            'PK_RCP_003', 'Alu Gosht', 'possible_match_needs_review',
            None, None, 'no_match',
            6, 'Aloo Gosht', 'exact_match',
            'possible_match_needs_review',
            'Cross-study validation candidate with FCT PK_RCP_003 (Alu Gosht). Review required due to Khan 2019 higher oil/fat tempering (15.2% vs 6.1%).'
        ),
        (
            'KHAN_2019_002', 'Gosht korma', 'Beef korma',
            None, None, 'new_dish',
            None, None, 'no_match',
            None, None, 'no_match',
            'new_dish',
            'Unique additional Pakistani laboratory-tested meat curry. Nutrition-planner eligible; formulation authority MAJOR_INGREDIENTS_ONLY.'
        ),
        (
            'KHAN_2019_003', 'Baingan', 'Bringels',
            None, None, 'new_dish',
            None, None, 'no_match',
            19, 'Baingan Bharta', 'normalized_match',
            'new_dish',
            'Unique additional Pakistani laboratory-tested vegetable dish. Normalized match with Gastronomy Baingan Bharta.'
        ),
        (
            'KHAN_2019_004', 'Bhindi', 'Okra',
            None, None, 'new_dish',
            None, None, 'no_match',
            22, 'Bhindi', 'exact_match',
            'new_dish',
            'Unique additional Pakistani laboratory-tested vegetable dish. Exact culinary match with Gastronomy Bhindi (Sr 22).'
        ),
        (
            'KHAN_2019_005', 'Channa daal', 'Slit chickpea lentils',
            None, None, 'new_dish',
            None, None, 'no_match',
            None, None, 'no_match',
            'new_dish',
            'Unique additional Pakistani laboratory-tested pulse curry. Nutrition-planner eligible.'
        ),
        (
            'KHAN_2019_006', 'Chapli kabab', 'Chapli kabab',
            'PK_RCP_008', 'Chapal Kabab', 'possible_match_needs_review',
            None, None, 'no_match',
            None, None, 'no_match',
            'possible_match_needs_review',
            'Cross-study validation candidate with FCT PK_RCP_008 (Chapal Kabab). Review required: both beef mince patties; Khan 2019 includes egg & maize flour.'
        ),
        (
            'KHAN_2019_007', 'Chicken biryani', 'Chicken biryani',
            'PK_RCP_013', 'Biryani', 'possible_match_needs_review',
            None, None, 'no_match',
            25, 'Chicken Biryani', 'exact_match',
            'possible_match_needs_review',
            'Cross-study validation candidate with FCT PK_RCP_013 (Biryani). High cross-study agreement on carbohydrate yield (~22g vs 24g).'
        ),
        (
            'KHAN_2019_008', 'Chicken karahi', 'Chicken karahi',
            None, None, 'new_dish',
            'PK_RCP_CUL_003', 'Karahi Meat', 'normalized_match',
            None, None, 'no_match',
            'normalized_match',
            'Elevates Karahi Meat cultural reference with peer-reviewed laboratory composition (240.5 kcal, 13.4g protein, 15.9g fat).'
        ),
        (
            'KHAN_2019_009', 'Vegetable rice', 'Vegetable rice',
            None, None, 'new_dish',
            None, None, 'no_match',
            45, 'Mixed Sabzi Pulao', 'possible_match_needs_review',
            'possible_match_needs_review',
            'Unique additional Pakistani laboratory composite rice dish. Review needed vs Gastronomy Mixed Sabzi Pulao (Sr 45).'
        ),
        (
            'KHAN_2019_010', 'Choley', 'Gram/ Chick pea',
            None, None, 'new_dish',
            None, None, 'no_match',
            None, None, 'no_match',
            'new_dish',
            'Unique additional Pakistani laboratory-tested legume curry. High satiety pulse candidate.'
        ),
        (
            'KHAN_2019_011', 'Daal kadu', 'Slit chick pea lentil with bottle gourd',
            None, None, 'new_dish',
            None, None, 'no_match',
            None, None, 'no_match',
            'new_dish',
            'Unique additional traditional pulse-vegetable composite dish. Nutrition-planner eligible.'
        ),
        (
            'KHAN_2019_012', 'Daal mash', 'Mash bean',
            None, None, 'new_dish',
            None, None, 'no_match',
            None, None, 'no_match',
            'new_dish',
            'Unique additional Pakistani laboratory-tested lentil dish. Cross-validates Liaqat et al. 2009 Dal Maash sensory study.'
        ),
        (
            'KHAN_2019_013', 'Machli', 'Fish',
            'PK_RCP_011', 'Machli', 'exact_match',
            None, None, 'no_match',
            None, None, 'no_match',
            'exact_match',
            'Cross-study validation candidate with FCT PK_RCP_011 (Machli). Both fried fish preparations; highest protein density (~18-24g/100g).'
        ),
        (
            'KHAN_2019_014', 'Haleem', 'Haleem',
            'PK_RCP_010', 'Haleem', 'exact_match',
            None, None, 'no_match',
            None, None, 'no_match',
            'exact_match',
            'Cross-study validation candidate with FCT PK_RCP_010 (Haleem). High concordance in moisture (70-73%) and balanced macronutrient profile.'
        ),
        (
            'KHAN_2019_015', 'Kachalo qeema', 'Colocassia with minced beef',
            None, None, 'new_dish',
            None, None, 'no_match',
            None, None, 'no_match',
            'new_dish',
            'Unique additional laboratory composite meat and root vegetable dish (Arvi/Kachalo Qeema).'
        ),
        (
            'KHAN_2019_016', 'Kaleji', 'Liver',
            None, None, 'new_dish',
            None, None, 'no_match',
            None, None, 'no_match',
            'new_dish',
            'Unique additional laboratory organ meat dish. High protein (16.0g/100g) and micronutrient density candidate.'
        ),
        (
            'KHAN_2019_017', 'Karella qeema', 'Minced beef with bitter gourd',
            None, None, 'new_dish',
            None, None, 'no_match',
            34, 'Karelay Qeema', 'exact_match',
            'exact_match',
            'Unique additional laboratory dish matching Gastronomy Karelay Qeema (Sr 34). Nutrition-planner eligible.'
        ),
        (
            'KHAN_2019_018', 'Kadhi pakora', 'Yogurt curry with pakoras',
            None, None, 'new_dish',
            None, None, 'no_match',
            None, None, 'no_match',
            'new_dish',
            'Unique additional laboratory dish. Besan and curd curry with gram flour dumplings.'
        ),
        (
            'KHAN_2019_019', 'Koftay', 'Meat balls curry',
            'PK_RCP_005', 'Kofta', 'possible_match_needs_review',
            None, None, 'no_match',
            None, None, 'no_match',
            'possible_match_needs_review',
            'Cross-study validation candidate with FCT PK_RCP_005 (Kofta). Review needed: ground beef meatballs in spiced gravy; Khan 2019 reports 241.6 kcal vs FCT 152.0 kcal due to richer gravy tarka.'
        ),
        (
            'KHAN_2019_020', 'Lobia', 'Kidney beans',
            'PK_RCP_004', 'Kalool', 'normalized_match',
            None, None, 'no_match',
            None, None, 'no_match',
            'normalized_match',
            'Cross-study validation candidate with FCT PK_RCP_004 (Kalool / Rajma curry). Both cooked red kidney bean preparations.'
        ),
        (
            'KHAN_2019_021', 'Macroni qeema', 'Macroni with minced beef',
            None, None, 'new_dish',
            None, None, 'no_match',
            None, None, 'no_match',
            'new_dish',
            'Unique contemporary fusion dish. Laboratory tested composite.'
        ),
        (
            'KHAN_2019_022', 'Peeti', 'Mix masoor and moong lentils',
            None, None, 'new_dish',
            None, None, 'no_match',
            None, None, 'no_match',
            'new_dish',
            'Unique additional laboratory composite pulse dish (dual lentil curry). Distinct from solo Daal Masoor PK_RCP_002.'
        ),
        (
            'KHAN_2019_023', 'Mix sabzi', 'Mix vegetable',
            None, None, 'new_dish',
            None, None, 'no_match',
            44, 'Mixed Sabzi', 'exact_match',
            'exact_match',
            'Unique additional laboratory dish matching Gastronomy Mixed Sabzi (Sr 44). High vegetable diversity.'
        ),
        (
            'KHAN_2019_024', 'Mutton karahi', 'Mutton karahi',
            None, None, 'new_dish',
            'PK_RCP_CUL_003', 'Karahi Meat', 'normalized_match',
            None, None, 'no_match',
            'normalized_match',
            'Elevates Karahi Meat cultural reference with peer-reviewed laboratory mutton data (242.4 kcal, 9.0g protein, 20.4g fat).'
        ),
        (
            'KHAN_2019_025', 'Nihari Gosht', 'Beef nihari',
            None, None, 'new_dish',
            'PK_RCP_CUL_001', 'Nihari', 'normalized_match',
            None, None, 'no_match',
            'normalized_match',
            'Elevates Nihari cultural reference with peer-reviewed laboratory data (172.1 kcal, 6.2g protein, 13.2g fat, 7.1g carb).'
        ),
        (
            'KHAN_2019_026', 'Palak', 'Spinach',
            None, None, 'new_dish',
            None, None, 'no_match',
            13, 'Aloo Palaak', 'possible_match_needs_review',
            'possible_match_needs_review',
            'Unique additional laboratory leafy vegetable dish. Review needed vs Gastronomy Aloo Palaak (Sr 13) and Palak Gosht (Sr 53).'
        ),
        (
            'KHAN_2019_027', 'Pulao gosht', 'Beef pulao',
            'PK_RCP_006', 'Pulao Gosht', 'possible_match_needs_review',
            None, None, 'no_match',
            21, 'Beef Pulao', 'exact_match',
            'possible_match_needs_review',
            'Cross-study validation candidate with FCT PK_RCP_006 (Pulao Gosht). Excellent cross-study agreement on carbohydrate yield (~22g/100g) and energy (~180 kcal).'
        ),
        (
            'KHAN_2019_028', 'Shimla mirch qeema', 'Minced beef with capsicum',
            None, None, 'new_dish',
            None, None, 'no_match',
            57, 'Shimla Mirch Qeema', 'exact_match',
            'exact_match',
            'Unique additional laboratory dish matching Gastronomy Shimla Mirch Qeema (Sr 57). High satiety meat-vegetable composite.'
        ),
        (
            'KHAN_2019_029', 'Chawal', 'Simple rice',
            None, None, 'new_dish',
            None, None, 'no_match',
            58, 'Tarke Wale Chawwal', 'possible_match_needs_review',
            'possible_match_needs_review',
            'Unique laboratory cooked rice dish with oil/onion tempering. Review needed vs PK_PORTION_002 (Plain Boiled Rice).'
        ),
        (
            'KHAN_2019_030', 'Tori', 'Ridge gourd',
            None, None, 'new_dish',
            None, None, 'no_match',
            61, 'Tori', 'exact_match',
            'exact_match',
            'Unique additional laboratory dish matching Gastronomy Tori (Sr 61). Cross-validates Liaqat et al. 2009 Tori Bhujia sensory study.'
        )
    ]

    cols = [
        'dish_id', 'local_name', 'common_name',
        'fct_match_id', 'fct_match_name', 'fct_match_type',
        'cult_match_id', 'cult_match_name', 'cult_match_type',
        'gastro_match_sr', 'gastro_match_name', 'gastro_match_type',
        'overall_match_classification', 'notes'
    ]

    df = pd.DataFrame(audit_data, columns=cols)
    out_path = 'Meal/data/research/khan_2019_overlap_audit.csv'
    df.to_csv(out_path, index=False)
    print(f"Saved {out_path} ({len(df)} dishes audited).")

    # Summarize classification breakdown
    print("\nOVERLAP AUDIT SUMMARY (Khan et al. 2019):")
    print(df['overall_match_classification'].value_counts())

if __name__ == '__main__':
    build_overlap_audit()
