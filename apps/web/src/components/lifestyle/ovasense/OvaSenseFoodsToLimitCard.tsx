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

interface OvaSenseFoodsToLimitCardProps {
  userAllergens?: string[];
}

export const OvaSenseFoodsToLimitCard: React.FC<OvaSenseFoodsToLimitCardProps> = ({
  userAllergens = [],
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const [selectedItem, setSelectedItem] = useState<LimitFoodItem | null>(null);

  const items: LimitFoodItem[] = [
    {
      id: 'sugary_foods',
      name: t('ovasense.foodsToLimit.sugaryFoods', 'Sugary Foods'),
      urduName: 'زیادہ میٹھی اشیاء',
      imageKey: 'sugary_foods',
      category: 'general_guidance',
      reason: 'Rapid sucrose absorption triggers compensatory hyperinsulinemia, stimulating ovarian theca cells to overproduce androgens.',
      urduReason: 'چینی کی زیادہ مقدار انسولین میں شدید اضافہ کرتی ہے جس سے مردانہ ہارمونز کی سطح بڑھ سکتی ہے۔',
      healthyAlternative: 'Fresh seasonal fruits (guava, berries) or cinnamon spiced chai without sugar',
    },
    {
      id: 'processed_foods',
      name: t('ovasense.foodsToLimit.processedFoods', 'Processed Foods'),
      urduName: 'پروسیس شدہ غذائیں',
      imageKey: 'processed_foods',
      category: 'general_guidance',
      reason: 'Industrial ultra-processed foods often contain emulsifiers and advanced glycation end-products that disrupt gut barrier function.',
      urduReason: 'پیک شدہ خوراک میں مصنوعی اجزاء آنتوں کی صحت کو متاثر کر کے جسمانی سوزش بڑھاتے ہیں۔',
      healthyAlternative: 'Whole-food home snacks: roasted bhuna chana, roasted pumpkin seeds, or cucumber slices',
    },
    {
      id: 'refined_carbs',
      name: t('ovasense.foodsToLimit.refinedCarbs', 'Refined Carbs'),
      urduName: 'میدہ اور سفید اشیاء',
      imageKey: 'refined_carbs',
      category: 'general_guidance',
      reason: 'Stripped flours lack prebiotic fiber, resulting in steep glycemic fluctuations followed by reactive hypoglycemia and cravings.',
      urduReason: 'میدہ بغیر فائبر کے شوگر کو فوری بڑھاتا ہے اور بعد میں نقاہت اور بھوک کا باعث بنتا ہے۔',
      healthyAlternative: 'Stone-ground 100% whole wheat chakki roti, besan missi roti, or brown basmati rice',
    },
    {
      id: 'fried_foods',
      name: t('ovasense.foodsToLimit.friedFoods', 'Fried Foods'),
      urduName: 'تلی ہوئی غذائیں',
      imageKey: 'fried_foods',
      category: 'general_guidance',
      reason: 'Reheated cooking oils generate lipid peroxides and trans-isomer fats that impair insulin receptor kinase activity.',
      urduReason: 'بار بار گرم کیے گئے تیل میں تلنے سے پیدا ہونے والی چکنائی انسولین کی کارکردگی متاثر کرتی ہے۔',
      healthyAlternative: 'Air-fried or grilled preparations: chicken tikka, tandoori fish, or lightly sautéed sabzi',
    },
    {
      id: 'sugary_drinks',
      name: t('ovasense.foodsToLimit.sugaryDrinks', 'Sugary Drinks'),
      urduName: 'میٹھے مشروبات',
      imageKey: 'sugary_drinks',
      category: 'general_guidance',
      reason: 'Liquid sugars deliver an immediate glycemic shock directly to hepatic circulation, promoting de novo lipogenesis in the liver.',
      urduReason: 'مشروبات میں موجود مائع شوگر جگر پر بوجھ ڈالتی ہے اور فیٹی لیور اور انسولین مزاحمت بڑھاتی ہے۔',
      healthyAlternative: 'Unsweetened mint & lemon water, infused cucumber water, or green cardamom tea',
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
        <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {t('ovasense.foodsToLimit.title', 'Foods to Limit')}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-0.5 max-w-xl">
            {t(
              'ovasense.foodsToLimit.description',
              'These may worsen insulin resistance and hormonal imbalance.'
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
              aria-label={`${item.name}: Click to see clinical reason to limit`}
            >
              {/* Circular Food Image with Soft Ring & Shadow */}
              <div
                className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full overflow-hidden p-0.5 transition-all duration-300 group-hover:scale-105 shadow-sm ${
                  isSelected
                    ? 'ring-2 ring-rose-500 ring-offset-2 scale-105'
                    : 'ring-1 ring-rose-100/90 group-hover:ring-rose-300'
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

              {/* Label Underneath */}
              <span className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-2 transition-colors group-hover:text-rose-600 leading-tight max-w-[80px]">
                {isUrdu ? item.urduName : item.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Detail Drawer on Click */}
      {selectedItem && (
        <div className="p-4 rounded-2xl bg-[#FFF8F8] border border-rose-100 text-xs space-y-1.5 animate-fadeIn relative">
          <button
            type="button"
            onClick={() => setSelectedItem(null)}
            className={`absolute top-3 ${
              isUrdu ? 'left-3' : 'right-3'
            } text-slate-400 hover:text-slate-700 cursor-pointer p-1`}
            aria-label="Close food detail"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-700 text-sm">
              {isUrdu ? selectedItem.urduName : selectedItem.name}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
              {isUrdu ? 'غذائی رہنمائی' : 'Dietary Guidance'}
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {isUrdu ? selectedItem.urduReason : selectedItem.reason}
          </p>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-rose-100">
            <strong className="text-emerald-700">
              {isUrdu ? 'صحت بخش متبادل: ' : 'Nutritious Alternative: '}
            </strong>
            {selectedItem.healthyAlternative}
          </p>
        </div>
      )}
    </div>
  );
};
