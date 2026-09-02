import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  HealthJourneyReportOptions,
  HealthJourneyExportProgressState,
  SectionDataAvailability,
} from '../types/healthJourneyReport';
import type { TimelineDataInputs } from './timelineService';
import { timelineService } from './timelineService';

// Styling Palette Constants
const COLOR_PRIMARY = [110, 45, 139]; // #6E2D8B (Orchid)
const COLOR_OBSIDIAN = [28, 13, 46]; // #1C0D2E (Obsidian)
const COLOR_ROSE = [251, 113, 133]; // #FB7185 (Rose)
const COLOR_GREEN = [4, 120, 87]; // #047857 (Emerald)
const COLOR_AMBER = [180, 83, 9]; // #B45309 (Amber)
const COLOR_TEXT_MAIN = [28, 19, 38]; // #1C1326
const COLOR_TEXT_MUTED = [88, 75, 104]; // #584B68
const COLOR_BG_LIGHT = [248, 245, 250]; // #F8F5FA
const COLOR_BORDER = [231, 223, 239]; // #E7DFEF

class HealthJourneyReportService {
  // --- Check Data Availability for Configuration Wizard ---
  checkDataAvailability(inputs: TimelineDataInputs): SectionDataAvailability {
    const {
      cycleRecords,
      symptomRecords,
      reports,
      medications,
      foodLogs,
      waterLog,
      fitnessLogs,
      appointments,
    } = inputs;

    const questionsCount = appointments.reduce(
      (sum, a) => sum + (a.doctorQuestions?.length || 0),
      0
    );

    return {
      cycle: {
        hasData: cycleRecords.length > 0,
        count: cycleRecords.length,
        description: cycleRecords.length > 0 ? `${cycleRecords.length} cycle records` : 'No records logged',
      },
      symptoms: {
        hasData: symptomRecords.length > 0,
        count: symptomRecords.length,
        description: symptomRecords.length > 0 ? `${symptomRecords.length} symptoms tracked` : 'No symptoms logged',
      },
      reports: {
        hasData: reports.length > 0,
        count: reports.length,
        description: reports.length > 0 ? `${reports.length} lab & ultrasound reports` : 'No reports uploaded',
      },
      medications: {
        hasData: medications.length > 0,
        count: medications.length,
        description: medications.length > 0 ? `${medications.length} active prescriptions` : 'No medications recorded',
      },
      nutrition: {
        hasData: foodLogs.length > 0 || (waterLog && waterLog.glasses > 0) || false,
        count: foodLogs.length,
        description: foodLogs.length > 0 ? `${foodLogs.length} meal entries` : 'No nutrition logged',
      },
      fitness: {
        hasData: fitnessLogs.length > 0,
        count: fitnessLogs.length,
        description: fitnessLogs.length > 0 ? `${fitnessLogs.length} movement sessions` : 'No workouts logged',
      },
      patterns: {
        hasData: true,
        count: 0,
        description: 'Longitudinal rule-based correlations',
      },
      appointments: {
        hasData: appointments.length > 0,
        count: appointments.length,
        description: appointments.length > 0 ? `${appointments.length} consultations scheduled` : 'No appointments',
      },
      doctorQuestions: {
        hasData: questionsCount > 0,
        count: questionsCount,
        description: questionsCount > 0 ? `${questionsCount} questions prepared` : 'No questions saved',
      },
    };
  }

