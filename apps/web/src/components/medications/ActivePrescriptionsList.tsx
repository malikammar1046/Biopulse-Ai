import React from 'react';
import { motion } from 'framer-motion';
import { MedicalCross, Plus, Edit01, Trash01, PauseCircle, PlayCircle } from '@untitledui/icons';
import type { MedicationItem } from '../../types/medication';

interface ActivePrescriptionsListProps {
  medications: MedicationItem[];
  onOpenAddModal: () => void;
  onEditMedication: (med: MedicationItem) => void;
  onToggleActive: (med: MedicationItem) => void;
  onDeleteMedication: (id: string) => void;
  isMale?: boolean;
}

export const ActivePrescriptionsList: React.FC<ActivePrescriptionsListProps> = ({
  medications,
  onOpenAddModal,
  onEditMedication,
  onToggleActive,
  onDeleteMedication,
  isMale,
}) => {
  const accentColor = isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]';

  return (
    <div className={`p-6 sm:p-8 rounded-2xl bg-white shadow-xs select-none text-left space-y-4 border ${
      isMale ? 'border-[#BAE6FD]' : 'border-[#EAECF0]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MedicalCross className={`w-5 h-5 ${accentColor}`} aria-hidden="true" />
          <div>
            <h3 className="text-base font-bold font-display text-[#0F172A]">
              Your Medicine & Supplement List ({medications.length})
            </h3>
            <p className="text-xs text-[#64748B]">
              Manage daily prescriptions and inositol supplements
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className={`text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer ${
            isMale ? 'text-[#0288D1] hover:text-[#0277BD]' : 'text-[#DC326C] hover:text-[#B82558]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>+ Add Medicine</span>
        </button>
      </div>

      {medications.length > 0 ? (
        <div className={`divide-y divide-[#EAECF0] border rounded-xl overflow-hidden bg-white ${
          isMale ? 'border-[#BAE6FD]' : 'border-[#EAECF0]'
        }`}>
          {medications.map((med) => (
            <motion.div
              key={med.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                isMale ? 'hover:bg-[#F0F9FF]' : 'hover:bg-[#FDE6EF]/20'
              }`}
            >
              {/* Left Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[#0F172A]">
                    {med.name}
                  </span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                    isMale ? 'bg-[#E0F2FE] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#DC326C]'
                  }`}>
                    {med.dose} {med.unit}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                      med.isActive
                        ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                        : 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]'
                    }`}
                  >
                    {med.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-[#64748B] font-mono flex-wrap">
                  <span className="capitalize">{med.frequency.replace('_', ' ')}</span>
                  <span>• Times: {med.scheduledTimes.join(', ')}</span>
                  {med.notes && <span>• Note: {med.notes}</span>}
                </div>
              </div>

              {/* Right Action Controls */}
              <div className="flex items-center gap-1.5 shrink-0 justify-end">
                {/* Pause / Resume Button */}
                <button
                  type="button"
                  onClick={() => onToggleActive(med)}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    med.isActive
                      ? 'text-[#6B7280] hover:bg-[#F3F4F6]'
                      : 'text-[#059669] hover:bg-[#ECFDF5]'
                  }`}
                  title={med.isActive ? 'Pause medicine' : 'Resume medicine'}
                  aria-label={med.isActive ? 'Pause medicine' : 'Resume medicine'}
                >
                  {med.isActive ? (
                    <PauseCircle className="w-4 h-4 text-[#64748B]" aria-hidden="true" />
                  ) : (
                    <PlayCircle className="w-4 h-4 text-[#059669]" aria-hidden="true" />
                  )}
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => onEditMedication(med)}
                  className={`p-1.5 rounded-lg text-[#64748B] transition-colors cursor-pointer ${
                    isMale ? 'hover:text-[#0288D1] hover:bg-[#F0F9FF]' : 'hover:text-[#F43F7D] hover:bg-[#FDE6EF]'
                  }`}
                  title="Edit medicine"
                  aria-label="Edit medicine"
                >
                  <Edit01 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => onDeleteMedication(med.id)}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                  title="Delete medicine"
                  aria-label="Delete medicine"
                >
                  <Trash01 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={`p-8 rounded-2xl bg-[#F8FAFC] border border-dashed text-center space-y-2 ${
          isMale ? 'border-[#BAE6FD]' : 'border-[#EAECF0]'
        }`}>
          <p className="text-xs text-[#64748B]">
            No medicines or supplements added yet.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className={`text-xs font-bold hover:underline cursor-pointer ${
              isMale ? 'text-[#0288D1]' : 'text-[#DC326C]'
            }`}
          >
            + Add your first medicine
          </button>
        </div>
      )}
    </div>
  );
};
