import React, { useState } from 'react';
import {
  LogOut01,
  Trash01,
  Download01,
  RefreshCw01,
  AlertTriangle,
  File01,
  CheckCircle,
} from '@untitledui/icons';
import type { UserProfile, EmergencyContact } from '../../../../types/onboarding';
import { downloadHealthSummaryPdf } from '../../../../services/healthSummaryPdfService';

interface AccountTabProps {
  draft: UserProfile;
  setDraft: React.Dispatch<React.SetStateAction<UserProfile>>;
  onLogout: () => void;
  onRestartOnboarding: () => void;
  onOpenDeleteModal: () => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({
  draft,
  setDraft,
  onLogout,
  onRestartOnboarding,
  onOpenDeleteModal,
}) => {
  const [downloadPdfLoading, setDownloadPdfLoading] = useState(false);
  const [downloadPdfSuccess, setDownloadPdfSuccess] = useState(false);
  const [downloadPdfError, setDownloadPdfError] = useState<string | null>(null);

  const primaryContact: EmergencyContact = draft.emergencyContacts?.[0] || {
    name: '',
    relationship: 'Partner / Spouse',
    phone: '',
    isPrimary: true,
  };

  const updatePrimary = (field: keyof EmergencyContact, val: string) => {
    const list = [...(draft.emergencyContacts || [])];
    list[0] = { ...primaryContact, [field]: val, isPrimary: true };
    setDraft((p) => ({ ...p, emergencyContacts: list }));
  };

  const handleDownloadPdf = async () => {
    if (downloadPdfLoading) return; // Prevent duplicate requests
    setDownloadPdfLoading(true);
    setDownloadPdfError(null);
    try {
      await downloadHealthSummaryPdf();
      setDownloadPdfSuccess(true);
      setTimeout(() => setDownloadPdfSuccess(false), 3500);
    } catch (err: any) {
      setDownloadPdfError(err?.message || 'Unable to generate PDF report. Please try again.');
    } finally {
      setDownloadPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Account Credentials & Security */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">Account Credentials</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Authentication details and security credentials
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <LogOut01 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Account Email
            </label>
            <input
              type="text"
              value={draft.email || ''}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password & Security
            </label>
            <div className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 flex items-center justify-between">
              <span>••••••••••••</span>
              <span className="text-[11px] text-[#0288D1] font-semibold">
                Protected via Supabase Auth
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Safety & Emergency Contact */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Safety & Emergency Contact</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Trusted point of contact used for red-flag escalation or appointment summaries
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contact Name
            </label>
            <input
              type="text"
              value={primaryContact.name || ''}
              onChange={(e) => updatePrimary('name', e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0288D1]/20 focus:border-[#0288D1]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Relationship
            </label>
            <select
              value={primaryContact.relationship || 'Partner / Spouse'}
              onChange={(e) => updatePrimary('relationship', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0288D1]/20 focus:border-[#0288D1] bg-white"
            >
              <option value="Partner / Spouse">Partner / Spouse</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Physician / Care Team">Physician / Care Team</option>
              <option value="Friend">Close Friend</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contact Phone
            </label>
            <input
              type="tel"
              value={primaryContact.phone || ''}
              onChange={(e) => updatePrimary('phone', e.target.value)}
              placeholder="e.g. +92 300 9876543"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0288D1]/20 focus:border-[#0288D1]"
            />
          </div>
        </div>
      </div>

      {/* 3. Data Privacy & Export */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Data Portability & Clinical Privacy</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Export your structured health records or re-execute clinical onboarding
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Download PDF Health Summary */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#F5FBFD] to-white border border-[#D7EAF2] flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#073B72] flex items-center gap-1.5">
                  <File01 className="w-3.5 h-3.5 text-[#16B8C4]" aria-hidden="true" />
                  Health Summary (PDF)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#16B8C4]/15 text-[#073B72]">
                  Clinical Report
                </span>
              </div>
              <p className="text-[11px] text-[#55718F] leading-relaxed mb-3">
                Download a structured, clinical-grade multi-page PDF summary of your vitals, screening results, SHAP factors, symptoms, and medications.
              </p>
              {downloadPdfError && (
                <div className="mb-3 p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" aria-hidden="true" />
                  <span>{downloadPdfError}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadPdfLoading}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                downloadPdfLoading
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : downloadPdfSuccess
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-[#073B72] text-white hover:bg-[#073B72]/90 border border-transparent'
              }`}
            >
              {downloadPdfLoading ? (
                <>
                  <RefreshCw01 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>Generating PDF...</span>
                </>
              ) : downloadPdfSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>PDF Downloaded ✓</span>
                </>
              ) : (
                <>
                  <Download01 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Download Health Summary (PDF)</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Re-run Onboarding */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                <RefreshCw01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                Re-take Clinical Onboarding
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                Walk through the guided step-by-step clinical onboarding interview again.
              </p>
            </div>
            <button
              type="button"
              onClick={onRestartOnboarding}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw01 className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
              <span>Launch Onboarding Flow</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Danger Zone */}
      <div className="bg-rose-50/50 rounded-3xl p-6 sm:p-7 border border-rose-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" aria-hidden="true" />
              <h3 className="text-sm font-bold text-rose-900">Danger Zone: Delete Account</h3>
            </div>
            <p className="text-xs text-rose-700/80 mt-1 max-w-xl leading-relaxed">
              Permanently delete your user profile, cycle records, ML assessments, appointments, and credentials from Supabase. This action cannot be reversed.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenDeleteModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm shrink-0 cursor-pointer"
          >
            <Trash01 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Delete Account & Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
