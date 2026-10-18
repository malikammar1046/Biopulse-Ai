import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLimitFoodVisual } from '../../../utils/lifestyleImages';

interface LimitFoodItem {
  id: string;
  name: string;
  urduName: string;
  imageKey: string;
  category: 'general_guidance' | 'confirmed_allergy';
  reason: string;
  urduReason: string;
  healthyAlternative: string;
}

interface AndroSenseFoodsToLimitCardProps {
  userAllergens?: string[];
}

export const AndroSenseFoodsToLimitCard: React.FC<AndroSenseFoodsToLimitCardProps> = ({
  userAllergens = [],
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const [selectedItem, setSelectedItem] = useState<LimitFoodItem | null>(null);

  const items: LimitFoodItem[] = [
    {
      id: 'sugary_foods',
      name: t('androsense.foodsToLimit.sugaryFoods', 'Sugary Foods'),
      urduName: 'زیادہ میٹھی اشیاء',
      imageKey: 'sugary_foods',
      category: 'general_guidance',
      reason: 'Excess sucrose and high fructose contribute to visceral adiposity and hepatic lipid accumulation, promoting metabolic resistance.',
      urduReason: 'چینی کی زیادہ مقدار پیٹ کے گرد چربی اور فیٹی لیور کا سبب بنتی ہے جس سے میٹابولک توازن بگڑتا ہے۔',
      healthyAlternative: 'Fresh seasonal fruits (guava, berries, pomegranate) or cinnamon spiced green tea without sugar',
    },
    {
      id: 'processed_foods',
      name: t('androsense.foodsToLimit.processedFoods', 'Processed Foods'),
      urduName: 'پروسیس شدہ غذائیں',
      imageKey: 'processed_foods',
      category: 'general_guidance',
      reason: 'Industrial ultra-processed foods contain chemical additives and refined fats that promote systemic low-grade inflammation.',
      urduReason: 'پیک شدہ خوراک میں موجود مصنوعی اجزاء اور خراب چکنائیاں جسمانی سوزش میں اضافہ کرتی ہیں۔',
      healthyAlternative: 'Whole-food home snacks: roasted bhuna chana, roasted pumpkin seeds, or crisp cucumber slices',
    },
    {
      id: 'refined_carbs',
      name: t('androsense.foodsToLimit.refinedCarbs', 'Refined Carbs'),
      urduName: 'میدہ اور سفید اشیاء',
      imageKey: 'refined_carbs',
      category: 'general_guidance',
      reason: 'Stripped flours lack prebiotic fiber, resulting in steep glycemic swings followed by reactive hypoglycemia and afternoon fatigue.',
      urduReason: 'میدہ بغیر فائبر کے شوگر کو فوری بڑھاتا ہے اور بعد میں نقاہت اور سستی کا باعث بنتا ہے۔',
      healthyAlternative: 'Stone-ground 100% whole wheat chakki roti, besan missi roti, or brown basmati rice',
    },
    {
      id: 'fried_foods',
      name: t('androsense.foodsToLimit.friedFoods', 'Fried Foods'),
      urduName: 'تلی ہوئی غذائیں',
      imageKey: 'fried_foods',
      category: 'general_guidance',
      reason: 'Reheated cooking oils generate oxidized lipid peroxides and trans-fats that impair vascular endothelial function.',
      urduReason: 'بار بار گرم کیے گئے تیل میں تلنے سے پیدا ہونے والی چکنائی دل اور خون کی نالیوں کی صحت کو متاثر کرتی ہے۔',
      healthyAlternative: 'Air-fried or grilled preparations: tandoori chicken tikka, grilled fish, or lightly sautéed sabzi',
    },
    {
      id: 'sugary_drinks',
      name: t('androsense.foodsToLimit.sugaryDrinks', 'Sugary Drinks & Alcohol'),
      urduName: 'میٹھے مشروبات اور مضر اشیاء',
      imageKey: 'sugary_drinks',
      category: 'general_guidance',
      reason: 'Liquid sugars and excess alcohol impose an acute hepatic burden, impairing insulin sensitivity and disrupting deep REM recovery.',
      urduReason: 'مشروبات میں موجود مائع شوگر جگر پر بوجھ ڈالتی ہے اور رات کی گہری نیند اور جسمانی بحالی کو خراب کرتی ہے۔',
      healthyAlternative: 'Unsweetened mint & lemon water, infused cucumber water, or green cardamom tea',
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
        <div className="w-9 h-9 rounded-2xl bg-sky-50 text-[#0868B9] flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {t('androsense.foodsToLimit.title', 'Foods to Moderate')}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-0.5 max-w-xl">
            {t(
              'androsense.foodsToLimit.description',
              'Nutritional choices that may contribute to visceral adiposity, glucose fluctuations, and systemic inflammation.'
            )}
          </p>
        </div>
      </div>

      {/* Confirmed Allergies Banner: Strict Medical Avoidance */}
      {userAllergens && userAllergens.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>
              {isUrdu ? 'تصدیق شدہ الرجی: مکمل پرہیز — ' : 'Confirmed Allergy: Strict Avoidance — '}
            </strong>
            {isUrdu
              ? `آپ کے ذاتی پروٹوکول سے مکمل طور پر خارج: ${userAllergens.join('، ')}۔`
              : `Strictly excluded from your personal protocol: ${userAllergens.join(', ')}.`}
          </span>
        </div>
      )}

      {/* 5 Circular Items Row */}
      <div className="grid grid-cols-5 gap-2 sm:gap-4 items-start justify-between pt-1">
        {items.map((item) => {
          const visual = getLimitFoodVisual(item.imageKey);
          const isSelected = selectedItem?.id === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedItem(isSelected ? null : item)}
              className="flex flex-col items-center text-center cursor-pointer group focus:outline-none"
              aria-label={`${item.name}: Click to see reason to limit`}
            >
              {/* Circular Food Image with Soft Ring & Shadow */}
              <div
                className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full overflow-hidden p-0.5 transition-all duration-300 group-hover:scale-105 shadow-sm ${
                  isSelected
                    ? 'ring-2 ring-sky-500 ring-offset-2 scale-105'
                    : 'ring-1 ring-slate-200 group-hover:ring-sky-300'
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

              {/* Label */}
              <span
                className={`text-[11px] sm:text-xs font-semibold mt-2 leading-tight transition-colors ${
                  isSelected ? 'text-[#0868B9] font-bold' : 'text-slate-700 group-hover:text-slate-900'
                }`}
              >
                {isUrdu ? item.urduName : item.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Item Detail Card */}
      {selectedItem && (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 animate-fadeIn relative text-left">
          <button
            type="button"
            onClick={() => setSelectedItem(null)}
            className="absolute top-3 end-3 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wide">
              {isUrdu ? 'اعتدال کا مشورہ' : 'Guideline'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-800">
              {isUrdu ? selectedItem.urduName : selectedItem.name}
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {isUrdu ? selectedItem.urduReason : selectedItem.reason}
          </p>

          <div className="pt-1 border-t border-slate-200/80 flex items-start gap-1.5 text-[11px] text-slate-600">
            <strong className="text-slate-800 shrink-0">
              {isUrdu ? 'بہتر متبادل:' : 'Healthy Alternative:'}
            </strong>
            <span>{selectedItem.healthyAlternative}</span>
          </div>
        </div>
      )}
    </div>
  );
};
