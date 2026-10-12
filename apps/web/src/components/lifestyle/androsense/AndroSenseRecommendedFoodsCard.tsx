import React, { useState } from 'react';
import { Leaf, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getRecommendedFoodVisual } from '../../../utils/lifestyleImages';

interface FoodItemDetail {
  id: string;
  name: string;
  urduName: string;
  imageKey: string;
  category: string;
  benefit: string;
  urduBenefit: string;
  pakistaniExamples: string;
}

interface AndroSenseRecommendedFoodsCardProps {
  userAllergens?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  hasDiabetesOrPrediabetes?: boolean;
}

export const AndroSenseRecommendedFoodsCard: React.FC<AndroSenseRecommendedFoodsCardProps> = ({
  userAllergens = [],
  isVegetarian = false,
  isVegan = false,
  hasDiabetesOrPrediabetes = false,
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const [selectedFood, setSelectedFood] = useState<FoodItemDetail | null>(null);

  // Authoritative clinical allergy matching
  const normAllergens = userAllergens.map((a) => a.toLowerCase().trim());
  const hasNutAllergy = normAllergens.some((a) => a.includes('peanut') || a.includes('nut'));
  const hasSeedAllergy = normAllergens.some((a) => a.includes('seed') || a.includes('sesame') || a.includes('til'));
  const hasGlutenAllergy = normAllergens.some((a) => a.includes('gluten') || a.includes('wheat') || a.includes('atta'));
  const hasEggAllergy = normAllergens.some((a) => a.includes('egg') || a.includes('anda'));
  const hasDairyAllergy = normAllergens.some((a) => a.includes('dairy') || a.includes('milk') || a.includes('lactose') || a.includes('paneer'));

  // Plant-based flag
  const isPlantOnly = isVegetarian || isVegan;

  // Determine dynamic Pakistani staples per category based on allergy invariants
  const proteinExamples = React.useMemo(() => {
    if (isPlantOnly) {
      return hasDairyAllergy
        ? 'Yellow moong daal, boiled chana, roasted chickpeas, spiced organic tofu'
        : 'Yellow moong daal, boiled chana, roasted chickpeas, fresh paneer';
    }
    const safeMeats = ['Skinless chicken breast', 'white fish', 'yellow moong daal'];
    if (!hasEggAllergy && !isVegan) safeMeats.push('farm eggs');
    return safeMeats.join(', ');
  }, [isPlantOnly, hasDairyAllergy, hasEggAllergy, isVegan]);

  const grainsExamples = React.useMemo(() => {
    if (hasGlutenAllergy) {
      return 'Besan (chickpea flour) missi roti, steamed brown basmati rice, sorghum (jowar) millet, certified gluten-free rolled oats';
    }
    return hasDiabetesOrPrediabetes
      ? 'Chakki 100% whole wheat roti, rolled oats with chia, besan missi roti (lower glycemic load)'
      : 'Chakki whole wheat roti, rolled oats, brown basmati rice, besan missi roti';
  }, [hasGlutenAllergy, hasDiabetesOrPrediabetes]);

  const healthyFatsExamples = React.useMemo(() => {
    if (hasNutAllergy && hasSeedAllergy) {
      return 'Fresh avocado, cold-pressed extra virgin olive oil (nut- and seed-free safe)';
    }
    if (hasNutAllergy) {
      return 'Fresh avocado, cold-pressed olive oil, Sunflower & Pumpkin Seeds, chia seeds (nut-safe)';
    }
    if (hasSeedAllergy) {
      return 'Fresh avocado, raw walnuts (akhrot), almonds (badam), cold-pressed olive oil (seed-free)';
    }
    return 'Fresh avocado, raw walnuts (akhrot), almonds (badam), chia seeds, cold-pressed olive oil';
  }, [hasNutAllergy, hasSeedAllergy]);

  // Dynamic food items tailored to male profile & restrictions
  const foods: FoodItemDetail[] = [
    {
      id: 'leafy_greens',
      name: t('androsense.recommendedFoods.leafyGreens', 'Leafy Greens'),
      urduName: 'سبز پتوں والی سبزیاں',
      imageKey: 'leafy_greens',
      category: 'Micronutrients & Magnesium',
      benefit: 'High in magnesium, folate, and potassium supporting vascular nitric oxide production and cellular recovery.',
      urduBenefit: 'میگنیشیم اور فولیٹ سے بھرپور جو خون کی نالیوں کی صحت اور جسمانی بحالی میں مددگار ہے۔',
      pakistaniExamples: 'Palak (spinach), methi, saag, fresh mint & coriander',
    },
    {
      id: 'lean_protein',
      name: isPlantOnly ? 'Plant Protein' : t('androsense.recommendedFoods.leanProtein', 'Lean Protein'),
      urduName: isPlantOnly ? 'پلانٹ پروٹین' : 'خالص پروٹین',
      imageKey: 'lean_protein',
      category: 'Muscle Mass & Recovery',
      benefit: 'High biological value protein providing essential amino acids to support skeletal muscle preservation and glucose stability.',
      urduBenefit: 'معیاری پروٹین پٹھوں کی مضبوطی اور بلڈ شوگر کو متوازن رکھنے کے لیے ضروری ہے۔',
      pakistaniExamples: proteinExamples,
    },
    {
      id: 'whole_grains',
      name: hasGlutenAllergy ? 'Gluten-Free Grains' : t('androsense.recommendedFoods.wholeGrains', 'Whole Grains'),
      urduName: hasGlutenAllergy ? 'گلوٹن فری اناج' : 'ثابت اناج',
      imageKey: 'whole_grains',
      category: 'Low Glycemic Carbohydrates',
      benefit: 'Unrefined complex starches and soluble beta-glucan fiber provide steady, sustained glucose release and glycogen replenishment.',
      urduBenefit: 'غیر ریفائن شدہ فائبر بلڈ شوگر کو مستحکم رکھتا ہے اور دیرپا جسمانی توانائی فراہم کرتا ہے۔',
      pakistaniExamples: grainsExamples,
    },
    {
      id: 'healthy_fats',
      name: t('androsense.recommendedFoods.healthyFats', 'Healthy Fats'),
      urduName: 'مفید چکنائی',
      imageKey: 'healthy_fats',
      category: 'Endocrine Membrane Health',
      benefit: 'Monounsaturated fatty acids and plant sterols support cellular membrane integrity and cardiovascular wellness.',
      urduBenefit: 'صحت بخش چکنائی خلیاتی جھلیوں کی صحت اور دل کی حفاظت کے لیے ناگزیر ہے۔',
      pakistaniExamples: healthyFatsExamples,
    },
    {
      id: 'berries',
      name: t('androsense.recommendedFoods.berries', 'Antioxidant Fruits'),
      urduName: 'اینٹی آکسیڈنٹ پھل',
      imageKey: 'berries',
      category: 'Polyphenols & Cell Protection',
      benefit: 'Flavonoids and polyphenols combat systemic oxidative stress and support vascular endothelial function.',
      urduBenefit: 'طاقتور اینٹی آکسیڈنٹس جو جسمانی خلیات کو آکسیڈیٹیو تناؤ سے بچاتے ہیں اور توانائی بڑھاتے ہیں۔',
      pakistaniExamples: 'Fresh blueberries, pomegranate (anaar), crisp guava (amrood), seasonal strawberries',
    },
  ];

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`rounded-3xl bg-white border border-sky-100 p-5 sm:p-6 shadow-sm space-y-4 ${
        isUrdu ? 'text-right' : 'text-left'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-teal-50 text-[#0E9EAA] flex items-center justify-center shrink-0 mt-0.5">
          <Leaf className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {t('androsense.recommendedFoods.title', 'Recommended Foods')}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-0.5 max-w-xl">
            {t(
              'androsense.recommendedFoods.description',
              'Nutrient-dense whole foods supporting lean mass preservation, metabolic health, and endocrine cofactors.'
            )}
          </p>
        </div>
      </div>

      {/* 5 Circular Food Badges */}
      <div className="grid grid-cols-5 gap-2 sm:gap-4 items-start justify-between pt-1">
        {foods.map((food) => {
          const visual = getRecommendedFoodVisual(food.imageKey);
          const isSelected = selectedFood?.id === food.id;

          return (
            <button
              key={food.id}
              type="button"
              onClick={() => setSelectedFood(isSelected ? null : food)}
              className="flex flex-col items-center text-center cursor-pointer group focus:outline-none"
              aria-label={`${food.name}: Click to view why recommended`}
            >
              {/* Circular Food Image with Soft Ring & Shadow */}
              <div
                className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full overflow-hidden p-0.5 transition-all duration-300 group-hover:scale-105 shadow-sm ${
                  isSelected
                    ? 'ring-2 ring-sky-500 ring-offset-2 scale-105'
                    : 'ring-1 ring-sky-100 group-hover:ring-sky-300'
                }`}
              >
                <img
                  src={visual.url}
                  alt={visual.alt}
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Label below image */}
              <span
                className={`text-[11px] sm:text-xs font-semibold mt-2 leading-tight transition-colors ${
                  isSelected ? 'text-[#0868B9] font-bold' : 'text-slate-700 group-hover:text-slate-900'
                }`}
              >
                {isUrdu ? food.urduName : food.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Food Detail Card */}
      {selectedFood && (
        <div className="rounded-2xl bg-[#F0F7FF] border border-sky-200/90 p-4 space-y-2 animate-fadeIn relative text-left">
          <button
            type="button"
            onClick={() => setSelectedFood(null)}
            className="absolute top-3 end-3 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0868B9] uppercase tracking-wide">
              {selectedFood.category}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-700">
              {isUrdu ? selectedFood.urduName : selectedFood.name}
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {isUrdu ? selectedFood.urduBenefit : selectedFood.benefit}
          </p>

          <div className="pt-1 border-t border-sky-100 flex items-start gap-1.5 text-[11px] text-slate-600">
            <strong className="text-slate-800 shrink-0">
              {isUrdu ? 'پاکستانی روزمرہ متبادل:' : 'Everyday Staples:'}
            </strong>
            <span>{selectedFood.pakistaniExamples}</span>
          </div>
        </div>
      )}
    </div>
  );
};
