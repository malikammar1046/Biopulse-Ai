import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUserHealth } from '../../context/UserHealthContext';
import { ReportHeroUpload } from '../../components/reports/ReportHeroUpload';
import { ReportTimeline } from '../../components/reports/ReportTimeline';
import { ReportTrendVisualizer } from '../../components/reports/ReportTrendVisualizer';
import { ReportUploadModal } from '../../components/reports/ReportUploadModal';
import { ReportDetailModal } from '../../components/reports/ReportDetailModal';
import { ReportDeleteModal } from '../../components/reports/ReportDeleteModal';
import type { MedicalReport, MedicalReportInput } from '../../types/report';

export const ReportsPage: React.FC = () => {
  const {
    reports,
    reportStats,
    reportsLoading,
    uploadReport,
    deleteReport,
  } = useUserHealth();

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [initialDroppedFile, setInitialDroppedFile] = useState<File | null>(null);

  const [selectedReportForDetail, setSelectedReportForDetail] = useState<MedicalReport | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [selectedReportForDelete, setSelectedReportForDelete] = useState<MedicalReport | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleFileFromHero = (file: File) => {
    setInitialDroppedFile(file);
    setIsUploadModalOpen(true);
  };

  const handleOpenUploadWizard = () => {
    setInitialDroppedFile(null);
    setIsUploadModalOpen(true);
  };

  const handleViewDetail = (report: MedicalReport) => {
    setSelectedReportForDetail(report);
    setIsDetailModalOpen(true);
  };

  const handleDeleteTrigger = (report: MedicalReport) => {
    setSelectedReportForDelete(report);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedReportForDelete) {
      await deleteReport(selectedReportForDelete.id);
    }
  };

  const handleSaveReport = async (input: MedicalReportInput) => {
    return await uploadReport(input);
  };

  if (reportsLoading && reports.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-[#0288D1] flex items-center justify-center animate-pulse shadow-md">
          <div className="w-3 h-3 rounded-full bg-white animate-ping" />
        </div>
        <p className="text-xs font-mono font-bold tracking-widest text-[#64748B] uppercase">
          Loading Your Health Reports...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-6xl mx-auto space-y-8 text-left select-none pb-16"
    >
      {/* Hero Upload & Statistics Header */}
      <ReportHeroUpload
        stats={reportStats}
        onFileSelected={handleFileFromHero}
        onOpenUploadWizard={handleOpenUploadWizard}
      />

      {/* Historical Biomarker Trend Comparison Chart (if multi-report trends exist) */}
      <ReportTrendVisualizer reports={reports} />

      {/* Chronological Report Timeline & Category Filters */}
      <ReportTimeline
        reports={reports}
        onViewDetail={handleViewDetail}
        onDelete={handleDeleteTrigger}
        onOpenUploadModal={handleOpenUploadWizard}
      />

      {/* 4-Step OCR Verification & Upload Modal */}
      <ReportUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setInitialDroppedFile(null);
        }}
        onSaveReport={handleSaveReport}
        initialFile={initialDroppedFile}
      />

      {/* Comprehensive Report Detail Modal */}
      <ReportDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedReportForDetail(null);
        }}
        report={selectedReportForDetail}
      />

      {/* Delete Confirmation Modal */}
      <ReportDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedReportForDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        report={selectedReportForDelete}
      />
    </motion.div>
  );
};

export default ReportsPage;
