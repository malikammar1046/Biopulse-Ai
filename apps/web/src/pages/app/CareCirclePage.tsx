import React from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Stethoscope } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';

export const CareCirclePage: React.FC = () => {
  const { careCircle, openAiChatWithPrompt } = useUserHealth();

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
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-display text-[#1C1326]">
              Care Circle & Clinical Permissions
            </h1>
          </div>
          <p className="text-xs text-[#584B68] mt-1">
            Control access levels for your physician, reproductive endocrinologist, and family members.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAiChatWithPrompt('How do I connect a new physician to my Care Circle?')}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Connect New Care Member</span>
        </button>
      </div>

      {/* Connected Members */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-4">
        <h2 className="text-base font-bold font-display text-[#1C1326]">
          Connected Health Professionals & Family
        </h2>

        <div className="space-y-4">
          {careCircle.map((contact) => (
            <div
              key={contact.id}
              className="p-5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-[#D8B4FE] bg-[#EDE4F7] flex items-center justify-center shrink-0">
                  {contact.avatar ? (
                    <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                  ) : (
                    <Stethoscope className="w-6 h-6 text-[#6E2D8B]" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-[#1C1326] block">{contact.name}</span>
                  <span className="text-xs text-[#584B68] block">{contact.specialty || contact.role}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#EDE4F7] text-[#6E2D8B]">
                  {contact.accessLevel === 'full' ? 'Full Medical Access' : 'Protected Summary Only'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CareCirclePage;
