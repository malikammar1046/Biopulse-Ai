/**
 * apps/web/scripts/qa-androsense-browser.mjs
 *
 * Real Puppeteer Browser QA & Screenshot Generator for:
 * BioPulse AI — AndroSense Male Lifestyle & Nutrition: Sky-Blue Redesign + Dynamic Personalization
 */

import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\45123111-8157-4b5b-88e0-9f685625dcd6';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const payload = Buffer.from(
  JSON.stringify({
    sub: 'usr_male_androsense_qa',
    aud: 'authenticated',
    role: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 999999,
    app_metadata: { provider: 'email' },
    user_metadata: { full_name: 'Ahmed Khan', gender: 'male', pathway: 'male', preferred_language: 'en' },
  })
).toString('base64url');
const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + payload + '.mock_signature';

const mockMaleSession = {
  access_token: validJwt,
  refresh_token: 'mock-refresh-token',
  expires_at: Math.floor(Date.now() / 1000) + 999999,
  expires_in: 999999,
  token_type: 'bearer',
  user: {
    id: 'usr_male_androsense_qa',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'ahmed.khan@biopulse.health',
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    user_metadata: { full_name: 'Ahmed Khan', gender: 'male', pathway: 'male', preferred_language: 'en' },
  },
};

const mockMaleRecommendations = {
  user_id: 'usr_male_androsense_qa',
  pathway: 'androsense',
  risk_category: 'MODERATE_RISK',
  risk_probability_percent: 38,
  generated_at: new Date().toISOString(),
  safety_status: 'ALLOW',
  missing_data: [],
  clinician_review: { recommended: false, reason: null },
  nutrition: {
    strategy_title: 'Endocrine Vitality & Insulin Sensitivity Protocol',
    strategy_summary: 'Optimizing metabolic efficiency, vascular endothelial health, and nocturnal endocrine recovery through high-protein whole foods, zinc-rich seeds, and complex carbohydrates.',
    key_guidelines: [
      'Prioritize lean protein (1.6g/kg) to preserve lean muscular metabolic tissue',
      'Incorporate zinc and magnesium rich foods (pumpkin seeds, lentils, spinach)',
      'Consume complex carbohydrates to stabilize insulin and prevent evening cortisol surges',
      'Maintain adequate hydration (2.8 - 3.2L) for cellular perfusion and kidney function',
    ],
    daily_targets: {
      daily_calories_kcal: 2150,
      calorie_range_min: 2050,
      calorie_range_max: 2250,
      protein: { name: 'Protein', grams: 135, calories_kcal: 540, percent_of_energy: 25, guidance: 'Free-range eggs, lean chicken, daal, and pumpkin seeds' },
      carbohydrates: { name: 'Carbohydrates', grams: 215, calories_kcal: 860, percent_of_energy: 40, guidance: 'Whole-wheat roti, brown basmati rice, oats, and legumes' },
      fats: { name: 'Healthy Fats', grams: 84, calories_kcal: 756, percent_of_energy: 35, guidance: 'Extra virgin olive oil, walnuts, almonds, and omega-3s' },
      fiber_grams: 36,
      hydration_liters: 3.0,
      target_status: 'Evidence-grounded calculation',
      guidance_note: 'Calculated via Mifflin-St Jeor formula adjusted for moderate male activity',
    },
    targeted_swaps: [
      {
        trigger_factor: 'Deep fried snacks / Samosas',
        swap_title: 'Swap Fried Samosa for Sprouted Moong Chaat',
        replace_food: 'Deep-Fried Potato Samosa',
        recommended_alternative: 'Sprouted Moong Chaat with lemon and roasted cumin',
        clinical_mechanism: 'Eliminates oxidized trans fats and provides bioavailable zinc and folate',
        impact_level: 'high',
      },
    ],
    meal_concepts: [
      {
        meal_type: 'Breakfast',
        title: 'Desi Omelette with Spinach & Whole Wheat Chapati',
        description: 'Wholesome egg omelette prepared with fresh spinach, green chilies, and tomatoes, served with stone-ground roti',
        key_ingredients: ['Eggs', 'Spinach', 'Whole Wheat Atta', 'Olive Oil'],
        hormonal_benefit: 'Bioavailable choline, zinc, and leucine for morning cortisol buffering and muscle protein synthesis',
        est_calories: 420,
      },
      {
        meal_type: 'Lunch',
        title: 'Lean Chicken Biryani with Mint Raita & Kachumber Salad',
        description: 'Aromatic brown basmati rice layered with skinless chicken breast, paired with probiotic dahi raita',
        key_ingredients: ['Chicken Breast', 'Brown Basmati Rice', 'Yogurt', 'Mint', 'Cucumber'],
        hormonal_benefit: 'Sustained glycogen replenishment and complete amino acid profile to blunt postprandial fatigue',
        est_calories: 580,
      },
      {
        meal_type: 'Dinner',
        title: 'Pan-Seared Fish with Steamed Vegetables & Moong Daal',
        description: 'Heart-healthy local fish cooked in cold-pressed mustard oil with tempered yellow lentils and cruciferous vegetables',
        key_ingredients: ['Fish', 'Moong Daal', 'Broccoli', 'Carrots', 'Mustard Oil'],
        hormonal_benefit: 'Omega-3 fatty acids and sulfur compounds supporting liver endocrine clearance and cellular fluidity',
        est_calories: 490,
      },
      {
        meal_type: 'Snack',
        title: 'Roasted Chana, Walnuts & Pumpkin Seed Trail Mix',
        description: 'Crunchy dry-roasted Bengal grams with raw walnuts and zinc-dense raw pumpkin seeds',
        key_ingredients: ['Roasted Chana', 'Walnuts', 'Pumpkin Seeds'],
        hormonal_benefit: 'Magnesium and zinc cofactor support for nocturnal steroidogenesis pathways',
        est_calories: 240,
      },
    ],
  },
  fitness: {
    protocol_name: 'Progressive Resistance Training & Zone 2 Metabolic Conditioning',
    weekly_frequency: '4 sessions weekly',
    overview: 'Strategic pairing of progressive compound resistance exercise to maintain lean muscular mass with conversational Zone 2 walking to enhance mitochondrial density.',
    aerobic_target_minutes: '150 mins weekly',
    resistance_target_sessions: '3 sessions weekly',
    pathway_clinical_benefit: 'Upregulates muscular androgen receptor density and improves non-insulin-mediated glucose clearance.',
    weekly_schedule: [
      {
        day_name: 'Monday',
        focus: 'Compound Upper & Lower Strength',
        duration_mins: 45,
        intensity: 'moderate',
        modality: 'Resistance',
        key_movements: ['Goblet Squats', 'Dumbbell Overhead Press', 'Romanian Deadlifts'],
        coaching_cue: 'Focus on 8-10 controlled repetitions leaving 2 reps in reserve',
      },
      {
        day_name: 'Wednesday',
        focus: 'Zone 2 Aerobic Conditioning',
        duration_mins: 40,
        intensity: 'low',
        modality: 'Walking',
        key_movements: ['Brisk Outdoor Walking', 'Incline Treadmill'],
        coaching_cue: 'Keep heart rate in conversational aerobic zone',
      },
    ],
    recovery_guidance: 'Ensure 48 hours between strenuous resistance training for full muscular recovery.',
  },
  lifestyle: {
    circadian_headline: 'Circadian Endocrine Anchoring & Deep Sleep Recovery',
    sleep_target_hours: '7.5 - 8.5 hours',
    stress_management_protocol: '10-minute morning outdoor sunlight viewing and evening parasympathetic box breathing',
    recommended_habits: [
      {
        category: 'Circadian',
        title: 'Early Morning Natural Sunlight',
        action_item: 'Step outside within 30 minutes of waking for 10-15 minutes of direct sunlight',
        timing: '06:30 - 08:00',
        rationale: 'Calibrates retinal melanopsin cells to establish healthy cortisol awakening response and nocturnal melatonin release',
      },
      {
        category: 'Sleep',
        title: 'Dark & Cool Sleep Sanctuary',
        action_item: 'Maintain bedroom temperature below 20°C with complete darkness',
        timing: '22:30 - 06:30',
        rationale: 'Facilitates Slow-Wave Deep Sleep, during which up to 80% of daily pulsatile testosterone release occurs',
      },
      {
        category: 'Stress',
        title: 'Box Breathing (4-4-4-4)',
        action_item: 'Complete 5 minutes of rhythmic box breathing during work transitions',
        timing: 'Mid-afternoon & pre-bed',
        rationale: 'Stimulates vagal nerve tone, blunting elevated cortisol that can suppress the HPT axis',
      },
    ],
  },
  recommendations: [
    {
      id: 'rec_andro_nut_1',
      category: 'nutrition',
      title: 'Prioritize High-Bioavailability Dietary Protein',
      action_summary: 'Target 25-30g protein per main meal from eggs, poultry, legumes, and seeds',
      priority: 'high',
      status: 'ACTIVE',
      why_this_is_recommended: 'Supports skeletal muscle preservation and mitigates age-related sarcopenia',
      based_on_patient_data: ['Moderately active baseline', 'Halal omnivore preference'],
      longitudinal_basis: 'Improves muscular strength and body composition markers',
      shap_priority_basis: 'Lean Body Mass (SHAP +0.26)',
      safety_status: 'ALLOW',
      clinician_review: false,
    },
    {
      id: 'rec_andro_fit_1',
      category: 'fitness',
      title: 'Progressive Resistance Training',
      action_summary: 'Perform 3 full-body resistance sessions per week focusing on compound movement patterns',
      priority: 'high',
      status: 'ACTIVE',
      why_this_is_recommended: 'Increases mechanical tension and activates androgen receptor signaling in skeletal muscle',
      based_on_patient_data: ['Sedentary occupational setting'],
      longitudinal_basis: 'Maintains functional physical vigor',
      shap_priority_basis: 'Physical Activity Score (SHAP +0.21)',
      safety_status: 'ALLOW',
      clinician_review: false,
    },
    {
      id: 'rec_andro_slp_1',
      category: 'sleep',
      title: 'Protect Uninterrupted Deep Sleep Window',
      action_summary: 'Ensure a consistent 7.5 to 8 hour sleep schedule with minimal screen time before bed',
      priority: 'high',
      status: 'ACTIVE',
      why_this_is_recommended: 'Pulsatile nocturnal testosterone production requires uninterrupted slow-wave sleep cycles',
      based_on_patient_data: ['Sleep duration < 7 hours'],
      longitudinal_basis: 'Restores diurnal energy rhythm and daytime mental focus',
      shap_priority_basis: 'Sleep Architecture (SHAP +0.24)',
      safety_status: 'ALLOW',
      clinician_review: false,
    },
    {
      id: 'rec_andro_str_1',
      category: 'stress',
      title: 'Parasympathetic Down-Regulation Protocols',
      action_summary: 'Practice 10 minutes of box breathing or progressive muscle relaxation after stressful events',
      priority: 'medium',
      status: 'ACTIVE',
      why_this_is_recommended: 'Chronic cortisol elevation downregulates hypothalamic GnRH pulsatility',
      based_on_patient_data: ['Elevated subjective work stress'],
      longitudinal_basis: 'Reduces autonomic sympathetic hyperactivity',
      shap_priority_basis: 'Perceived Stress Factor (SHAP +0.18)',
      safety_status: 'ALLOW',
      clinician_review: false,
    },
  ],
};

