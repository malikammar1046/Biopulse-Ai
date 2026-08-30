import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Plus } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';

export const SymptomsPage: React.FC = () => {
  const { userProfile, snapshotMetrics, openAiChatWithPrompt } = useUserHealth();
  const recordedSymptoms = userProfile.womensHealth?.commonSymptoms || [];

  const dynamicLogs = recordedSymptoms.map((sym, idx) => ({
    id: `sym_${idx}`,
    symptom: sym,
    severity: 'Mild',
    phase: snapshotMetrics.phaseName.replace(' Phase', ''),
    date: 'Active baseline',
    notes: 'Recorded in personal health profile.',
  }));

  const displayLogs =
    dynamicLogs.length > 0
      ? dynamicLogs
      : [
          {
            id: '1',
            symptom: 'No active symptom flares recorded',
            severity: 'Baseline',
            phase: snapshotMetrics.phaseName.replace(' Phase', ''),
            date: 'Today',
            notes: 'Record symptoms to identify longitudinal correlations.',
          },
        ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 text-left select-none pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DFEF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#FDF2F8] text-[#FB7185]">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-display text-[#1C1326]">
              Symptom Trajectories & Logging
            </h1>
          </div>
          <p className="text-xs text-[#584B68] mt-1">
            Correlating daily biometric sensations with follicular and hormonal patterns.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAiChatWithPrompt('Log a new symptom for today')}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#8E3EAF] to-[#FB7185] hover:brightness-110 shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Log New Symptom</span>
        </button>
      </div>

      {/* Symptom History List */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-4">
        <h2 className="text-base font-bold font-display text-[#1C1326]">
          Recent Symptom Logs
        </h2>

        <div className="space-y-3">
          {displayLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1C1326]">{log.symptom}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EDE4F7] text-[#6E2D8B]">
                    {log.severity}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[#8D7E9E]">
                    {log.phase} Phase
                  </span>
                </div>
                <p className="text-xs text-[#584B68]">{log.notes}</p>
              </div>

              <span className="text-[11px] font-mono text-[#8D7E9E] shrink-0">
                {log.date}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SymptomsPage;
