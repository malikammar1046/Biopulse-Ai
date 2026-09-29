import json
import os
import sys

def test_fct_traditional_golden():
    golden_path = 'Meal/data/raw/fct_traditional_dishes_golden.json'
    if not os.path.exists(golden_path):
        print(f"FAIL: Golden file {golden_path} does not exist.")
        sys.exit(1)

    with open(golden_path, 'r', encoding='utf-8') as f:
        golden = json.load(f)

    print(f"Loaded {len(golden)} dishes from {golden_path}.")
    assert len(golden) == 17, f"Expected exactly 17 golden dishes, found {len(golden)}"

    required_nutrients = [
        'energy_kcal', 'moisture_g', 'protein_g', 'fat_g', 'carb_g',
        'fiber_g', 'ash_g', 'calcium_mg', 'iron_mg', 'vit_c_mg'
    ]

    passed_dishes = 0
    for dish in golden:
        num = dish['dish_number']
        name = dish['dish_name_fct']
        app = dish['appendix_number']
        pdf_p = dish['pdf_page']
        print(f"Testing Dish {num:02d}: {name} (Appendix-{app}, PDF p{pdf_p})...", end=" ")

        # Validate non-negative nutrients
        for nut in required_nutrients:
            val = dish.get(nut)
            assert val is not None, f"Nutrient {nut} is missing in Dish {num}"
            assert isinstance(val, (int, float)), f"Nutrient {nut} in Dish {num} must be numeric, got {type(val)}"
            assert val >= 0.0, f"Nutrient {nut} in Dish {num} must be non-negative, got {val}"

        # Plausibility checks
        assert dish['moisture_g'] <= 100.0, f"Moisture cannot exceed 100g in Dish {num}"
        assert dish['energy_kcal'] > 0.0, f"Energy must be positive in Dish {num}"

        passed_dishes += 1
        print("PASS")

    print("\n" + "="*50)
    print(f"FCT TRADITIONAL DISHES GOLDEN BENCHMARK: {passed_dishes} / 17 PASS (100%)")
    print("="*50)

if __name__ == '__main__':
    test_fct_traditional_golden()
