import React from 'react';
import { motion } from 'framer-motion';
import { Pill, Plus, Edit2, Trash2, PauseCircle, PlayCircle } from 'lucide-react';
import type { MedicationItem } from '../../types/medication';

interface ActivePrescriptionsListProps {
  medications: MedicationItem[];
  onOpenAddModal: () => void;
  onEditMedication: (med: MedicationItem) => void;
  onToggleActive: (med: MedicationItem) => void;
  onDeleteMedication: (id: string) => void;
}

export const ActivePrescriptionsList: React.FC<ActivePrescriptionsListProps> = ({
  medications,
  onOpenAddModal,
  onEditMedication,
  onToggleActive,
  onDeleteMedication,
}) => {
  return (
    <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#BAE6FD] shadow-sm select-none text-left space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#F0F9FF] text-[#0288D1]">
            <Pill className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-bold font-display text-[#0F172A]">
              Your Medicine & Supplement List ({medications.length})
            </h3>
            <p className="text-xs text-[#475569]">
              Manage daily prescriptions and inositol supplements
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="text-xs font-bold text-[#0288D1] hover:text-[#0277BD] transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Medicine</span>
        </button>
      </div>

      {medications.length > 0 ? (
        <div className="divide-y divide-[#E2E8F0] border border-[#BAE6FD] rounded-2xl overflow-hidden bg-white">
          {medications.map((med) => (
            <motion.div
              key={med.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F0F9FF] transition-all"
            >
              {/* Left Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[#0F172A]">
                    {med.name}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#E0F2FE] text-[#0288D1]">
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
                >
                  {med.isActive ? (
                    <PauseCircle className="w-4 h-4 text-[#64748B]" />
                  ) : (
                    <PlayCircle className="w-4 h-4 text-[#059669]" />
                  )}
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => onEditMedication(med)}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0288D1] hover:bg-[#F0F9FF] transition-colors cursor-pointer"
                  title="Edit medicine"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => onDeleteMedication(med.id)}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                  title="Delete medicine"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-[#F8FAFC] border border-dashed border-[#BAE6FD] text-center space-y-2">
          <p className="text-xs text-[#475569]">
            No medicines or supplements added yet.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="text-xs font-bold text-[#0288D1] hover:underline cursor-pointer"
          >
            + Add your first medicine
          </button>
        </div>
      )}
    </div>
  );
};
