import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Bell,
  Sun,
  Calendar,
  FileText,
  Clock,
  RefreshCw,
  Droplet,
  Droplets,
  Apple,
  Activity,
  Footprints,
  MapPin,
  Flame,
  Plus,
  Pill,
  Check,
  Users,
  Heart,
  Smile,
  Zap,
  Sparkles,
  Target,
  ArrowRight,
  MoreVertical,
  User,
} from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { ROUTES } from '../../constants/routes';

export const FemaleDashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const {
    userProfile,
    snapshotMetrics,
    activeAssessment,
    mlAssessment,
    nutrition,
    waterLog,
    incrementWater,
    fitness,
    medications,
    reminders,
    careCircleMembers,
    symptomRecords,
    reports,
    upcomingAppointment,
    logMedicationDose,
  } = useUserHealth();

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Local interactive medication taken state
  const [medTaken, setMedTaken] = useState(false);
  const [waterAdding, setWaterAdding] = useState(false);

  // ── 1. Dynamic User Info & Greeting ──────────────────────────────────────────
  const firstName = useMemo(() => {
    return userProfile?.fullName?.trim().split(' ')[0] || '';
  }, [userProfile?.fullName]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    return firstName ? `Good ${timeOfDay}, ${firstName}` : `Good ${timeOfDay}`;
  }, [firstName]);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // ── 2. Dynamic Cycle Metrics ────────────────────────────────────────────────
  const hasCycleData = useMemo(() => {
    return Boolean(
      snapshotMetrics?.cycleDay ||
      userProfile?.womensHealth?.currentCycleDay ||
      userProfile?.womensHealth?.lastPeriodDate
    );
  }, [snapshotMetrics?.cycleDay, userProfile?.womensHealth?.currentCycleDay, userProfile?.womensHealth?.lastPeriodDate]);

  const cycleDay = useMemo(() => {
    return snapshotMetrics?.cycleDay || userProfile?.womensHealth?.currentCycleDay || null;
  }, [snapshotMetrics?.cycleDay, userProfile?.womensHealth?.currentCycleDay]);

  const cycleLength = useMemo(() => {
    const raw = userProfile?.womensHealth?.cycleLength;
    if (typeof raw === 'number') return raw;
    return hasCycleData ? 28 : null;
  }, [userProfile?.womensHealth?.cycleLength, hasCycleData]);

  const cycleWeekNumber = cycleDay ? Math.ceil(cycleDay / 7) : null;

  const nextPeriodDate = useMemo(() => {
    return snapshotMetrics?.nextPeriodDate || null;
  }, [snapshotMetrics?.nextPeriodDate]);

  const nextPeriodDays = useMemo(() => {
    if (snapshotMetrics?.nextPeriodDays !== undefined && snapshotMetrics.nextPeriodDays !== null) {
      return snapshotMetrics.nextPeriodDays;
    }
    if (cycleLength && cycleDay) {
      return Math.max(0, cycleLength - cycleDay);
    }
    return null;
  }, [snapshotMetrics?.nextPeriodDays, cycleLength, cycleDay]);

  // ── 3. Dynamic Authoritative Screening Probability ──────────────────────────
  const hasAssessment = useMemo(() => {
    return Boolean(activeAssessment || mlAssessment);
  }, [activeAssessment, mlAssessment]);

  const probabilityPercent = useMemo(() => {
    if (activeAssessment?.probability_percent !== undefined && activeAssessment.probability_percent !== null) {
      return Math.round(activeAssessment.probability_percent);
    }
    if (activeAssessment?.probability !== undefined && activeAssessment.probability !== null) {
      return Math.round(activeAssessment.probability * 100);
    }
    if (mlAssessment?.pcos_probability !== undefined && mlAssessment.pcos_probability !== null) {
      return Math.round(mlAssessment.pcos_probability * 100);
    }
    return null;
  }, [activeAssessment, mlAssessment]);

  const riskLabel = useMemo(() => {
    if (!hasAssessment) return 'Not assessed';
    if (activeAssessment?.risk_label) return activeAssessment.risk_label;
    const cat = activeAssessment?.risk_category || mlAssessment?.risk_category;
    if (cat === 'higher' || cat === 'elevated') return 'Higher risk';
    if (cat === 'lower') return 'Lower risk';
    return 'Intermediate risk';
  }, [hasAssessment, activeAssessment, mlAssessment]);

  const lastAssessmentDate = useMemo(() => {
    const raw = activeAssessment?.created_at;
    if (!raw) return null;
    return new Date(raw).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [activeAssessment?.created_at]);

  // ── 4. Dynamic Nutrition Metrics ────────────────────────────────────────────
  const caloriesLogged = useMemo(() => {
    return nutrition?.caloriesLogged || 0;
  }, [nutrition?.caloriesLogged]);

  const caloriesTarget = useMemo(() => {
    return nutrition?.caloriesTarget || 2000;
  }, [nutrition?.caloriesTarget]);

  const caloriesRemaining = Math.max(0, caloriesTarget - caloriesLogged);

  const carbsGrams = useMemo(() => {
    return nutrition?.carbsGrams || 0;
  }, [nutrition?.carbsGrams]);

  const proteinGrams = useMemo(() => {
    return nutrition?.proteinGrams || 0;
  }, [nutrition?.proteinGrams]);

  const fatGrams = useMemo(() => {
    return nutrition?.fatGrams || 0;
  }, [nutrition?.fatGrams]);

  const totalMacroGrams = carbsGrams + proteinGrams + fatGrams;
  const carbsPct = totalMacroGrams > 0 ? Math.round((carbsGrams / totalMacroGrams) * 100) : 0;
  const proteinPct = totalMacroGrams > 0 ? Math.round((proteinGrams / totalMacroGrams) * 100) : 0;
  const fatPct = totalMacroGrams > 0 ? Math.round((fatGrams / totalMacroGrams) * 100) : 0;

  // ── 5. Dynamic Fitness Metrics ──────────────────────────────────────────────
  const exerciseMinutes = useMemo(() => {
    return fitness?.activeMinutesToday || 0;
  }, [fitness?.activeMinutesToday]);

  const caloriesBurned = useMemo(() => {
    return fitness?.caloriesBurned || 0;
  }, [fitness?.caloriesBurned]);

  const steps = useMemo(() => {
    if (fitness?.walkingMinutes && fitness.walkingMinutes > 0) {
      return Math.round(fitness.walkingMinutes * 105);
    }
    if (exerciseMinutes > 0) {
      return Math.round(exerciseMinutes * 85);
    }
    return 0;
  }, [fitness?.walkingMinutes, exerciseMinutes]);

  const distanceKm = useMemo(() => {
    if (steps > 0) {
      return +(steps * 0.00075).toFixed(1);
    }
    return 0;
  }, [steps]);

  // ── 6. Dynamic Water Hydration Metrics ──────────────────────────────────────
  const waterLiters = useMemo(() => {
    if (waterLog?.glasses !== undefined && waterLog.glasses !== null) {
      return +(waterLog.glasses * 0.25).toFixed(2);
    }
    return nutrition?.waterIntakeLiters || 0;
  }, [waterLog?.glasses, nutrition?.waterIntakeLiters]);

  const waterTarget = useMemo(() => {
    return (
      nutrition?.waterTargetLiters ||
      (userProfile?.lifestyle?.dailyWaterGlasses ? userProfile.lifestyle.dailyWaterGlasses * 0.25 : 2.5)
    );
  }, [nutrition?.waterTargetLiters, userProfile?.lifestyle?.dailyWaterGlasses]);

  const waterPercentage = waterTarget > 0 ? Math.min(100, Math.round((waterLiters / waterTarget) * 100)) : 0;

  const handleAddWater = async () => {
    setWaterAdding(true);
    try {
      await incrementWater();
    } catch {
      // safe fallback
    } finally {
      setTimeout(() => setWaterAdding(false), 800);
    }
  };

  // ── 7. Dynamic Medication Reminder ──────────────────────────────────────────
  const activeMedication = useMemo(() => {
    if (medications && medications.length > 0) {
      const med = medications[0];
      const doseStr = med.dose ? `${med.dose} ${med.unit || 'mg'}` : '';
      return {
        id: med.id,
        name: med.name.replace(/Hydrochloride|Tablets|Capsules/gi, '').trim(),
        dosage: doseStr,
        instruction: med.notes || 'As prescribed',
        time: med.scheduledTimes?.[0] ? `${med.scheduledTimes[0]}` : 'Scheduled today',
      };
    }
    return null;
  }, [medications]);

  const totalReminders = reminders?.length || medications?.length || 0;

  const handleToggleMedTaken = async () => {
    const nextState = !medTaken;
    setMedTaken(nextState);
    if (nextState && activeMedication && medications && medications.length > 0) {
      try {
        await logMedicationDose({
          medicationId: medications[0].id,
          scheduledFor: new Date().toISOString().split('T')[0],
          scheduledTime: '20:00:00',
          status: 'taken',
        });
      } catch {
        // safe fallback
      }
    }
  };

  // ── 8. Dynamic Care Circle Members ──────────────────────────────────────────
  const displayMembers = useMemo(() => {
    // Strictly read authentic members actively added by the user
    // Filter out any mock templates (e.g., 'Dr. Sara Malik' or 'Fatima Khan')
    const active = (careCircleMembers || []).filter(
      (m) =>
        m.status === 'active' &&
        !m.id?.startsWith('cc_') &&
        m.name !== 'Dr. Sara Malik' &&
        !m.name.includes('Fatima Khan')
    );
    return active.slice(0, 3).map((m) => ({
      name: m.name,
      role: m.relationship || m.clinicOrganization || (m.role === 'doctor' ? 'Care Provider' : 'Support Member'),
      avatar: '',
      isOnline: true,
    }));
  }, [careCircleMembers]);

  const totalCircleCount = useMemo(() => {
    return (careCircleMembers || []).filter(
      (m) =>
        m.status === 'active' &&
        !m.id?.startsWith('cc_') &&
        m.name !== 'Dr. Sara Malik' &&
        !m.name.includes('Fatima Khan')
    ).length;
  }, [careCircleMembers]);

  const extraMembers = Math.max(0, totalCircleCount - 3);

  // ── 9. Dynamic Symptoms from User Logs ───────────────────────────────────────
  const hasSymptomsLogged = useMemo(() => {
    return Boolean(symptomRecords && symptomRecords.length > 0);
  }, [symptomRecords]);

  const dynamicSymptoms = useMemo(() => {
    if (!hasSymptomsLogged || !symptomRecords) {
      return {
        mood: null,
        energy: null,
        bloating: null,
        cramps: null,
      };
    }

    const moodRecord = symptomRecords.find(
      (s) =>
        s.category === 'energy_mood' ||
        s.symptomType.toLowerCase().includes('mood') ||
        s.symptomType.toLowerCase().includes('stress')
    );
    const energyRecord = symptomRecords.find(
      (s) => s.symptomType.toLowerCase().includes('energy') || s.symptomType.toLowerCase().includes('fatigue')
    );
    const bloatingRecord = symptomRecords.find((s) => s.symptomType.toLowerCase().includes('bloat'));
    const crampsRecord = symptomRecords.find(
      (s) => s.symptomType.toLowerCase().includes('cramp') || s.symptomType.toLowerCase().includes('pelvic')
    );

    const formatSeverity = (sev?: string) => {
      if (!sev) return null;
      return sev.charAt(0).toUpperCase() + sev.slice(1).toLowerCase();
    };

    return {
      mood: moodRecord
        ? moodRecord.severity === 'mild'
          ? 'Calm'
          : moodRecord.severity === 'moderate'
          ? 'Sensitive'
          : 'Low'
        : null,
      energy: energyRecord
        ? energyRecord.severity === 'mild'
          ? 'Good'
          : energyRecord.severity === 'moderate'
          ? 'Moderate'
          : 'Low'
        : null,
      bloating: formatSeverity(bloatingRecord?.severity),
      cramps: formatSeverity(crampsRecord?.severity),
    };
  }, [hasSymptomsLogged, symptomRecords]);

  // ── 10. Dynamic Recent Health Records ────────────────────────────────────────
  const latestReport = useMemo(() => {
    if (reports && reports.length > 0) {
      return [...reports].sort(
        (a, b) => new Date(b.reportDate || b.createdAt).getTime() - new Date(a.reportDate || a.createdAt).getTime()
      )[0];
    }
    return null;
  }, [reports]);

  // ── 11. Dynamic Next Best Action Derivation ───────────────────────────────────
  const nextBestAction = useMemo(() => {
    if (!hasAssessment) {
      return {
        title: 'Complete your initial PCOS screening',
        description:
          'Complete a clinical symptom and lifestyle screening to calculate your baseline risk score and personalized care pathway.',
        ctaText: 'Start PCOS Assessment',
        route: ROUTES.APP.ASSESSMENT,
      };
    }
    if (caloriesLogged === 0) {
      return {
        title: 'Log your first meal today',
        description:
          'Consistent nutrition tracking supports metabolic stability. Log breakfast or lunch to monitor your macronutrient balance.',
        ctaText: 'Log Meals in Food Diary',
        route: ROUTES.APP.DIET,
      };
    }
    if (waterLiters < 1.0) {
      return {
        title: 'Hydrate for hormonal balance',
        description: `You have logged ${waterLiters}L of water today. Staying hydrated supports ovarian circulation and reduces water retention.`,
        ctaText: 'Open Water Log',
        route: ROUTES.APP.DIET,
      };
    }
    if (!hasSymptomsLogged) {
      return {
        title: "Log today's wellness check-in",
        description:
          'Tracking daily symptoms helps your clinical AI model identify phase-specific patterns and hormonal shifts.',
        ctaText: 'Log Symptoms',
        route: ROUTES.APP.SYMPTOMS,
      };
    }
    if (caloriesRemaining >= 400 || proteinGrams < 50) {
      return {
        title: 'Focus on balanced meals today',
        description:
          'Your calorie intake is lower than usual and protein is below target. A nutrient-rich meal can help support energy and hormonal wellness.',
        ctaText: 'View Nutrition Recommendations',
        route: ROUTES.APP.DIET,
      };
    }
    return {
      title: 'Maintain your healthy momentum',
      description:
        'You are actively tracking your health logs today. Check your daily cycle insights to align workouts and nutrition with your body.',
      ctaText: 'View Cycle Insights',
      route: ROUTES.APP.CYCLE,
    };
  }, [hasAssessment, caloriesLogged, waterLiters, hasSymptomsLogged, caloriesRemaining, proteinGrams]);

  // SVG Gauge calculations for PCOS Screening
  const gaugeSize = 132;
  const gaugeStroke = 12;
  const gaugeRadius = (gaugeSize - gaugeStroke) / 2;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeDashoffset =
    probabilityPercent !== null
      ? gaugeCircumference - (probabilityPercent / 100) * gaugeCircumference
      : gaugeCircumference;

  // SVG Donut calculation for Nutrition
  const donutSize = 96;
  const donutStroke = 9;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutRatio = caloriesTarget > 0 ? Math.min(1, caloriesLogged / caloriesTarget) : 0;
  const donutDashoffset = donutCircumference - donutRatio * donutCircumference;

  // SVG Activity Ring calculation
  const ringSize = 96;
  const ringStroke = 9;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringRatio = Math.min(1, exerciseMinutes / 60);
  const ringDashoffset = ringCircumference - ringRatio * ringCircumference;

  const totalGlasses = 8;
  const filledGlasses =
    waterTarget > 0 ? Math.min(totalGlasses, Math.round((waterLiters / waterTarget) * totalGlasses)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      className="space-y-6 sm:space-y-7 pb-16 text-left select-none max-w-[1600px] mx-auto"
    >
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER: SEARCH BAR + NOTIFICATIONS + USER CHIP                    */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-[#55718F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for symptoms, meals, workouts, or ask AI..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#F0DCE5] rounded-xl text-xs sm:text-sm text-[#073B72] placeholder-[#55718F]/70 shadow-[0_1px_4px_rgba(244,63,125,0.02)] focus:outline-none focus:border-[#F43F7D] focus:ring-2 focus:ring-[#F43F7D]/15 transition-all"
            />
          </div>
        </div>

        {/* Right Controls: Notifications & User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notification Bell */}
          <button
            type="button"
            className="relative p-2.5 bg-white border border-[#F0DCE5] rounded-xl text-[#55718F] hover:text-[#073B72] hover:border-[#F7C7D8] shadow-xs transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#F43F7D] ring-2 ring-white" />
          </button>

          {/* User Profile Chip */}
          <div className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 bg-white border border-[#F0DCE5] rounded-xl shadow-xs">
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile?.fullName || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-[#F7C7D8]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#FFF2F7] border border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] font-bold text-xs">
                {firstName ? firstName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
            )}
            <div className="hidden sm:block text-left leading-tight">
              <span className="text-xs font-bold text-[#073B72] block truncate">
                {userProfile?.fullName || 'My Health Profile'}
              </span>
              <span className="text-[10px] text-[#55718F] block truncate">
                {userProfile?.pathway ? `${userProfile.pathway.toUpperCase()} Pathway` : 'PCOS Pathway'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 2. GREETING BANNER & STATUS BADGES                                      */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        {/* Left: Sun Icon & Friendly Clinical Welcome */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#F5A623] shrink-0 shadow-xs">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[26px] font-bold text-[#073B72] tracking-tight">
              {greeting}
            </h1>
            <p className="text-xs sm:text-sm text-[#55718F] mt-0.5">
              You&apos;re doing great! Here&apos;s your health summary for today.
            </p>
          </div>
        </div>

        {/* Right: Pathway Pill, Sync Badge & Date Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* PCOS Dashboard Pathway Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF2F7] border border-[#F7C7D8] rounded-xl text-xs font-semibold text-[#F43F7D] shadow-xs">
            <span className="text-sm leading-none">♀</span>
            <span>PCOS Dashboard</span>
          </div>

          {/* Sync Status Badge */}
          <div className="px-3 py-1.5 bg-white border border-[#F0DCE5] rounded-xl text-left shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0E9EAA] animate-pulse shrink-0" />
            <div className="leading-tight">
              <span className="text-xs font-bold text-[#073B72] block">
                Last synced realtime
              </span>
              <span className="text-[10px] text-[#55718F] block">
                All data is up to date
              </span>
            </div>
          </div>

          {/* Calendar Date & Cycle Day Pill */}
          <div className="px-3 py-1.5 bg-white border border-[#F0DCE5] rounded-xl text-left shadow-xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FFF2F7] border border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="leading-tight">
              <span className="text-xs font-bold text-[#073B72] block">
                {todayFormatted}
              </span>
              <span className="text-[10px] text-[#55718F] block">
                {hasCycleData && cycleDay
                  ? `Week ${cycleWeekNumber || 1}, Cycle Day ${cycleDay}`
                  : 'Cycle Not Tracked'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 2.5 RECENT HEALTH RECORDS SECTION                                       */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-[#55718F] uppercase tracking-wider">
          RECENT HEALTH RECORDS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: Recent Clinical Report */}
          <div
            onClick={() => navigate(ROUTES.APP.REPORTS)}
            className="bg-white border border-[#F0DCE5] rounded-2xl p-4 sm:p-5 flex items-center justify-between hover:border-[#F7C7D8] hover:shadow-[0_2px_12px_rgba(244,63,125,0.06)] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF2F7] border border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] shrink-0">
                <FileText className="w-5 h-5 text-[#F43F7D]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[#55718F] truncate">Recent Clinical Report</p>
                <h4 className="text-sm sm:text-base font-bold text-[#073B72] truncate">
                  {latestReport ? latestReport.title : 'No reports uploaded yet'}
                </h4>
                <p className="text-xs text-[#55718F] truncate mt-0.5">
                  {latestReport
                    ? `${latestReport.reportDate} · ${latestReport.status === 'verified' ? 'Biomarkers verified' : 'Processing analysis'}`
                    : 'Upload lab work to extract biomarkers'}
                </p>
              </div>
            </div>
            <div className="text-[#8FA5BD] group-hover:text-[#F43F7D] group-hover:translate-x-1 transition-all shrink-0 ml-3">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Upcoming Appointment */}
          <div
            onClick={() => navigate(ROUTES.APP.APPOINTMENTS || ROUTES.APP.CARE_CIRCLE)}
            className="bg-white border border-[#F0DCE5] rounded-2xl p-4 sm:p-5 flex items-center justify-between hover:border-[#F7C7D8] hover:shadow-[0_2px_12px_rgba(244,63,125,0.06)] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF2F7] border border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] shrink-0">
                <Calendar className="w-5 h-5 text-[#F43F7D]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[#55718F] truncate">Upcoming Appointment</p>
                <h4 className="text-sm sm:text-base font-bold text-[#073B72] truncate">
                  {upcomingAppointment ? (upcomingAppointment.title || upcomingAppointment.providerName) : 'No appointments scheduled'}
                </h4>
                <p className="text-xs text-[#55718F] truncate mt-0.5">
                  {upcomingAppointment
                    ? `${upcomingAppointment.scheduledDate} at ${upcomingAppointment.scheduledTime} · ${upcomingAppointment.location || 'Clinic'}`
                    : 'Prepare clinical questions for your doctor'}
                </p>
              </div>
            </div>
            <div className="text-[#8FA5BD] group-hover:text-[#F43F7D] group-hover:translate-x-1 transition-all shrink-0 ml-3">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 3. MAIN DASHBOARD GRID (3 ROWS, 9 DYNAMIC CARDS)                        */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-5 sm:space-y-6">
        {/* ── ROW 1: Screening (Large), Period Cycle (Medium), Nutrition (Medium) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* ── CARD 1: PCOS Screening (Col Span 5) ── */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white border border-[#F0DCE5] rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(244,63,125,0.03)] flex flex-col justify-between h-full space-y-4">
              {/* Header with Live Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF2F7] border border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] shrink-0">
                    <FileText className="w-5 h-5 text-[#F43F7D]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-[#073B72] tracking-tight truncate">
                      PCOS Screening
                    </h2>
                    <p className="text-xs text-[#55718F] font-normal truncate mt-0.5">
                      Based on your latest assessment and health data
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0E9EAA]/8 text-[#0E9EAA] border border-[#0E9EAA]/25 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E9EAA] animate-pulse" />
                    <span>Live data</span>
                  </span>
                  <button type="button" aria-label="Menu" className="p-1 rounded-lg text-[#55718F] hover:text-[#073B72] hover:bg-[#FFF2F7] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Gauge & Risk Details */}
              <div className="flex flex-col sm:flex-row items-center gap-5 py-1">
                {/* Circular Gauge */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <svg width={gaugeSize} height={gaugeSize} className="transform -rotate-90">
                    <circle
                      cx={gaugeSize / 2}
                      cy={gaugeSize / 2}
                      r={gaugeRadius}
                      fill="none"
                      stroke="#FDE7EF"
                      strokeWidth={gaugeStroke}
                    />
                    <circle
                      cx={gaugeSize / 2}
                      cy={gaugeSize / 2}
                      r={gaugeRadius}
                      fill="none"
                      stroke="url(#pcosPinkGradient)"
                      strokeWidth={gaugeStroke}
                      strokeDasharray={gaugeCircumference}
                      strokeDashoffset={gaugeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="pcosPinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F43F7D" />
                        <stop offset="100%" stopColor="#D92F68" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-extrabold text-[#073B72] tracking-tight">
                      {probabilityPercent !== null ? `${probabilityPercent}%` : '—'}
                    </span>
                    <span className="text-[11px] font-semibold text-[#55718F] -mt-0.5">
                      {probabilityPercent !== null ? 'PCOS Risk' : 'Not Assessed'}
                    </span>
                  </div>
                </div>

                {/* Risk Explanation & Pill */}
                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                        !hasAssessment
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : riskLabel.includes('Higher')
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : riskLabel.includes('Lower')
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {riskLabel}
                    </span>
                  </div>
                  <p className="text-xs text-[#55718F] leading-relaxed">
                    {hasAssessment
                      ? `Your results suggest an ${riskLabel.toLowerCase()} of PCOS. Continue tracking your symptoms and lifestyle for better insights.`
                      : 'No assessment completed yet. Take an assessment to evaluate your risk factors and receive clinical recommendations.'}
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.APP.ASSESSMENT)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F43F7D] to-[#D92F68] hover:from-[#E03570] hover:to-[#C2235B] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer group"
                    >
                      <span>{hasAssessment ? 'View Full Assessment' : 'Start Assessment'}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Assessment Meta Footer */}
              <div className="pt-3 border-t border-[#F0DCE5]/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#55718F]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#8FA5BD]" />
                  <span>Last assessed:</span>
                  <span className="font-semibold text-[#073B72]">
                    {lastAssessmentDate || 'Not assessed'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8FA5BD]" />
                  <span>Next recommended:</span>
                  <span className="font-semibold text-[#073B72]">
                    {hasAssessment ? 'In 3 months' : 'Available now'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[#0E9EAA] font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin-slow" />
                  <span>Synced with Screening module</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── CARD 2: Period Cycle (Col Span 4) ── */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-white border border-[#F0DCE5] rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(244,63,125,0.03)] flex flex-col justify-between h-full space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF2F7] border border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] shrink-0">
                    <Droplet className="w-5 h-5 text-[#F43F7D]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-[#073B72] tracking-tight truncate">
                      Period Cycle
                    </h2>
                    <p className="text-xs text-[#55718F] font-normal truncate mt-0.5">
                      Current cycle information
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0E9EAA]/8 text-[#0E9EAA] border border-[#0E9EAA]/25 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E9EAA] animate-pulse" />
                    <span>Live data</span>
                  </span>
                  <button type="button" aria-label="Menu" className="p-1 rounded-lg text-[#55718F] hover:text-[#073B72] hover:bg-[#FFF2F7] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cycle Numbers Grid */}
              {hasCycleData && cycleDay ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#FFF2F7]/50 border border-[#F7C7D8]/60 rounded-xl p-3">
                      <span className="text-[11px] font-medium text-[#55718F] block">Current Cycle Day</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-extrabold text-[#073B72] tracking-tight">
                          {cycleDay}
                        </span>
                        <span className="text-xs text-[#55718F]">
                          of ~{cycleLength || 28} days
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#FFF2F7]/50 border border-[#F7C7D8]/60 rounded-xl p-3 flex flex-col justify-between">
                      <span className="text-[11px] font-medium text-[#55718F] block">Next Period (Predicted)</span>
                      <div className="mt-1">
                        <div className="flex items-center gap-1 text-xs font-bold text-[#073B72]">
                          <Calendar className="w-3.5 h-3.5 text-[#F43F7D] shrink-0" />
                          <span className="truncate">{nextPeriodDate || 'Estimated soon'}</span>
                        </div>
                        {nextPeriodDays !== null && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-[#F7C7D8] text-[#F43F7D]">
                            In {nextPeriodDays} days
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 28-day timeline visual */}
                  <div className="space-y-2 pt-1">
                    <div className="relative h-4 flex items-center justify-between px-1">
                      <div className="absolute left-0 right-0 h-1.5 bg-[#FDE7EF] rounded-full -z-0" />
                      {Array.from({ length: 14 }).map((_, i) => {
                        const dayNum = (i + 1) * 2;
                        const isPeriod = dayNum <= 5;
                        const isOvulation = dayNum === 14;
                        const isFertile = dayNum >= 10 && dayNum <= 16;
                        const isCurrent = Math.abs(dayNum - cycleDay) <= 1;

                        return (
                          <div
                            key={dayNum}
                            className={`relative z-10 w-2.5 h-2.5 rounded-full transition-transform ${
                              isCurrent
                                ? 'w-4 h-4 bg-[#0E9EAA] ring-4 ring-[#0E9EAA]/20 -translate-y-0.5 shadow-xs'
                                : isPeriod
                                ? 'bg-[#F43F7D]'
                                : isOvulation
                                ? 'bg-[#0E9EAA]'
                                : isFertile
                                ? 'bg-[#F7C7D8]'
                                : 'bg-[#E5E7EB]'
                            }`}
                            title={`Day ${dayNum}`}
                          />
                        );
                      })}
                    </div>

                    {/* Timeline Legend */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="text-[11px]">
                        <span className="font-bold text-[#F43F7D] block">Period</span>
                        <span className="text-[10px] text-[#55718F]">Days 1–5</span>
                      </div>
                      <div className="text-[11px]">
                        <span className="font-bold text-[#D92F68] block">Fertile Window</span>
                        <span className="text-[10px] text-[#55718F]">Days 10–16</span>
                      </div>
                      <div className="text-[11px]">
                        <span className="font-bold text-[#0E9EAA] block">Ovulation</span>
                        <span className="text-[10px] text-[#55718F]">Day 14</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-6 px-4 bg-[#FFF2F7]/40 rounded-xl border border-[#F7C7D8]/60 text-center space-y-3">
                  <Droplet className="w-8 h-8 text-[#F43F7D] mx-auto opacity-70" />
                  <div>
                    <h4 className="text-xs font-bold text-[#073B72]">No Cycle Data Logged</h4>
                    <p className="text-[11px] text-[#55718F] mt-1">
                      Log your last period start date to predict your fertile window and cycle phases.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.APP.CYCLE)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F43F7D] text-white text-xs font-semibold shadow-xs hover:bg-[#D92F68] transition-all cursor-pointer"
                  >
                    <span>Log Period in Cycle Tracker</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Sync Footer */}
              <div className="pt-3 border-t border-[#F0DCE5]/70 flex items-center justify-between text-[11px] text-[#55718F]">
                <div className="flex items-center gap-1.5 font-medium truncate">
                  <span className="w-2 h-2 rounded-full border border-[#0E9EAA] flex items-center justify-center shrink-0">
                    <span className="w-1 h-1 rounded-full bg-[#0E9EAA]" />
                  </span>
                  <span>Synced with Cycle Tracking</span>
                </div>
                <span>Updated realtime</span>
              </div>
            </div>
          </div>

          {/* ── CARD 3: Nutrition & Meals (Col Span 3) ── */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="bg-white border border-[#F0DCE5] rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(244,63,125,0.03)] flex flex-col justify-between h-full space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF2F7] border border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] shrink-0">
                    <Apple className="w-5 h-5 text-[#F43F7D]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-[#073B72] tracking-tight truncate">
                      Nutrition & Meals
                    </h2>
                    <p className="text-xs text-[#55718F] font-normal truncate mt-0.5">
                      Today&apos;s intake vs your target
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0E9EAA]/8 text-[#0E9EAA] border border-[#0E9EAA]/25 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E9EAA] animate-pulse" />
                    <span>Live data</span>
                  </span>
                  <button type="button" aria-label="Menu" className="p-1 rounded-lg text-[#55718F] hover:text-[#073B72] hover:bg-[#FFF2F7] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Donut and Macro Progress */}
              <div className="flex items-center gap-4 py-1">
                {/* Donut Chart */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <svg width={donutSize} height={donutSize} className="transform -rotate-90">
                    <circle
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={donutRadius}
                      fill="none"
                      stroke="#FDE7EF"
                      strokeWidth={donutStroke}
                    />
                    <circle
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={donutRadius}
                      fill="none"
                      stroke="#0E9EAA"
                      strokeWidth={donutStroke}
                      strokeDasharray={donutCircumference}
                      strokeDashoffset={donutDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-extrabold text-[#073B72] tracking-tight">
                      {caloriesLogged.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#55718F] -mt-0.5">
                      of {caloriesTarget.toLocaleString()} kcal
                    </span>
                  </div>
                </div>

                {/* Macro Breakdown Bars */}
                <div className="flex-1 space-y-2 text-xs">
                  {/* Carbs */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium mb-0.5">
                      <span className="text-[#073B72]">Carbs</span>
                      <span className="text-[#55718F] font-semibold">{carbsPct}% · {carbsGrams}g</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#FDE7EF] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F43F7D] rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, carbsPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Protein */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium mb-0.5">
                      <span className="text-[#073B72]">Protein</span>
                      <span className="text-[#55718F] font-semibold">{proteinPct}% · {proteinGrams}g</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#FDE7EF] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0E9EAA] rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, proteinPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Fats */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium mb-0.5">
                      <span className="text-[#073B72]">Fats</span>
                      <span className="text-[#55718F] font-semibold">{fatPct}% · {fatGrams}g</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#FDE7EF] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, fatPct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.APP.DIET)}
                  className="w-full py-2 px-3 rounded-xl border border-[#F7C7D8] bg-[#FFF2F7]/50 hover:bg-[#FFF2F7] text-[#D92F68] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer group"
                >
                  <span>{caloriesLogged > 0 ? 'View Meal Plan' : '+ Log Today\'s Meals'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              {/* Sync Footer */}
              <div className="pt-3 border-t border-[#F0DCE5]/70 flex items-center justify-between text-[11px] text-[#55718F]">
                <div className="flex items-center gap-1.5 font-medium truncate">
                  <span className="w-2 h-2 rounded-full border border-[#0E9EAA] flex items-center justify-center shrink-0">
                    <span className="w-1 h-1 rounded-full bg-[#0E9EAA]" />
                  </span>
                  <span>Synced with Nutrition module</span>
                </div>
                <span>Updated realtime</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 2: Exercise & Movement, Water Log, Medication Reminders (4-4-4) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* ── CARD 4: Exercise & Movement (Col Span 4) ── */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-white border border-[#F0DCE5] rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(244,63,125,0.03)] flex flex-col justify-between h-full space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF2F7] border border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] shrink-0">
                    <Activity className="w-5 h-5 text-[#F43F7D]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-[#073B72] tracking-tight truncate">
                      Exercise & Movement
                    </h2>
                    <p className="text-xs text-[#55718F] font-normal truncate mt-0.5">
                      Today&apos;s activity
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0E9EAA]/8 text-[#0E9EAA] border border-[#0E9EAA]/25 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E9EAA] animate-pulse" />
                    <span>Live data</span>
                  </span>
                  <button type="button" aria-label="Menu" className="p-1 rounded-lg text-[#55718F] hover:text-[#073B72] hover:bg-[#FFF2F7] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Ring and Activity Metrics */}
              <div className="flex items-center gap-5 py-1">
                {/* Active Minutes Ring */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <svg width={ringSize} height={ringSize} className="transform -rotate-90">
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={ringRadius}
                      fill="none"
                      stroke="#FDE7EF"
                      strokeWidth={ringStroke}
                    />
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={ringRadius}
                      fill="none"
                      stroke="#F43F7D"
                      strokeWidth={ringStroke}
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-extrabold text-[#073B72] tracking-tight">
                      {exerciseMinutes}
                    </span>
                    <span className="text-[10px] text-[#55718F] -mt-0.5">
                      of 60 mins
                    </span>
                  </div>
                </div>

                {/* Submetrics list */}
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#0E9EAA]/10 text-[#0E9EAA] flex items-center justify-center shrink-0">
                      <Footprints className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#073B72] block">
                        {steps.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#55718F] block">steps</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#073B72]/10 text-[#073B72] flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#073B72] block">
                        {distanceKm} km
                      </span>
                      <span className="text-[10px] text-[#55718F] block">distance</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#073B72] block">
                        {caloriesBurned}
                      </span>
                      <span className="text-[10px] text-[#55718F] block">calories burned</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.APP.FITNESS)}
                  className="w-full py-2 px-3 rounded-xl border border-[#F7C7D8] bg-[#FFF2F7]/50 hover:bg-[#FFF2F7] text-[#D92F68] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer group"
                >
                  <span>{exerciseMinutes > 0 ? 'View Fitness Activity' : '+ Log Workout Activity'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              {/* Sync Footer */}
              <div className="pt-3 border-t border-[#F0DCE5]/70 flex items-center justify-between text-[11px] text-[#55718F]">
                <div className="flex items-center gap-1.5 font-medium truncate">
                  <span className="w-2 h-2 rounded-full border border-[#0E9EAA] flex items-center justify-center shrink-0">
                    <span className="w-1 h-1 rounded-full bg-[#0E9EAA]" />
                  </span>
                  <span>Synced with Fitness / Movement</span>
                </div>
                <span>Updated realtime</span>
              </div>
            </div>
          </div>

          {/* ── CARD 5: Water Log (Col Span 4) ── */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-white border border-[#F0DCE5] rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(244,63,125,0.03)] flex flex-col justify-between h-full space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF2F7] border border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] shrink-0">
                    <Droplets className="w-5 h-5 text-[#F43F7D]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-[#073B72] tracking-tight truncate">
                      Water Log
                    </h2>
                    <p className="text-xs text-[#55718F] font-normal truncate mt-0.5">
                      Today&apos;s hydration
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0E9EAA]/8 text-[#0E9EAA] border border-[#0E9EAA]/25 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E9EAA] animate-pulse" />
                    <span>Live data</span>
                  </span>
                  <button type="button" aria-label="Menu" className="p-1 rounded-lg text-[#55718F] hover:text-[#073B72] hover:bg-[#FFF2F7] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Water Icons & Volume */}
              <div className="space-y-3 py-1">
                <div className="flex items-center justify-between">
                  {/* 8 Water Glasses */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {Array.from({ length: totalGlasses }).map((_, i) => {
                      const isFilled = i < filledGlasses;
                      return (
                        <div
                          key={i}
                          className={`w-6 h-9 rounded-b-md border transition-all flex flex-col justify-end overflow-hidden ${
                            isFilled
                              ? 'border-[#0E9EAA] bg-[#0E9EAA]/15'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-full transition-all duration-500 ${
                              isFilled ? 'h-4/5 bg-[#0E9EAA]' : 'h-0'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Total Volume */}
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-[#073B72] tracking-tight block">
                      {waterLiters} L
                    </span>
                    <span className="text-[11px] text-[#55718F] block">
                      of {waterTarget} L
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="h-2 w-full bg-[#FDE7EF] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0E9EAA] to-[#20B486] rounded-full transition-all duration-500"
                      style={{ width: `${waterPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#55718F] mt-1">
                    <span>Hydration progress</span>
                    <span className="font-bold text-[#073B72]">{waterPercentage}%</span>
                  </div>
                </div>
              </div>

              {/* Interactive Quick Add Water Button */}
              <div>
                <button
                  type="button"
                  onClick={handleAddWater}
                  disabled={waterAdding}
                  className="w-full py-2 px-3 rounded-xl border border-[#0E9EAA]/30 bg-[#0E9EAA]/5 hover:bg-[#0E9EAA]/10 text-[#0E9EAA] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer group"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{waterAdding ? 'Logging glass...' : '+ Add Water (250 ml)'}</span>
                </button>
              </div>

              {/* Sync Footer */}
              <div className="pt-3 border-t border-[#F0DCE5]/70 flex items-center justify-between text-[11px] text-[#55718F]">
                <div className="flex items-center gap-1.5 font-medium truncate">
                  <span className="w-2 h-2 rounded-full border border-[#0E9EAA] flex items-center justify-center shrink-0">
                    <span className="w-1 h-1 rounded-full bg-[#0E9EAA]" />
                  </span>
                  <span>Synced with Water Log</span>
                </div>
                <span>Updated realtime</span>
              </div>
            </div>
          </div>

          {/* ── CARD 6: Medication Reminders (Col Span 4) ── */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-white border border-[#F0DCE5] rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(244,63,125,0.03)] flex flex-col justify-between h-full space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF2F7] border border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] shrink-0">
                    <Pill className="w-5 h-5 text-[#F43F7D]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-[#073B72] tracking-tight truncate">
                      Medication Reminders
                    </h2>
                    <p className="text-xs text-[#55718F] font-normal truncate mt-0.5">
                      Your medications for today
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0E9EAA]/8 text-[#0E9EAA] border border-[#0E9EAA]/25 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E9EAA] animate-pulse" />
                    <span>Live data</span>
                  </span>
                  <button type="button" aria-label="Menu" className="p-1 rounded-lg text-[#55718F] hover:text-[#073B72] hover:bg-[#FFF2F7] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Medication Card Details */}
              {activeMedication ? (
                <div className="bg-[#FFF2F7]/50 border border-[#F7C7D8]/60 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#F43F7D]/10 text-[#F43F7D] flex items-center justify-center shrink-0">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-[#073B72] truncate">
                          {activeMedication.name} {activeMedication.dosage}
                        </h4>
                        <p className="text-[11px] text-[#55718F] truncate">
                          {activeMedication.instruction}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 bg-[#FFF2F7] border border-[#F7C7D8] text-[#F43F7D] text-[10px] font-bold rounded-md shrink-0">
                      {activeMedication.time}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleToggleMedTaken}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        medTaken
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {medTaken ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Taken</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full border border-amber-600" />
                          <span>Upcoming (Mark taken)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 px-4 bg-[#FFF2F7]/40 rounded-xl border border-[#F7C7D8]/60 text-center space-y-3">
                  <Pill className="w-8 h-8 text-[#F43F7D] mx-auto opacity-70" />
                  <div>
                    <h4 className="text-xs font-bold text-[#073B72]">No Medications Scheduled</h4>
                    <p className="text-[11px] text-[#55718F] mt-1">
                      You haven&apos;t added any daily medications or supplements yet.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.APP.MEDICATIONS)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F43F7D] text-white text-xs font-semibold shadow-xs hover:bg-[#D92F68] transition-all cursor-pointer"
                  >
                    <span>+ Add Medication</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Meta and View All Link */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[#55718F]">
                  {totalReminders} reminder{totalReminders === 1 ? '' : 's'} today
                </span>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.APP.MEDICATIONS)}
                  className="font-bold text-[#F43F7D] hover:text-[#D92F68] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>View All Medications</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Sync Footer */}
              <div className="pt-3 border-t border-[#F0DCE5]/70 flex items-center justify-between text-[11px] text-[#55718F]">
                <div className="flex items-center gap-1.5 font-medium truncate">
                  <span className="w-2 h-2 rounded-full border border-[#0E9EAA] flex items-center justify-center shrink-0">
                    <span className="w-1 h-1 rounded-full bg-[#0E9EAA]" />
                  </span>
                  <span>Synced with Medications</span>
                </div>
                <span>Updated realtime</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 3: Care Circle, Symptom Check-in, Next Best Action (4-4-4) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* ── CARD 7: Care Circle (Col Span 4) ── */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-white border border-[#F0DCE5] rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(244,63,125,0.03)] flex flex-col justify-between h-full space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF2F7] border border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] shrink-0">
                    <Users className="w-5 h-5 text-[#F43F7D]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-[#073B72] tracking-tight truncate">
                      Care Circle
                    </h2>
                    <p className="text-xs text-[#55718F] font-normal truncate mt-0.5">
                      Your support network
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0E9EAA]/8 text-[#0E9EAA] border border-[#0E9EAA]/25 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E9EAA] animate-pulse" />
                    <span>Live data</span>
                  </span>
                  <button type="button" aria-label="Menu" className="p-1 rounded-lg text-[#55718F] hover:text-[#073B72] hover:bg-[#FFF2F7] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Members Row */}
              {displayMembers.length > 0 ? (
                <div className="flex items-center justify-around gap-2 py-2">
                  {displayMembers.map((member, i) => (
                    <div key={i} className="flex flex-col items-center text-center space-y-1.5 flex-1 min-w-0 max-w-[120px]">
                      <div className="relative">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#F7C7D8]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#FFF2F7] border-2 border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] font-bold text-sm">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>
                      <div className="w-full">
                        <span className="text-xs font-bold text-[#073B72] truncate block" title={member.name}>
                          {member.name}
                        </span>
                        <span className="text-[10px] text-[#55718F] truncate block" title={member.role}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Additional Member Counter */}
                  {extraMembers > 0 && (
                    <div className="w-10 h-10 rounded-full bg-[#FFF2F7] border border-[#F7C7D8] text-[#F43F7D] font-bold text-xs flex items-center justify-center shrink-0">
                      +{extraMembers}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 px-4 bg-[#FFF2F7]/40 rounded-xl border border-[#F7C7D8]/60 text-center space-y-3">
                  <Users className="w-8 h-8 text-[#F43F7D] mx-auto opacity-70" />
                  <div>
                    <h4 className="text-xs font-bold text-[#073B72]">No Support Members Added</h4>
                    <p className="text-[11px] text-[#55718F] mt-1">
                      Add your doctor, specialist, or family to share cycle updates and reports.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.APP.CARE_CIRCLE)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F43F7D] text-white text-xs font-semibold shadow-xs hover:bg-[#D92F68] transition-all cursor-pointer"
                  >
                    <span>+ Add Member</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.APP.CARE_CIRCLE)}
                  className="w-full py-2 px-3 rounded-xl border border-[#F7C7D8] bg-[#FFF2F7]/50 hover:bg-[#FFF2F7] text-[#D92F68] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer group"
                >
                  <span>Open Care Circle</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              {/* Sync Footer */}
              <div className="pt-3 border-t border-[#F0DCE5]/70 flex items-center justify-between text-[11px] text-[#55718F]">
                <div className="flex items-center gap-1.5 font-medium truncate">
                  <span className="w-2 h-2 rounded-full border border-[#0E9EAA] flex items-center justify-center shrink-0">
                    <span className="w-1 h-1 rounded-full bg-[#0E9EAA]" />
                  </span>
                  <span>Synced with Care Circle</span>
                </div>
                <span>Updated realtime</span>
              </div>
            </div>
          </div>

          {/* ── CARD 8: Symptom Check-in (Col Span 4) ── */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-white border border-[#F0DCE5] rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(244,63,125,0.03)] flex flex-col justify-between h-full space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF2F7] border border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] shrink-0">
                    <Heart className="w-5 h-5 text-[#F43F7D]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-[#073B72] tracking-tight truncate">
                      Symptom Check-in
                    </h2>
                    <p className="text-xs text-[#55718F] font-normal truncate mt-0.5">
                      Today&apos;s wellness snapshot
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0E9EAA]/8 text-[#0E9EAA] border border-[#0E9EAA]/25 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E9EAA] animate-pulse" />
                    <span>Live data</span>
                  </span>
                  <button type="button" aria-label="Menu" className="p-1 rounded-lg text-[#55718F] hover:text-[#073B72] hover:bg-[#FFF2F7] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4 Dynamic Check-in Indicators (2x2 Grid for generous width & responsiveness) */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 py-1">
                {/* Mood */}
                <div className="bg-[#FFF2F7]/50 border border-[#F7C7D8]/60 rounded-xl p-3 flex items-center gap-2.5 hover:bg-[#FFF2F7] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Smile className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] sm:text-[11px] font-medium text-[#55718F] block">Mood</span>
                    <span className="text-xs sm:text-sm font-bold text-[#073B72] truncate block">
                      {dynamicSymptoms.mood || 'Not logged'}
                    </span>
                  </div>
                </div>

                {/* Energy */}
                <div className="bg-[#FFF2F7]/50 border border-[#F7C7D8]/60 rounded-xl p-3 flex items-center gap-2.5 hover:bg-[#FFF2F7] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] sm:text-[11px] font-medium text-[#55718F] block">Energy</span>
                    <span className="text-xs sm:text-sm font-bold text-[#073B72] truncate block">
                      {dynamicSymptoms.energy || 'Not logged'}
                    </span>
                  </div>
                </div>

                {/* Bloating */}
                <div className="bg-[#FFF2F7]/50 border border-[#F7C7D8]/60 rounded-xl p-3 flex items-center gap-2.5 hover:bg-[#FFF2F7] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] sm:text-[11px] font-medium text-[#55718F] block">Bloating</span>
                    <span className="text-xs sm:text-sm font-bold text-[#073B72] truncate block">
                      {dynamicSymptoms.bloating || (hasSymptomsLogged ? 'None' : 'Not logged')}
                    </span>
                  </div>
                </div>

                {/* Cramps */}
                <div className="bg-[#FFF2F7]/50 border border-[#F7C7D8]/60 rounded-xl p-3 flex items-center gap-2.5 hover:bg-[#FFF2F7] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] sm:text-[11px] font-medium text-[#55718F] block">Cramps</span>
                    <span className="text-xs sm:text-sm font-bold text-[#073B72] truncate block">
                      {dynamicSymptoms.cramps || (hasSymptomsLogged ? 'None' : 'Not logged')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Comparison / Insight Banner */}
              <div className="p-3 bg-[#FFF2F7]/60 border border-[#F7C7D8] rounded-xl flex items-center gap-2.5 text-xs text-[#073B72]">
                <div className="w-6 h-6 rounded-full bg-[#F43F7D]/15 text-[#F43F7D] flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] leading-tight text-[#55718F]">
                  {hasSymptomsLogged
                    ? `You have ${symptomRecords?.length} recorded symptom logs. Daily check-ins build accurate clinical cycle trends.`
                    : 'No symptoms logged yet. Check in daily to track how you feel across your cycle.'}
                </p>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.APP.SYMPTOMS)}
                  className="w-full py-2 px-3 rounded-xl border border-[#F7C7D8] bg-[#FFF2F7]/50 hover:bg-[#FFF2F7] text-[#D92F68] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer group"
                >
                  <span>{hasSymptomsLogged ? 'Log Daily Symptoms' : '+ Start Symptom Check-in'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              {/* Sync Footer */}
              <div className="pt-3 border-t border-[#F0DCE5]/70 flex items-center justify-between text-[11px] text-[#55718F]">
                <div className="flex items-center gap-1.5 font-medium truncate">
                  <span className="w-2 h-2 rounded-full border border-[#0E9EAA] flex items-center justify-center shrink-0">
                    <span className="w-1 h-1 rounded-full bg-[#0E9EAA]" />
                  </span>
                  <span>Synced with Symptom Tracking</span>
                </div>
                <span>Updated realtime</span>
              </div>
            </div>
          </div>

          {/* ── CARD 9: Next Best Action (Col Span 4) ── */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-white border border-[#F0DCE5] rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(244,63,125,0.03)] flex flex-col justify-between h-full space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF2F7] border border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] shrink-0">
                    <Target className="w-5 h-5 text-[#F43F7D]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-[#073B72] tracking-tight truncate">
                      Next Best Action
                    </h2>
                    <p className="text-xs text-[#55718F] font-normal truncate mt-0.5">
                      Based on your latest data
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5E8FF] text-[#9333EA] border border-[#E9D5FF] select-none">
                    <span className="text-[10px]">✦</span>
                    <span>AI powered</span>
                  </span>
                  <button type="button" aria-label="Menu" className="p-1 rounded-lg text-[#55718F] hover:text-[#073B72] hover:bg-[#FFF2F7] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Recommendation Content */}
              <div className="flex items-start gap-3.5 py-1">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF2F7] border border-[#F7C7D8] flex items-center justify-center text-[#F43F7D] shrink-0 mt-0.5">
                  <Target className="w-5 h-5 text-[#F43F7D]" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <h4 className="text-sm font-bold text-[#073B72] tracking-tight">
                    {nextBestAction.title}
                  </h4>
                  <p className="text-xs text-[#55718F] leading-relaxed">
                    {nextBestAction.description}
                  </p>
                </div>
              </div>

              {/* Solid Pink Button */}
              <div>
                <button
                  type="button"
                  onClick={() => navigate(nextBestAction.route)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F43F7D] hover:bg-[#D92F68] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                >
                  <span>{nextBestAction.ctaText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              {/* Sync Footer */}
              <div className="pt-3 border-t border-[#F0DCE5]/70 flex items-center justify-between text-[11px] text-[#55718F]">
                <div className="flex items-center gap-1.5 font-medium truncate">
                  <span className="w-2 h-2 rounded-full border border-[#0E9EAA] flex items-center justify-center shrink-0">
                    <span className="w-1 h-1 rounded-full bg-[#0E9EAA]" />
                  </span>
                  <span>Synced with Care Engine</span>
                </div>
                <span className="text-[#0E9EAA] font-semibold">Live recommendation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FemaleDashboardOverview;
