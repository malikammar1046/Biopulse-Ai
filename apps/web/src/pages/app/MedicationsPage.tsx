import React from 'react';
import { motion } from 'framer-motion';
import { Pill, Plus } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';

export const MedicationsPage: React.FC = () => {
  const { userProfile, openAiChatWithPrompt } = useUserHealth();

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
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <Pill className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-display text-[#1C1326]">
              Medications & Supplements
            </h1>
          </div>
          <p className="text-xs text-[#584B68] mt-1">
            Active prescriptions, inositol protocols, and adherence tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAiChatWithPrompt('Add a new supplement to my daily medication regimen')}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medication</span>
        </button>
      </div>

      {/* Regimen List */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-4">
        <h2 className="text-base font-bold font-display text-[#1C1326]">
          Current Daily Regimen
        </h2>

        {userProfile.medical?.medications && userProfile.medical.medications.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userProfile.medical.medications.map((med) => (
              <div
                key={med.id}
                className="p-5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1C1326]">{med.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EDE4F7] text-[#6E2D8B] font-bold">
                      {med.dosage}
                    </span>
                  </div>
                  <p className="text-xs text-[#584B68]">{med.frequency} • {med.timeOfDay || 'Morning'}</p>
                </div>

                <span className="text-xs font-mono font-bold text-[#047857] bg-[#ECFDF5] px-2.5 py-1 rounded-full">
                  Active
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[#F8F5FA] border border-dashed border-[#E7DFEF] text-center space-y-3">
            <p className="text-sm font-semibold text-[#584B68]">
              No medications or supplements currently recorded in your profile.
            </p>
            <button
              type="button"
              onClick={() => openAiChatWithPrompt('Help me add a medication or supplement to my regimen')}
              className="px-4 py-2 rounded-2xl bg-[#6E2D8B] text-white text-xs font-bold shadow-xs hover:bg-[#8E3EAF] transition-colors cursor-pointer"
            >
              + Add Medication or Supplement
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MedicationsPage;