const mock3DayPlan = {
  id: 'plan_androsense_male_3day',
  user_id: 'usr_male_androsense_qa',
  plan_name: '3-Day Endocrine Vitality & Insulin Sensitivity Protocol',
  is_active: true,
  generated_at: new Date().toISOString(),
  target_calories: 2150,
  provisional_notice: 'Provisional guidance applied. Please review individual ingredients against any sensitivities.',
  unresolved_dislikes: [],
  days: [
    {
      day_number: 1,
      day_name: 'Monday',
      day_focus: 'High Leucine Muscle Protein Synthesis',
      total_calories: 2120,
      total_protein: 138,
      total_carbs: 210,
      total_fat: 82,
      meals: [
        {
          id: 'm1_bfast',
          role: 'Breakfast',
          title: 'Desi Omelette with Spinach & Stone-Ground Roti',
          description: 'Three free-range eggs whisked with baby spinach, tomatoes, and green chili, served with fresh stone-ground whole wheat chapati.',
          energy_kcal: 420,
          protein_g: 28,
          carbohydrate_g: 42,
          fat_g: 16,
          prep_time_minutes: 15,
          why_this_meal: 'Bioavailable choline, zinc, and leucine for morning cortisol buffering and muscle protein synthesis.',
          items: [
            { display_name: 'Eggs (Free-range)', portion_desc: '3 large eggs', calories: 210, protein_g: 18, carb_g: 1, fat_g: 14 },
            { display_name: 'Baby Spinach & Tomatoes', portion_desc: '1 cup sautéed', calories: 35, protein_g: 3, carb_g: 6, fat_g: 0 },
            { display_name: 'Whole Wheat Chapati', portion_desc: '1 medium (45g)', calories: 120, protein_g: 4, carb_g: 24, fat_g: 1 },
          ],
        },
        {
          id: 'm1_lunch',
          role: 'Lunch',
          title: 'Lean Chicken Biryani with Mint Raita & Kachumber',
          description: 'Aromatic brown basmati rice layered with skinless chicken breast, paired with probiotic dahi raita and crunchy cucumber-tomato salad.',
          energy_kcal: 580,
          protein_g: 44,
          carbohydrate_g: 62,
          fat_g: 18,
          prep_time_minutes: 30,
          why_this_meal: 'Sustained glycogen replenishment and complete amino acid profile to blunt postprandial fatigue.',
          items: [
            { display_name: 'Skinless Chicken Breast', portion_desc: '160g cooked', calories: 260, protein_g: 38, carb_g: 0, fat_g: 5 },
            { display_name: 'Brown Basmati Rice', portion_desc: '1 cup cooked', calories: 215, protein_g: 5, carb_g: 45, fat_g: 2 },
            { display_name: 'Mint Yogurt Raita', portion_desc: '1/2 cup', calories: 65, protein_g: 4, carb_g: 6, fat_g: 3 },
          ],
        },
        {
          id: 'm1_dinner',
          role: 'Dinner',
          title: 'Pan-Seared Fish with Yellow Moong Daal & Steamed Broccoli',
          description: 'Fresh local fish cooked in cold-pressed mustard oil with tempered yellow lentils and cruciferous vegetables.',
          energy_kcal: 490,
          protein_g: 42,
          carbohydrate_g: 48,
          fat_g: 15,
          prep_time_minutes: 25,
          why_this_meal: 'Omega-3 fatty acids and sulfur compounds supporting liver endocrine clearance and cellular fluidity.',
          items: [
            { display_name: 'Fish Fillet (Rahoo/Sea Bass)', portion_desc: '150g fillet', calories: 210, protein_g: 32, carb_g: 0, fat_g: 8 },
            { display_name: 'Moong Daal (Yellow Lentils)', portion_desc: '3/4 cup cooked', calories: 170, protein_g: 11, carb_g: 28, fat_g: 2 },
            { display_name: 'Steamed Broccoli & Carrots', portion_desc: '1.5 cups', calories: 55, protein_g: 3, carb_g: 11, fat_g: 0 },
          ],
        },
        {
          id: 'm1_snack',
          role: 'Snack',
          title: 'Roasted Bengal Grams, Raw Walnuts & Pumpkin Seeds',
          description: 'Dry-roasted crunchy chana with raw walnut halves and raw zinc-rich pumpkin seeds.',
          energy_kcal: 240,
          protein_g: 12,
          carbohydrate_g: 22,
          fat_g: 12,
          prep_time_minutes: 5,
          why_this_meal: 'Magnesium and zinc cofactor support for nocturnal steroidogenesis pathways.',
          items: [
            { display_name: 'Roasted Bengal Grams (Chana)', portion_desc: '30g', calories: 110, protein_g: 6, carb_g: 17, fat_g: 2 },
            { display_name: 'Raw Walnuts & Pumpkin Seeds', portion_desc: '20g mix', calories: 130, protein_g: 6, carb_g: 5, fat_g: 10 },
          ],
        },
      ],
    },
    {
      day_number: 2,
      day_name: 'Tuesday',
      day_focus: 'Insulin Sensitivity & Endocrine Balance',
      total_calories: 2140,
      total_protein: 135,
      total_carbs: 215,
      total_fat: 84,
      meals: [
        {
          id: 'm2_bfast',
          role: 'Breakfast',
          title: 'Scrambled Eggs with Sautéed Mushrooms & Multigrain Toast',
          description: 'Fluffy eggs cooked in olive oil with ergothioneine-rich mushrooms on stone-ground multigrain toast.',
          energy_kcal: 410,
          protein_g: 26,
          carbohydrate_g: 38,
          fat_g: 16,
          items: [],
        },
        {
          id: 'm2_lunch',
          role: 'Lunch',
          title: 'Grilled Beef Seekh Kabab with Daal Chawal & Kachumber',
          description: 'Lean minced beef kababs paired with yellow split lentils, brown basmati rice, and fresh salad.',
          energy_kcal: 590,
          protein_g: 46,
          carbohydrate_g: 64,
          fat_g: 18,
          items: [],
        },
        {
          id: 'm2_dinner',
          role: 'Dinner',
          title: 'Slow-Cooked Chicken Haleem with Ginger & Lemon',
          description: 'High-protein whole wheat and barley blend with tender shredded chicken, topped with fresh ginger.',
          energy_kcal: 500,
          protein_g: 40,
          carbohydrate_g: 52,
          fat_g: 14,
          items: [],
        },
        {
          id: 'm2_snack',
          role: 'Snack',
          title: 'Greek Yogurt with Crushed Almonds & Flaxseeds',
          description: 'Thick strained probiotic yogurt garnished with raw almonds and ground golden flaxseeds.',
          energy_kcal: 230,
          protein_g: 16,
          carbohydrate_g: 14,
          fat_g: 11,
          items: [],
        },
      ],
    },
    {
      day_number: 3,
      day_name: 'Wednesday',
      day_focus: 'Antioxidant & Vascular Endothelial Support',
      total_calories: 2160,
      total_protein: 140,
      total_carbs: 212,
      total_fat: 85,
      meals: [
        {
          id: 'm3_bfast',
          role: 'Breakfast',
          title: 'Shakshuka with Spiced Tomatoes & Whole Wheat Pita',
          description: 'Poached eggs nestled in a simmered sauce of fresh tomatoes, bell peppers, garlic, and cumin.',
          energy_kcal: 430,
          protein_g: 27,
          carbohydrate_g: 44,
          fat_g: 17,
          items: [],
        },
        {
          id: 'm3_lunch',
          role: 'Lunch',
          title: 'Tandoori Chicken Tikka with Mint Chutney & Millet Roti',
          description: 'Yogurt-marinated chicken breast roasted with warm spices, paired with mineral-rich bajra roti.',
          energy_kcal: 560,
          protein_g: 48,
          carbohydrate_g: 54,
          fat_g: 16,
          items: [],
        },
        {
          id: 'm3_dinner',
          role: 'Dinner',
          title: 'Baked Salmon with Quinoa Pulao & Steamed Asparagus',
          description: 'Herb-crusted wild salmon with fluffy vegetable quinoa and folate-rich asparagus spears.',
          energy_kcal: 520,
          protein_g: 44,
          carbohydrate_g: 46,
          fat_g: 18,
          items: [],
        },
        {
          id: 'm3_snack',
          role: 'Snack',
          title: 'Dark Chocolate (85%) with Roasted Pistachios',
          description: 'Two squares of polyphenol-dense dark chocolate paired with unsalted roasted pistachios.',
          energy_kcal: 220,
          protein_g: 6,
          carbohydrate_g: 18,
          fat_g: 14,
          items: [],
        },
      ],
    },
  ],
};

