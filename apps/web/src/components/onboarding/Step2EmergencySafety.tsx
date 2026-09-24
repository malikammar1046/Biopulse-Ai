import React, { useState } from 'react';
import { ShieldTick, User01, Phone01, HeartHand, Plus, Trash01 } from '@untitledui/icons';
import type { EmergencyContact } from '../../types/onboarding';

interface Step2Props {
  contacts: EmergencyContact[];
  onChange: (contacts: EmergencyContact[]) => void;
  errors: Record<string, string>;
}

const RELATIONSHIP_PRESETS = ['Partner / Spouse', 'Parent', 'Sibling', 'Close Friend', 'Guardian', 'Other'];

export const Step2EmergencySafety: React.FC<Step2Props> = ({ contacts, onChange, errors }) => {
  const [showSecondary, setShowSecondary] = useState(contacts.length > 1);

  const primaryContact = contacts[0] || {
    name: '',
    relationship: 'Partner / Spouse',
    phone: '',
    isPrimary: true,
  };

  const secondaryContact = contacts[1] || {
    name: '',
    relationship: 'Close Friend',
    phone: '',
    isPrimary: false,
  };

  const updatePrimary = (field: keyof EmergencyContact, value: string) => {
    const updated = [...contacts];
    updated[0] = { ...primaryContact, [field]: value, isPrimary: true };
    onChange(updated);
  };

  const updateSecondary = (field: keyof EmergencyContact, value: string) => {
    const updated = [...contacts];
    if (updated.length < 2) {
      updated.push({ ...secondaryContact, [field]: value, isPrimary: false });
    } else {
      updated[1] = { ...updated[1], [field]: value, isPrimary: false };
    }
    onChange(updated);
  };

  const handleToggleSecondary = () => {
    if (showSecondary) {
      // Remove secondary
      const updated = [contacts[0]];
      onChange(updated);
      setShowSecondary(false);
    } else {
      setShowSecondary(true);
      if (contacts.length < 2) {
        onChange([contacts[0], secondaryContact]);
      }
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
          Emergency & Care Circle.
        </h2>
        <p className="text-sm text-[#CDBDD8] font-sans">
          Designate trusted contacts who can be reached if you ever log acute health concerns or severe pain alerts.
        </p>
      </div>

      {/* Primary Emergency Contact Card (Required) */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldTick className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
            <h3 className="text-sm font-bold font-display text-white">
              Primary Emergency Contact
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#0288D1]/20 text-[#29B6F6] font-bold">
            Required
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider">
              Contact Full Name <span className="text-[#FB7185]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Zubair Khan"
                value={primaryContact.name}
                onChange={(e) => updatePrimary('name', e.target.value)}
                className={`w-full px-4 py-3 pl-10 rounded-2xl bg-[#140924] border text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#0288D1] transition-all ${
                  errors.primaryName ? 'border-[#FB7185]' : 'border-white/15'
                }`}
              />
              <User01 className="w-4 h-4 text-[#A797BD] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            </div>
            {errors.primaryName && <p className="text-xs text-[#FB7185] font-medium">{errors.primaryName}</p>}
          </div>

          {/* Relationship */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider">
              Relationship <span className="text-[#FB7185]">*</span>
            </label>
            <div className="relative">
              <select
                value={primaryContact.relationship}
                onChange={(e) => updatePrimary('relationship', e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-2xl bg-[#140924] border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0288D1] transition-all cursor-pointer"
              >
                {RELATIONSHIP_PRESETS.map((rel) => (
                  <option key={rel} value={rel} className="bg-[#180A26] text-white">
                    {rel}
                  </option>
                ))}
              </select>
              <HeartHand className="w-4 h-4 text-[#A797BD] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider">
              Contact Phone <span className="text-[#FB7185]">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                placeholder="+92 321 7654321"
                value={primaryContact.phone}
                onChange={(e) => updatePrimary('phone', e.target.value)}
                className={`w-full px-4 py-3 pl-10 rounded-2xl bg-[#140924] border text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#0288D1] transition-all ${
                  errors.primaryPhone ? 'border-[#FB7185]' : 'border-white/15'
                }`}
              />
              <Phone01 className="w-4 h-4 text-[#A797BD] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            </div>
            {errors.primaryPhone && <p className="text-xs text-[#FB7185] font-medium">{errors.primaryPhone}</p>}
          </div>
        </div>
      </div>

      {/* Optional Secondary Emergency Contact Toggle */}
      {!showSecondary ? (
        <button
          type="button"
          onClick={handleToggleSecondary}
          className="w-full p-4 rounded-3xl border border-dashed border-white/20 hover:border-[#0288D1] text-xs font-semibold text-[#EDE4F7] hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer bg-white/[0.02]"
        >
          <Plus className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
          <span>Add Secondary Emergency Contact (Optional)</span>
        </button>
      ) : (
        <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldTick className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
              <h3 className="text-sm font-bold font-display text-white">
                Secondary Emergency Contact
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#29B6F6]">
                Optional
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleSecondary}
              className="text-xs text-[#FB7185] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Trash01 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Remove</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider">
                Contact Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Fatima Khan"
                value={secondaryContact.name}
                onChange={(e) => updateSecondary('name', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#140924] border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#0288D1]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider">
                Relationship
              </label>
              <select
                value={secondaryContact.relationship}
                onChange={(e) => updateSecondary('relationship', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#140924] border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0288D1]"
              >
                {RELATIONSHIP_PRESETS.map((rel) => (
                  <option key={rel} value={rel} className="bg-[#180A26] text-white">
                    {rel}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+92 333 9876543"
                value={secondaryContact.phone}
                onChange={(e) => updateSecondary('phone', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#140924] border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#0288D1]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
