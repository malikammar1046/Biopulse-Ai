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

interface OvaSenseRecommendedFoodsCardProps {
  userAllergens?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  hasDiabetesOrPrediabetes?: boolean;
}

export const OvaSenseRecommendedFoodsCard: React.FC<OvaSenseRecommendedFoodsCardProps> = ({
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

  // Dynamic food items tailored to user profile & restrictions
  const foods: FoodItemDetail[] = [
    {
      id: 'leafy_greens',
      name: t('ovasense.recommendedFoods.leafyGreens', 'Leafy Greens'),
      urduName: 'سبز پتوں والی سبزیاں',
      imageKey: 'leafy_greens',
      category: 'Micronutrients & Folate',
      benefit: 'High in magnesium, folate, and sulforaphane to support liver estrogen detoxification and insulin sensitivity.',
      urduBenefit: 'میگنیشیم اور فولیٹ سے بھرپور جو ایسٹروجن ہارمون کے قدرتی اخراج اور انسولین کی حساسیت میں مددگار ہے۔',
      pakistaniExamples: 'Palak (spinach), methi, saag, fresh mint & coriander',
    },
    {
      id: 'lean_protein',
      name: isPlantOnly ? 'Plant Protein' : t('ovasense.recommendedFoods.leanProtein', 'Lean Protein'),
      urduName: isPlantOnly ? 'پلانٹ پروٹین' : 'خالص پروٹین',
      imageKey: 'lean_protein',
      category: 'Satiety & Muscle Synthesis',
      benefit: 'Essential amino acids stabilize blood glucose by blunting post-meal insulin spikes and boosting GLP-1 satiety.',
      urduBenefit: 'کھانے کے بعد بلڈ شوگر میں تیز اضافے کو روکتا ہے اور پیٹ بھرے رہنے کا احساس بڑھاتا ہے۔',
      pakistaniExamples: proteinExamples,
    },
    {
      id: 'whole_grains',
      name: hasGlutenAllergy ? 'Gluten-Free Grains' : t('ovasense.recommendedFoods.wholeGrains', 'Whole Grains'),
      urduName: hasGlutenAllergy ? 'گلوٹن فری اناج' : 'ثابت اناج',
      imageKey: 'whole_grains',
      category: 'Low Glycemic Carbohydrates',
      benefit: 'Unrefined complex starches and soluble beta-glucan fiber provide steady, sustained glucose release.',
      urduBenefit: 'غیر ریفائن شدہ فائبر بلڈ شوگر کو تیزی سے بڑھنے نہیں دیتا اور دیرپا توانائی فراہم کرتا ہے۔',
      pakistaniExamples: grainsExamples,
    },
    {
      id: 'healthy_fats',
      name: t('ovasense.recommendedFoods.healthyFats', 'Healthy Fats'),
      urduName: 'مفید چکنائی',
      imageKey: 'healthy_fats',
      category: 'Steroid Hormone Precursors',
      benefit: 'Omega-9 monounsaturated fatty acids support ovarian cellular integrity and dampen chronic low-grade inflammation.',
      urduBenefit: 'صحت بخش چکنائی بیضہ دانی کے خلیات کی صحت اور جسمانی سوزش میں کمی کے لیے اہم ہے۔',
      pakistaniExamples: healthyFatsExamples,
    },
    {
      id: 'berries',
      name: t('ovasense.recommendedFoods.berries', 'Berries'),
      urduName: 'بیریز اور تازہ پھل',
      imageKey: 'berries',
      category: 'Antioxidants & Polyphenols',
      benefit: 'Anthocyanins and bioflavonoids combat oxidative stress in ovarian theca cells without causing glucose spikes.',
      urduBenefit: 'طاقتور اینٹی آکسیڈنٹس جو جسمانی خلیات کو آکسیڈیٹیو تناؤ سے بچاتے ہیں اور شوگر نہیں بڑھاتے۔',
      pakistaniExamples: 'Fresh blueberries, strawberries, crisp amrood (guava) with chaat masala, pomegranate (anaar)',
    },
  ];

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`rounded-3xl bg-white border border-[#FCE7F0] p-5 sm:p-6 shadow-sm space-y-4 ${
        isUrdu ? 'text-right' : 'text-left'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-pink-50 text-[#BE185D] flex items-center justify-center shrink-0 mt-0.5">
          <Leaf className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {t('ovasense.recommendedFoods.title', 'Recommended Foods')}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-0.5 max-w-xl">
            {t(
              'ovasense.recommendedFoods.description',
              'Foods that support hormone balance, reduce inflammation and improve insulin sensitivity.'
            )}
          </p>
        </div>
      </div>

      {/* 5 Circular Food Images Row */}
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
              aria-label={`${food.name}: Click to see hormonal benefits`}
            >
              {/* Circular Food Image with Soft Ring & Shadow */}
              <div
                className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full overflow-hidden p-0.5 transition-all duration-300 group-hover:scale-105 shadow-sm ${
                  isSelected
                    ? 'ring-2 ring-[#BE185D] ring-offset-2 scale-105'
                    : 'ring-1 ring-pink-100/90 group-hover:ring-pink-300'
                }`}
              >
                <img
                  src={visual.url}
                  alt={visual.alt}
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                  onError={(e) => {
                    // Graceful fallback to gradient background on image error
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Label Underneath */}
              <span className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-2 transition-colors group-hover:text-[#BE185D] leading-tight max-w-[80px]">
                {isUrdu ? food.urduName : food.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Detail Drawer on Click */}
      {selectedFood && (
        <div className="p-4 rounded-2xl bg-[#FFF8FA] border border-[#FCDCE8] text-xs space-y-1.5 animate-fadeIn relative">
          <button
            type="button"
            onClick={() => setSelectedFood(null)}
            className={`absolute top-3 ${
              isUrdu ? 'left-3' : 'right-3'
            } text-slate-400 hover:text-slate-700 cursor-pointer p-1`}
            aria-label="Close food detail"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#B81D5B] text-sm">
              {isUrdu ? selectedFood.urduName : selectedFood.name}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-[#BE185D]">
              {selectedFood.category}
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {isUrdu ? selectedFood.urduBenefit : selectedFood.benefit}
          </p>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-pink-100/70">
            <strong className="text-slate-700">
              {isUrdu ? 'روایتی پاکستانی اجزاء: ' : 'Pakistani Staples: '}
            </strong>
            {selectedFood.pakistaniExamples}
          </p>
        </div>
      )}
    </div>
  );
};
