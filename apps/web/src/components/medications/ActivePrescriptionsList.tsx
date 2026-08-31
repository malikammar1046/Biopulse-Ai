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
    <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm select-none text-left space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
            <Pill className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-bold font-display text-[#1C1326]">
              Your Medicine & Supplement List ({medications.length})
            </h3>
            <p className="text-xs text-[#584B68]">
              Manage daily prescriptions and inositol supplements
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Medicine</span>
        </button>
      </div>

      {medications.length > 0 ? (
        <div className="divide-y divide-[#F5F0FA] border border-[#E7DFEF] rounded-2xl overflow-hidden bg-white">
          {medications.map((med) => (
            <motion.div
              key={med.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF5FF] transition-all"
            >
              {/* Left Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[#1C1326]">
                    {med.name}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#EDE4F7] text-[#6E2D8B]">
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

                <div className="flex items-center gap-3 text-[11px] text-[#8D7E9E] font-mono flex-wrap">
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
                    <PauseCircle className="w-4 h-4 text-[#8D7E9E]" />
                  ) : (
                    <PlayCircle className="w-4 h-4 text-[#059669]" />
                  )}
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => onEditMedication(med)}
                  className="p-1.5 rounded-lg text-[#8D7E9E] hover:text-[#6E2D8B] hover:bg-[#EDE4F7] transition-colors cursor-pointer"
                  title="Edit medicine"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => onDeleteMedication(med.id)}
                  className="p-1.5 rounded-lg text-[#8D7E9E] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-colors cursor-pointer"
                  title="Delete medicine"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-[#F8F5FA] border border-dashed border-[#D8B4FE] text-center space-y-2">
          <p className="text-xs text-[#584B68]">
            No medicines or supplements added yet.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="text-xs font-bold text-[#6E2D8B] hover:underline"
          >
            + Add your first medicine
          </button>
        </div>
      )}
    </div>
  );
};