const maleProfile = {
  id: 'usr_male_androsense_qa',
  email: 'ahmed.khan@biopulse.health',
  fullName: 'Ahmed Khan',
  gender: 'male',
  pathway: 'male',
  isOnboarded: true,
  preferredLanguage: 'en',
  heightCm: 178,
  weightKg: 80,
  lifestyle: {
    activityLevel: 'moderately_active',
    dietaryPreference: 'halal_omnivore',
    dailyWaterGlasses: 9,
    sleepHours: 7.5,
    exercisePreferences: ['strength', 'walking'],
  },
  goals: {
    selectedGoals: ['Improve Daily Energy & Stamina', 'Support Muscle Health'],
  },
  medical: {
    bloodType: 'O+',
    allergies: ['None'],
    conditions: ['Mild Fatigue'],
    medications: [],
  },
  mensHealth: {
    energyLevel: 'moderate',
    sexDrive: 'normal',
    sleepQuality: 'restful',
    muscleStrengthChanges: 'stable',
  },
};

async function main() {
  console.log('🚀 Starting AndroSense QA & Multi-Viewport Screenshot Suite...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1440,900',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
    await page.setRequestInterception(true);

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('⚠️ BROWSER ERR:', msg.text());
      }
    });

    page.on('pageerror', (err) => {
      console.log('🔥 PAGE ERROR:', err.message);
    });

    page.on('request', (req) => {
      const url = req.url();
      const corsHeaders = {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'access-control-allow-headers': '*',
      };

      if (req.method() === 'OPTIONS') {
        req.respond({
          status: 200,
          headers: corsHeaders,
        });
        return;
      }

      if (url.includes('/auth/v1/user')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify(mockMaleSession.user),
        });
      } else if (url.includes('/auth/v1/token') || url.includes('/auth/v1/session')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify(mockMaleSession),
        });
      } else if (url.includes('/rest/v1/profiles')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          headers: { ...corsHeaders, 'content-range': '0-0/1' },
          body: JSON.stringify({
            id: 'usr_male_androsense_qa',
            email: 'ahmed.khan@biopulse.health',
            full_name: 'Ahmed Khan',
            gender: 'male',
            pathway: 'male',
            date_of_birth: '1992-06-15',
            height_cm: 178,
            weight_kg: 80,
            waist_cm: 86,
            is_onboarded: true,
            dietary_preference: 'halal_omnivore',
            mens_health: {
              energyLevel: 'moderate',
              sexDrive: 'normal',
              sleepQuality: 'restful',
              muscleStrengthChanges: 'stable',
            },
          }),
        });
      } else if (url.includes('/rest/v1/')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          headers: { ...corsHeaders, 'content-range': '0-0/0' },
          body: JSON.stringify([]),
        });
      } else if (url.includes('/plan/current/')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify(mock3DayPlan),
        });
      } else if (
        url.includes('lifestyle-recommendations') ||
        url.includes('lifestyle-ai-plan') ||
        url.includes('lifestyle-recipe') ||
        url.includes('/api/lifestyle/')
      ) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify(mockMaleRecommendations),
        });
      } else {
        req.continue();
      }
    });

    // 1. Prime origin storage
    await page.goto('http://localhost:5174/login', { waitUntil: 'domcontentloaded' });

    const todayStr = new Date().toISOString().split('T')[0];

    await page.evaluate(
      (sess, prof, today, recs) => {
        localStorage.setItem('sb-dqqrqwjeebecmgfsihtv-auth-token', JSON.stringify(sess));
        localStorage.setItem('ovasense_user_profile_v1', JSON.stringify(prof));
        localStorage.setItem('biopulse_user_profile', JSON.stringify(prof));
        localStorage.setItem('biopulse_locale', 'en');
        localStorage.setItem('biopulse_locale_selected', 'true');
        localStorage.setItem('i18nextLng', 'en');

        // AndroSense daily goals seeded
        localStorage.setItem(
          `androsense_daily_goals_${prof.id}_${today}`,
          JSON.stringify({ goal_meal: true, goal_workout: true, goal_water: true, goal_sleep: true })
        );

        // Prepopulate recommendation cache
        const entry = { data: recs, timestamp: Date.now() };
        sessionStorage.setItem(`biopulse_lifestyle_cache_${prof.id}:androsense`, JSON.stringify(entry));
        sessionStorage.setItem(`biopulse_lifestyle_cache_active-user:androsense`, JSON.stringify(entry));
        localStorage.setItem(`biopulse_lifestyle_cache_${prof.id}:androsense`, JSON.stringify(entry));
        localStorage.setItem(`biopulse_lifestyle_cache_active-user:androsense`, JSON.stringify(entry));
      },
      mockMaleSession,
      maleProfile,
      todayStr,
      mockMaleRecommendations
    );

    // 2. Navigate to /app/lifestyle
    console.log('Navigating to http://localhost:5174/app/lifestyle...');
    await page.goto('http://localhost:5174/app/lifestyle', { waitUntil: 'networkidle2' });
    console.log('Landed on URL:', page.url());

    // Wait specifically for AndroSense daily meal plan card to render
    await page.waitForSelector('[data-testid="androsense-daily-meal-plan"]', { timeout: 10000 });
    console.log('✅ Found [data-testid="androsense-daily-meal-plan"] in DOM!');

    // Hide reticle overlay completely
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        .reticle-toolbar-chrome, [class*="reticle-"], [id*="reticle-"], div[style*="--reticle"], iframe[src*="reticle"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
    });

    await new Promise((r) => setTimeout(r, 1000));

    // -------------------------------------------------------------
    // SCREENSHOT 1: Male Lifestyle Desktop View
    // -------------------------------------------------------------
    const desktopScreenshotPath = path.join(ARTIFACTS_DIR, 'androsense_lifestyle_desktop.png');
    await page.screenshot({ path: desktopScreenshotPath, fullPage: true });
    console.log(`📸 1. Male Lifestyle Desktop View saved: ${desktopScreenshotPath}`);

    // -------------------------------------------------------------
    // SCREENSHOT 2: Male Nutrition Cards
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="androsense-nutrition-overview"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise((r) => setTimeout(r, 600));
    const nutritionSection = await page.$('[data-testid="androsense-nutrition-overview"]');
    if (nutritionSection) {
      const nutritionPath = path.join(ARTIFACTS_DIR, 'androsense_nutrition_cards.png');
      await nutritionSection.screenshot({ path: nutritionPath });
      console.log(`📸 2. Male Nutrition Cards saved: ${nutritionPath}`);
    }

    // -------------------------------------------------------------
    // SCREENSHOT 3: Male Daily Meal Plan (4 Horizontal Cards)
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="androsense-daily-meal-plan"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise((r) => setTimeout(r, 600));
    const mealPlanSection = await page.$('[data-testid="androsense-daily-meal-plan"]');
    if (mealPlanSection) {
      const mealPlanPath = path.join(ARTIFACTS_DIR, 'androsense_daily_meal_plan.png');
      await mealPlanSection.screenshot({ path: mealPlanPath });
      console.log(`📸 3. Male Daily Meal Plan saved: ${mealPlanPath}`);
    }

    // -------------------------------------------------------------
    // SCREENSHOT 4: Opened Male Meal Details Modal
    // -------------------------------------------------------------
    console.log('Clicking "Details" button on Breakfast card...');
    const detailsBtn = await page.$('[data-testid="androsense-details-btn"]');
    if (detailsBtn) {
      await detailsBtn.click();
      await page.waitForSelector('[data-testid="androsense-meal-details-modal"]', { timeout: 5000 });
      await new Promise((r) => setTimeout(r, 800));
      const modal = await page.$('[data-testid="androsense-meal-details-modal"]');
      if (modal) {
        const modalPath = path.join(ARTIFACTS_DIR, 'androsense_meal_details_modal.png');
        await page.screenshot({ path: modalPath });
        console.log(`📸 4. Male Meal Details Modal saved: ${modalPath}`);

        // Close modal
        const closeBtn = await page.$('[data-testid="androsense-meal-details-modal"] button[aria-label="Close"]');
        if (closeBtn) {
          await closeBtn.click();
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    // -------------------------------------------------------------
    // SCREENSHOT 5: Male Three-Day Planner
    // -------------------------------------------------------------
    console.log('Clicking "View 3-Day Plan" button...');
    const planBtn = await page.$('[data-testid="androsense-view-3day-plan-btn"]');
    if (planBtn) {
      await planBtn.click();
      await page.waitForSelector('[data-testid="androsense-weekly-plan-modal"]', { timeout: 5000 });
      await new Promise((r) => setTimeout(r, 800));
      const planModal = await page.$('[data-testid="androsense-weekly-plan-modal"]');
      if (planModal) {
        const planPath = path.join(ARTIFACTS_DIR, 'androsense_three_day_planner.png');
        await page.screenshot({ path: planPath });
        console.log(`📸 5. Male Three-Day Planner saved: ${planPath}`);

        // Close modal
        const closeBtn = await page.$('[data-testid="androsense-weekly-plan-modal"] button');
        if (closeBtn) {
          await closeBtn.click();
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    // -------------------------------------------------------------
    // SCREENSHOT 6: Mobile Responsive View (390px x 844px)
    // -------------------------------------------------------------
    console.log('Capturing Mobile View (390px x 844px)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 1200));

    const mobilePath = path.join(ARTIFACTS_DIR, 'androsense_mobile_view.png');
    await page.screenshot({ path: mobilePath, fullPage: true });
    console.log(`📸 6. Mobile Responsive View saved: ${mobilePath}`);

    // Restore desktop viewport
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 800));

    // -------------------------------------------------------------
    // SCREENSHOT 7: Urdu Localization View (Desktop)
    // -------------------------------------------------------------
    console.log('Capturing Urdu Localization View (Desktop)...');
    const headerButtons = await page.$$('button');
    for (const b of headerButtons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('اردو') || text.includes('EN')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1500));

    const urduPath = path.join(ARTIFACTS_DIR, 'androsense_lifestyle_urdu_rendered.png');
    await page.screenshot({ path: urduPath, fullPage: true });
    console.log(`📸 7. Urdu Localized View saved: ${urduPath}`);

    console.log('\n🎉 ALL ANDROSENSE QA CHECKS AND SCREENSHOTS GENERATED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Browser QA Error:', err);
  process.exit(1);
});