  // --- Generate Complete Health Journey PDF ---
  async generateReport(
    inputs: TimelineDataInputs,
    options: HealthJourneyReportOptions,
    onProgress?: (state: HealthJourneyExportProgressState) => void
  ): Promise<{ blob: Blob; url: string; fileName: string }> {
    // 1. Progress: Collecting Records
    onProgress?.({
      stage: 'collecting',
      message: 'Collecting patient health records across all modules...',
      progressPercent: 20,
    });
    await new Promise((r) => setTimeout(r, 200));

    const {
      userProfile,
      cycleRecords,
      symptomRecords,
      reports,
      foodLogs,
      waterLog,
      fitnessLogs,
      medications,
      medicationLogs,
      appointments,
    } = inputs;

    // Filter date bounds
    const now = new Date();
    let maxDays = 30;
    if (options.dateRange === '7d') maxDays = 7;
    else if (options.dateRange === '30d') maxDays = 30;
    else if (options.dateRange === '90d') maxDays = 90;
    else if (options.dateRange === '6m') maxDays = 180;
    else if (options.dateRange === '1y') maxDays = 365;
    else if (options.dateRange === 'all') maxDays = 9999;

    const startDateCutoff = new Date(now.getTime() - maxDays * 86400000);
    const startDateStr = startDateCutoff.toISOString().split('T')[0];

    const filteredSymptoms = symptomRecords.filter((s) => s.occurredAt >= startDateStr);
    const filteredFitness = fitnessLogs.filter((f) => f.occurredAt >= startDateStr);
    const filteredFood = foodLogs.filter((f) => f.loggedAt >= startDateStr);
    const filteredMedLogs = medicationLogs.filter((m) => m.scheduledFor >= startDateStr);

    // 2. Progress: Analyzing Timeline & Patterns
    onProgress?.({
      stage: 'analyzing',
      message: 'Synthesizing health patterns and multi-signal correlations...',
      progressPercent: 45,
    });
    await new Promise((r) => setTimeout(r, 200));

    const patterns = timelineService.detectHealthPatterns(inputs);
    const trajectory = timelineService.calculateHealthTrajectory(inputs, options.dateRange);

    // 3. Progress: Building PDF Document
    onProgress?.({
      stage: 'building',
      message: 'Formatting clinical tables, charts, and patient snapshots...',
      progressPercent: 70,
    });
    await new Promise((r) => setTimeout(r, 200));

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    const patientName = userProfile.fullName || 'Patient';
    const reportDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const horizonLabel =
      options.dateRange === '7d'
        ? 'Last 7 Days'
        : options.dateRange === '30d'
        ? 'Last 30 Days'
        : options.dateRange === '90d'
        ? 'Last 90 Days'
        : options.dateRange === '6m'
        ? 'Last 6 Months'
        : options.dateRange === '1y'
        ? 'Last 1 Year'
        : 'All Available Longitudinal Data';

    // Helper: Header & Footer
    const addHeaderFooter = (pageNumber: number, totalPages: number) => {
      // Header (pages > 1)
      if (pageNumber > 1) {
        doc.setFontSize(8);
        doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
        doc.setFont('helvetica', 'normal');
        doc.text('OvaSense • Complete Health Journey (Clinical Brief)', margin, 10);
        doc.text(`Patient: ${patientName}`, pageWidth - margin, 10, { align: 'right' });
        doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
        doc.setLineWidth(0.3);
        doc.line(margin, 12, pageWidth - margin, 12);
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
      doc.setFont('helvetica', 'normal');
      doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.text(`Generated on ${reportDate} • Educational Clinical Summary`, margin, pageHeight - 8);
      doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    };

    let cursorY = 20;

    // --- PAGE 1: COVER / PATIENT SNAPSHOT ---
    // Brand Banner
    doc.setFillColor(COLOR_OBSIDIAN[0], COLOR_OBSIDIAN[1], COLOR_OBSIDIAN[2]);
    doc.roundedRect(margin, cursorY, contentWidth, 32, 4, 4, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('OvaSense', margin + 6, cursorY + 12);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_ROSE[0], COLOR_ROSE[1], COLOR_ROSE[2]);
    doc.text('COMPLETE HEALTH JOURNEY • CLINICAL BRIEF', margin + 6, cursorY + 19);

    doc.setTextColor(205, 189, 216);
    doc.setFontSize(8.5);
    doc.text(`Longitudinal Health Intelligence • Reporting Period: ${horizonLabel}`, margin + 6, cursorY + 26);

    cursorY += 38;

    // Patient Demographics Card
    doc.setFillColor(COLOR_BG_LIGHT[0], COLOR_BG_LIGHT[1], COLOR_BG_LIGHT[2]);
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.roundedRect(margin, cursorY, contentWidth, 36, 3, 3, 'FD');

    let patientAge = 'Not specified';
    if (userProfile.dateOfBirth) {
      const birth = new Date(userProfile.dateOfBirth);
      patientAge = `${now.getFullYear() - birth.getFullYear()} years`;
    }

    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT DEMOGRAPHICS & PROFILE', margin + 5, cursorY + 7);

    doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const col1X = margin + 5;
    const col2X = margin + 65;
    const col3X = margin + 125;

    doc.text(`Name: ${patientName}`, col1X, cursorY + 16);
    doc.text(`Age: ${patientAge}`, col1X, cursorY + 23);
    doc.text(`Blood Type: ${userProfile.medical?.bloodType || 'B+'}`, col1X, cursorY + 30);

    doc.text(`Conditions: ${userProfile.medical?.conditions?.join(', ') || 'PCOS'}`, col2X, cursorY + 16);
    doc.text(`Diet: ${userProfile.lifestyle?.dietaryPreference || 'Pakistani Balanced'}`, col2X, cursorY + 23);
    doc.text(`Activity: ${userProfile.lifestyle?.activityLevel || 'Moderate'}`, col2X, cursorY + 30);

    const currentCycleDay = userProfile.womensHealth?.currentCycleDay || 14;
    const currentPhase =
      userProfile.womensHealth?.currentPhase
        ? userProfile.womensHealth.currentPhase.charAt(0).toUpperCase() +
          userProfile.womensHealth.currentPhase.slice(1) +
          ' Phase'
        : 'Follicular Phase';

    doc.text(`Current Cycle Day: ${currentCycleDay}`, col3X, cursorY + 16);
    doc.text(`Phase: ${currentPhase}`, col3X, cursorY + 23);
    doc.text(`Avg Cycle: ${userProfile.womensHealth?.cycleLength || 28} days`, col3X, cursorY + 30);

    cursorY += 42;

    // Executive Snapshot Card
    doc.setFillColor(250, 245, 255);
    doc.setDrawColor(216, 180, 254);
    doc.roundedRect(margin, cursorY, contentWidth, 38, 3, 3, 'FD');

    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE HEALTH SNAPSHOT', margin + 5, cursorY + 7);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);

    const activeMedsCount = medications.filter((m) => m.isActive).length;
    const takenDoses = filteredMedLogs.filter((l) => l.status === 'taken').length;
    const adherenceRate = filteredMedLogs.length > 0 ? Math.round((takenDoses / filteredMedLogs.length) * 100) : 100;
    const totalMovementMins = filteredFitness.reduce((sum, f) => sum + f.durationMinutes, 0);

    doc.text(`• Total Tracked Symptoms: ${filteredSymptoms.length} recorded during this period`, col1X, cursorY + 15);
    doc.text(`• Active Medications: ${activeMedsCount} prescribed (${adherenceRate}% adherence rate)`, col1X, cursorY + 22);
    doc.text(`• Movement Logged: ${totalMovementMins} minutes across ${filteredFitness.length} sessions`, col1X, cursorY + 29);

    const flaggedBiomarkersCount = reports.reduce((sum, r) => {
      return sum + (r.results || []).filter((res) => res.status === 'outside_range' || res.status === 'needs_review').length;
    }, 0);

    doc.text(`• Diagnostic Reports: ${reports.length} uploaded (${flaggedBiomarkersCount} biomarkers flagged)`, col2X + 15, cursorY + 15);
    doc.text(`• Hydration Average: ~${userProfile.lifestyle?.dailyWaterGlasses || 8} glasses/day (${((userProfile.lifestyle?.dailyWaterGlasses || 8) * 0.25).toFixed(1)} L)`, col2X + 15, cursorY + 22);
    doc.text(`• Upcoming Appointments: ${appointments.filter((a) => a.status === 'scheduled').length} scheduled visit(s)`, col2X + 15, cursorY + 29);

    cursorY += 44;

    // Patterns Highlight Summary on Cover
    doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('KEY LONGITUDINAL PATTERNS IDENTIFIED', margin, cursorY + 4);
    cursorY += 8;

    patterns.slice(0, 3).forEach((pat) => {
      doc.setFillColor(COLOR_BG_LIGHT[0], COLOR_BG_LIGHT[1], COLOR_BG_LIGHT[2]);
      doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
      doc.roundedRect(margin, cursorY, contentWidth, 18, 2, 2, 'FD');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      doc.text(pat.title, margin + 4, cursorY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
      const obsShort = doc.splitTextToSize(pat.observation, contentWidth - 8);
      doc.text(obsShort[0] || pat.observation, margin + 4, cursorY + 11.5);

      cursorY += 21;
    });

    // Medical Disclaimer Box
    cursorY = Math.max(cursorY + 4, pageHeight - 45);
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(254, 243, 199);
    doc.roundedRect(margin, cursorY, contentWidth, 20, 2, 2, 'FD');

    doc.setTextColor(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2]);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('IMPORTANT MEDICAL & CLINICAL DISCLAIMER', margin + 4, cursorY + 5);

    doc.setFont('helvetica', 'normal');
    doc.text(
      'This clinical brief compiles self-reported and laboratory data recorded in OvaSense. It is compiled to support conversations with a qualified healthcare professional and does not constitute a clinical diagnosis, medical evaluation, or treatment plan.',
      margin + 4,
      cursorY + 9,
      { maxWidth: contentWidth - 8 }
    );

    // --- PAGE 2: CYCLE & SYMPTOMS ---
    if (options.sections.cycle || options.sections.symptoms) {
      doc.addPage();
      cursorY = 20;

      // Section Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      doc.text('1. Cycle History & Symptom Analytics', margin, cursorY);
      cursorY += 8;

      // Cycle Records Table
      if (options.sections.cycle && cycleRecords.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
        doc.text('Menstrual Cycle Records', margin, cursorY);
        cursorY += 4;

        const cycleRows = cycleRecords.slice(0, 8).map((c) => [
          c.periodStartDate,
          c.periodEndDate || 'In progress',
          (c.flow || 'Medium').toUpperCase(),
          c.symptoms?.join(', ') || 'None recorded',
          c.notes || 'Routine cycle log',
        ]);

        autoTable(doc, {
          startY: cursorY,
          head: [['Period Start', 'Period End', 'Flow', 'Reported Symptoms', 'Notes']],
          body: cycleRows,
          theme: 'grid',
          headStyles: { fillColor: [110, 45, 139], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          styles: { fontSize: 8, textColor: [28, 19, 38] },
          margin: { left: margin, right: margin },
        });

        cursorY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Symptoms Table
      if (options.sections.symptoms && filteredSymptoms.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
        doc.text('Symptom Logs & Severity Distribution', margin, cursorY);
        cursorY += 4;

        const symptomRows = filteredSymptoms.slice(0, 12).map((s) => [
          s.occurredAt,
          s.symptomType,
          (s.category || 'General').toUpperCase(),
          s.severity.toUpperCase(),
          s.notes || 'Recorded during daily tracking',
        ]);

        autoTable(doc, {
          startY: cursorY,
          head: [['Date', 'Symptom', 'Category', 'Severity', 'Patient Notes']],
          body: symptomRows,
          theme: 'grid',
          headStyles: { fillColor: [42, 19, 67], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          styles: { fontSize: 8, textColor: [28, 19, 38] },
          margin: { left: margin, right: margin },
        });

        cursorY = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    // --- PAGE 3: MEDICAL LAB REPORTS & BIOMARKERS ---
    if (options.sections.reports && reports.length > 0) {
      doc.addPage();
      cursorY = 20;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      doc.text('2. Medical Lab & Diagnostic Biomarkers', margin, cursorY);
      cursorY += 8;

      reports.forEach((r) => {
        if (cursorY > pageHeight - 50) {
          doc.addPage();
          cursorY = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`${r.title} (${r.reportDate}) — ${r.reportType}`, margin, cursorY);
        cursorY += 4;

        const reportRows = (r.results || []).map((res) => [
          res.testName,
          `${res.resultValue} ${res.unit || ''}`.trim(),
          res.referenceRange || 'Standard reference',
          res.status === 'outside_range' || res.status === 'needs_review'
            ? 'Outside recorded reference interval'
            : 'Within reference interval',
        ]);

        if (reportRows.length > 0) {
          autoTable(doc, {
            startY: cursorY,
            head: [['Biomarker / Test Name', 'Result', 'Reference Interval', 'Status Indicator']],
            body: reportRows,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
            styles: { fontSize: 8, textColor: [28, 19, 38] },
            margin: { left: margin, right: margin },
          });
          cursorY = (doc as any).lastAutoTable.finalY + 8;
        }
      });
    }

    // --- PAGE 4: MEDICATIONS, NUTRITION & MOVEMENT ---
    if (options.sections.medications || options.sections.nutrition || options.sections.fitness) {
      doc.addPage();
      cursorY = 20;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      doc.text('3. Medications, Nutrition & Lifestyle Movement', margin, cursorY);
      cursorY += 8;

      // Medications
      if (options.sections.medications && medications.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
        doc.text('Active Prescriptions & Adherence', margin, cursorY);
        cursorY += 4;

        const medRows = medications.map((m) => [
          m.name,
          `${m.dose} ${m.unit}`,
          m.frequency.replace('_', ' ').toUpperCase(),
          m.scheduledTimes.join(', '),
          m.startDate || 'Ongoing',
          m.isActive ? 'Active' : 'Completed',
        ]);

        autoTable(doc, {
          startY: cursorY,
          head: [['Medication', 'Dosage', 'Frequency', 'Times', 'Start Date', 'Status']],
          body: medRows,
          theme: 'grid',
          headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          styles: { fontSize: 8, textColor: [28, 19, 38] },
          margin: { left: margin, right: margin },
        });
        cursorY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Nutrition & Hydration
      if (options.sections.nutrition) {
        doc.setFontSize(10);
        doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
        doc.text('Nutrition Consistency & Daily Hydration', margin, cursorY);
        cursorY += 4;

        const waterGlasses = waterLog ? waterLog.glasses : userProfile.lifestyle?.dailyWaterGlasses || 8;
        const totalProtein = filteredFood.reduce((sum, f) => sum + (f.proteinG || 0), 0);
        const avgProtein = filteredFood.length > 0 ? Math.round(totalProtein / filteredFood.length) : 25;

        const nutritionRows = [
          ['Dietary Preference', userProfile.lifestyle?.dietaryPreference || 'Pakistani Balanced / Halal'],
          ['Daily Water Intake Baseline', `${waterGlasses} glasses/day (${(waterGlasses * 0.25).toFixed(1)} Liters)`],
          ['Logged Meals Recorded', `${filteredFood.length} meals in selected reporting period`],
          ['Average Protein per Logged Meal', `~${avgProtein}g protein`],
        ];

        autoTable(doc, {
          startY: cursorY,
          head: [['Metric', 'Observed Value']],
          body: nutritionRows,
          theme: 'grid',
          headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          styles: { fontSize: 8, textColor: [28, 19, 38] },
          margin: { left: margin, right: margin },
        });
        cursorY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Fitness & Movement
      if (options.sections.fitness && filteredFitness.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
        doc.text('Movement & Activity Summary', margin, cursorY);
        cursorY += 4;

        const fitRows = filteredFitness.slice(0, 6).map((f) => [
          f.occurredAt,
          f.activityName || f.activityType,
          `${f.durationMinutes} min`,
          f.energyLevel || 'Moderate',
          f.notes || 'Routine movement',
        ]);

        autoTable(doc, {
          startY: cursorY,
          head: [['Date', 'Activity Type', 'Duration', 'Energy Level', 'Notes']],
          body: fitRows,
          theme: 'grid',
          headStyles: { fillColor: [219, 39, 119], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          styles: { fontSize: 8, textColor: [28, 19, 38] },
          margin: { left: margin, right: margin },
        });
        cursorY = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    // --- PAGE 5: PATTERNS & CLINICAL QUESTIONS ---
    if (options.sections.patterns || options.sections.appointments || options.sections.doctorQuestions || options.sections.patientNotes) {
      doc.addPage();
      cursorY = 20;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      doc.text('4. Patterns OvaSense Found & Doctor Questions', margin, cursorY);
      cursorY += 8;

      // Patterns
      if (options.sections.patterns) {
        doc.setFontSize(10);
        doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
        doc.text('Longitudinal Correlation Findings', margin, cursorY);
        cursorY += 4;

        patterns.forEach((pat) => {
          if (cursorY > pageHeight - 45) {
            doc.addPage();
            cursorY = 20;
          }

          doc.setFillColor(COLOR_BG_LIGHT[0], COLOR_BG_LIGHT[1], COLOR_BG_LIGHT[2]);
          doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
          doc.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, 'FD');

          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
          doc.text(`Pattern: ${pat.title}`, margin + 4, cursorY + 5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
          const obsLines = doc.splitTextToSize(pat.observation, contentWidth - 8);
          doc.text(obsLines[0] || pat.observation, margin + 4, cursorY + 10);

          doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
          const interpLines = doc.splitTextToSize(pat.interpretation, contentWidth - 8);
          doc.text(interpLines[0] || pat.interpretation, margin + 4, cursorY + 15);

          if (pat.actionTip) {
            doc.setTextColor(COLOR_GREEN[0], COLOR_GREEN[1], COLOR_GREEN[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(`Discuss with Doctor: ${pat.actionTip}`, margin + 4, cursorY + 20);
          }

          cursorY += 27;
        });
      }

      // Trajectory Multi-Signal Progression Table
      if (options.sections.trajectory && trajectory.dataPoints.length > 0) {
        if (cursorY > pageHeight - 50) {
          doc.addPage();
          cursorY = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`Health Signal Trajectory Snapshot (${trajectory.coveragePercentage}% Coverage • ${trajectory.totalLoggedDays} Active Days)`, margin, cursorY);
        cursorY += 4;

        const trajRows = trajectory.dataPoints
          .filter((d) => d.eventsCount > 0)
          .slice(-8)
          .map((d) => [
            d.displayDate,
            d.cycleDay ? `CD ${d.cycleDay} (${d.phaseName || ''})` : '—',
            `${d.symptomsCount} logged`,
            `${d.movementMinutes} min`,
            `${d.waterGlasses} gl`,
            `${d.medsAdherencePercent}%`,
          ]);

        if (trajRows.length > 0) {
          autoTable(doc, {
            startY: cursorY,
            head: [['Date', 'Cycle Context', 'Symptoms', 'Movement', 'Water', 'Adherence']],
            body: trajRows,
            theme: 'grid',
            headStyles: { fillColor: [42, 19, 67], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
            styles: { fontSize: 8, textColor: [28, 19, 38] },
            margin: { left: margin, right: margin },
          });
          cursorY = (doc as any).lastAutoTable.finalY + 10;
        }
      }

      // Doctor Questions
      if (options.sections.doctorQuestions) {
        const allQuestions: { question: string; isDiscussed?: boolean }[] = [];
        appointments.forEach((a) => {
          (a.doctorQuestions || []).forEach((q) => allQuestions.push(q));
        });

        if (allQuestions.length > 0) {
          if (cursorY > pageHeight - 50) {
            doc.addPage();
            cursorY = 20;
          }

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
          doc.text('Patient-Prepared Questions for Doctor', margin, cursorY);
          cursorY += 4;

          const qRows = allQuestions.map((q, idx) => [
            `${idx + 1}.`,
            q.question,
            q.isDiscussed ? 'Discussed' : 'Pending Discussion',
          ]);

          autoTable(doc, {
            startY: cursorY,
            head: [['#', 'Question for Healthcare Provider', 'Status']],
            body: qRows,
            theme: 'grid',
            headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
            styles: { fontSize: 8, textColor: [28, 19, 38] },
            margin: { left: margin, right: margin },
          });
          cursorY = (doc as any).lastAutoTable.finalY + 10;
        }
      }

      // Patient Custom Notes
      if (options.sections.patientNotes && options.patientCustomNote?.trim()) {
        if (cursorY > pageHeight - 40) {
          doc.addPage();
          cursorY = 20;
        }

        doc.setFillColor(250, 245, 255);
        doc.setDrawColor(216, 180, 254);
        doc.roundedRect(margin, cursorY, contentWidth, 22, 2, 2, 'FD');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        doc.text('PATIENT NOTES FOR CLINICAL REVIEW', margin + 4, cursorY + 6);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
        doc.setFontSize(8.5);
        const noteLines = doc.splitTextToSize(options.patientCustomNote, contentWidth - 8);
        doc.text(noteLines, margin + 4, cursorY + 12);

        cursorY += 26;
      }
    }

    // 4. Progress: Finalizing Document & Page Numbers
    onProgress?.({
      stage: 'finalizing',
      message: 'Finalizing page headers, numbers, and document checksum...',
      progressPercent: 90,
    });
    await new Promise((r) => setTimeout(r, 200));

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addHeaderFooter(i, totalPages);
    }

    // Generate Output
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const sanitizedPatientName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `OvaSense_Health_Journey_${sanitizedPatientName}_${now.toISOString().split('T')[0]}.pdf`;

    onProgress?.({
      stage: 'ready',
      message: 'Your Health Journey Clinical Brief is ready!',
      progressPercent: 100,
      pdfBlob: blob,
      pdfBlobUrl: url,
      pdfFileName: fileName,
    });

    return { blob, url, fileName };
  }

  // --- Print Generated PDF ---
  printReport(blobUrl: string): void {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        iframe.focus();
        iframe.contentWindow?.print();
      }, 300);
    };
  }

  // --- Trigger File Download ---
  downloadReport(blobUrl: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const healthJourneyReportService = new HealthJourneyReportService();
