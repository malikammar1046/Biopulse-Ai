import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Settings, User, RefreshCw } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { ROUTES } from '../../constants/routes';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, resetToDefaultProfile } = useUserHealth();

  const handleRestartOnboarding = () => {
    navigate(ROUTES.ONBOARDING);
  };

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
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-display text-[#1C1326]">
              Account & Health Profile Settings
            </h1>
          </div>
          <p className="text-xs text-[#584B68] mt-1">
            Manage your personal data, update health baselines, or restart your onboarding journey.
          </p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#F0EAF5]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D8B4FE] bg-[#EDE4F7] flex items-center justify-center shrink-0">
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt={userProfile.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-[#6E2D8B]" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-[#1C1326]">{userProfile.fullName}</h2>
              <span className="text-xs text-[#584B68] block">{userProfile.email}</span>
              <span className="text-[10px] font-mono text-[#8E3EAF]">{userProfile.phone}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRestartOnboarding}
            className="px-5 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Update Health Profile (Onboarding)</span>
          </button>
        </div>

        {/* Configuration Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-1">
            <span className="font-mono text-[#8D7E9E] block uppercase text-[10px]">Cycle Protocol</span>
            <span className="font-bold text-[#1C1326] block">
              {typeof userProfile.womensHealth.cycleLength === 'number'
                ? `${userProfile.womensHealth.cycleLength} Days (${userProfile.womensHealth.periodRegularity})`
                : 'Irregular Rhythm'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-1">
            <span className="font-mono text-[#8D7E9E] block uppercase text-[10px]">Dietary Baseline</span>
            <span className="font-bold text-[#1C1326] block">
              {userProfile.lifestyle.dietaryPreference}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-1">
            <span className="font-mono text-[#8D7E9E] block uppercase text-[10px]">Emergency Contact</span>
            <span className="font-bold text-[#1C1326] block">
              {userProfile.emergencyContacts[0]?.name} ({userProfile.emergencyContacts[0]?.relationship})
            </span>
          </div>
        </div>

        {/* Reset / Clear Demo Storage */}
        <div className="pt-4 border-t border-[#F0EAF5] flex items-center justify-between">
          <span className="text-xs text-[#8D7E9E]">
            Reset local demo state to default Ayesha Khan profile
          </span>
          <button
            type="button"
            onClick={resetToDefaultProfile}
            className="text-xs text-[#FB7185] hover:underline font-semibold cursor-pointer"
          >
            Reset Demo Profile
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
