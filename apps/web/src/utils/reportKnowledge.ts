/**
 * ==============================================================================
 * OvaSense Report Knowledge Base & Patient-Friendly Explanations
 * ==============================================================================
 * Explains recognized lab biomarkers in clear, non-diagnostic human language.
 */

export interface TestKnowledgeItem {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  defaultUnit: string;
  typicalRange: string;
  whatIsIt: string;
  whatDoesItMean: string;
  timelineConnection: string;
}

export const LAB_TEST_KNOWLEDGE_BASE: Record<string, TestKnowledgeItem> = {
  tsh: {
    id: 'tsh',
    name: 'TSH (Thyroid Stimulating Hormone)',
    aliases: ['tsh', 'thyroid stimulating hormone', 's-tsh', 'thyrotropin'],
    category: 'thyroid_test',
    defaultUnit: 'μIU/mL',
    typicalRange: '0.45 – 4.50 μIU/mL',
    whatIsIt:
      'TSH is a hormone signal sent from your brain that tells your thyroid gland how much energy-regulating hormone to make.',
    whatDoesItMean:
      'The result shows whether your brain is asking your thyroid to work harder or slow down. If it is outside the typical lab range, your doctor can interpret it alongside how you feel and your other thyroid numbers.',
    timelineConnection:
      'Your thyroid rhythm directly affects your daily energy levels, temperature, and cycle regularity.',
  },

  free_t4: {
    id: 'free_t4',
    name: 'Free T4 (Thyroxine)',
    aliases: ['ft4', 'free t4', 'free thyroxine'],
    category: 'thyroid_test',
    defaultUnit: 'ng/dL',
    typicalRange: '0.82 – 1.77 ng/dL',
    whatIsIt:
      'Free T4 is the main active thyroid hormone circulating in your bloodstream ready to help your cells produce energy.',
    whatDoesItMean:
      'A number within the reference range means you have standard levels of circulating thyroxine.',
    timelineConnection:
      'Supports healthy metabolism and steady body temperature across all cycle phases.',
  },

  testosterone_total: {
    id: 'testosterone_total',
    name: 'Total Testosterone',
    aliases: ['total testosterone', 'testosterone', 't-total', 's-testosterone'],
    category: 'hormone_test',
    defaultUnit: 'ng/dL',
    typicalRange: '15 – 70 ng/dL',
    whatIsIt:
      'Testosterone is a natural hormone produced by ovaries and adrenal glands that helps maintain muscle tone, mood, and skin health in women.',
    whatDoesItMean:
      'Levels can fluctuate naturally. When values are outside the typical reference range printed by the lab, it can be viewed alongside skin check-ins and cycle patterns.',
    timelineConnection:
      'Correlates with skin changes (such as breakouts) and cycle rhythms in your OvaSense timeline.',
  },

  dhea_s: {
    id: 'dhea_s',
    name: 'DHEA-S (Dehydroepiandrosterone Sulfate)',
    aliases: ['dhea-s', 'dheas', 'dhea sulfate', 'dehydroepiandrosterone sulfate'],
    category: 'hormone_test',
    defaultUnit: 'μg/dL',
    typicalRange: '65 – 380 μg/dL',
    whatIsIt:
      'DHEA-S is an energy-related hormone made predominantly by your adrenal glands (your body’s natural stress response glands).',
    whatDoesItMean:
      'It gives your healthcare team insight into adrenal hormone production.',
    timelineConnection:
      'Helps you and your clinician understand adrenal patterns alongside your daily stress logs.',
  },

  lh: {
    id: 'lh',
    name: 'LH (Luteinizing Hormone)',
    aliases: ['lh', 'luteinizing hormone', 's-lh'],
    category: 'hormone_test',
    defaultUnit: 'mIU/mL',
    typicalRange: '2.4 – 12.6 mIU/mL (Follicular phase)',
    whatIsIt:
      'LH is the key hormone signal that prompts the ovary to release a mature egg during ovulation.',
    whatDoesItMean:
      'Levels rise sharply right before ovulation and stay lower during the rest of your cycle.',
    timelineConnection:
      'Works alongside your period tracking dates to help identify your natural fertile window.',
  },

  fsh: {
    id: 'fsh',
    name: 'FSH (Follicle-Stimulating Hormone)',
    aliases: ['fsh', 'follicle stimulating hormone', 's-fsh'],
    category: 'hormone_test',
    defaultUnit: 'mIU/mL',
    typicalRange: '3.5 – 12.5 mIU/mL (Follicular phase)',
    whatIsIt:
      'FSH is the signal that encourages small egg follicles inside your ovaries to grow and mature each cycle.',
    whatDoesItMean:
      'Doctors often evaluate FSH together with LH (the LH to FSH ratio) on Day 2 or 3 of your period.',
    timelineConnection:
      'Complements your cycle day tracking and follicular phase development.',
  },

  fasting_glucose: {
    id: 'fasting_glucose',
    name: 'Fasting Blood Sugar (Glucose)',
    aliases: ['fasting blood sugar', 'fasting glucose', 'fbs', 'blood glucose fasting'],
    category: 'glucose_sugar',
    defaultUnit: 'mg/dL',
    typicalRange: '70 – 99 mg/dL',
    whatIsIt:
      'Measures the amount of sugar in your bloodstream after an overnight fast (typically 8–10 hours).',
    whatDoesItMean:
      'Shows how smoothly your body maintains baseline sugar levels before eating breakfast.',
    timelineConnection:
      'Connects with your food, meals, and hydration logs to see what supports your energy.',
  },

  hba1c: {
    id: 'hba1c',
    name: 'HbA1c (Average 3-Month Blood Sugar)',
    aliases: ['hba1c', 'glycated hemoglobin', 'a1c', 'hemoglobin a1c'],
    category: 'glucose_sugar',
    defaultUnit: '%',
    typicalRange: '4.0 – 5.6 %',
    whatIsIt:
      'HbA1c shows the average percentage of your red blood cells coated with sugar over the past 2 to 3 months.',
    whatDoesItMean:
      'Provides a steady, long-term picture of how your body handles sugar without being swayed by a single meal.',
    timelineConnection:
      'A valuable milestone in your 6-month OvaSense progress timeline.',
  },

  fasting_insulin: {
    id: 'fasting_insulin',
    name: 'Fasting Insulin',
    aliases: ['fasting insulin', 's-insulin', 'serum insulin fasting'],
    category: 'glucose_sugar',
    defaultUnit: 'μIU/mL',
    typicalRange: '2.6 – 24.9 μIU/mL',
    whatIsIt:
      'Insulin is the natural hormone released by your pancreas that helps sugar move from your blood into cells for daily energy.',
    whatDoesItMean:
      'Indicates how much insulin your body makes to keep resting blood sugar in balance.',
    timelineConnection:
      'Connects directly to your daily energy check-ins and meal choices.',
  },

  vitamin_d: {
    id: 'vitamin_d',
    name: 'Vitamin D (25-Hydroxy)',
    aliases: ['vitamin d', '25-oh vitamin d', '25-hydroxyvitamin d', 'vit d3'],
    category: 'vitamin_test',
    defaultUnit: 'ng/mL',
    typicalRange: '30 – 100 ng/mL',
    whatIsIt:
      'An essential nutrient and hormone-building block that supports bone strength, immune function, and ovarian health.',
    whatDoesItMean:
      'Shows your body’s stored levels from sunlight and nutrition.',
    timelineConnection:
      'Adequate levels support balanced mood, consistent energy, and ovarian wellness.',
  },

  vitamin_b12: {
    id: 'vitamin_b12',
    name: 'Vitamin B12 (Cobalamin)',
    aliases: ['vitamin b12', 'b12', 'cobalamin', 'serum b12'],
    category: 'vitamin_test',
    defaultUnit: 'pg/mL',
    typicalRange: '200 – 900 pg/mL',
    whatIsIt:
      'An important water-soluble vitamin that helps make red blood cells and maintains healthy nerve function.',
    whatDoesItMean:
      'Reflects your dietary intake and absorption from foods or supplements.',
    timelineConnection:
      'Important to track if taking medications like Metformin or eating a plant-forward diet.',
  },

  antral_follicles: {
    id: 'antral_follicles',
    name: 'Developing Egg Follicles (Ultrasound AFC)',
    aliases: ['antral follicle count', 'afc', 'ovary follicles', 'follicle count ultrasound'],
    category: 'ultrasound',
    defaultUnit: 'per ovary',
    typicalRange: '5 – 12 per ovary',
    whatIsIt:
      'Small fluid-filled sacs in your ovaries visible on an ultrasound scan where eggs develop each month.',
    whatDoesItMean:
      'A higher count of small developing follicles is a common feature on pelvic ultrasound scans.',
    timelineConnection:
      'Provides visual ultrasound context for your cycle rhythm and phase estimates.',
  },

  endometrial_thickness: {
    id: 'endometrial_thickness',
    name: 'Uterine Lining Thickness (Endometrium)',
    aliases: ['endometrial thickness', 'endometrium ultrasound', 'uterine lining'],
    category: 'ultrasound',
    defaultUnit: 'mm',
    typicalRange: '4 – 14 mm (Phase-dependent)',
    whatIsIt:
      'The natural inner lining of your uterus that grows thicker each month in response to estrogen.',
    whatDoesItMean:
      'Thickness changes predictably across your cycle, becoming thinnest right after your period and thicker before.',
    timelineConnection:
      'Correlates with your period duration and flow intensity logs.',
  },
};

/**
 * Searches the knowledge base for a test matching raw text name or aliases.
 */
export function findTestKnowledge(rawName: string): TestKnowledgeItem | null {
  if (!rawName) return null;
  const normalized = rawName.toLowerCase().trim();

  // 1. Direct match
  if (LAB_TEST_KNOWLEDGE_BASE[normalized]) {
    return LAB_TEST_KNOWLEDGE_BASE[normalized];
  }

  // 2. Alias match
  for (const item of Object.values(LAB_TEST_KNOWLEDGE_BASE)) {
    if (
      item.name.toLowerCase() === normalized ||
      item.aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))
    ) {
      return item;
    }
  }

  return null;
}
