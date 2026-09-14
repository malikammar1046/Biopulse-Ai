import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldAlert,
  FileText,
  HeartPulse,
  Stethoscope,
  Droplets,
  Utensils,
  Activity,
  Pill,
  UserCheck,
  Layers,
  TrendingUp,
  FileUp,
  Sparkles,
  Calendar,
  Zap,
} from 'lucide-react';
import type { DashboardAction } from '../../../utils/dashboardActions';
import type { HealthPathway } from '../../../types/onboarding';

interface TodayActionsCardProps {
  actions: DashboardAction[];
  pathway: HealthPathway;
}

// Map string icon names to Lucide components
function renderActionIcon(iconName: string, className: string = 'w-4 h-4') {
  switch (iconName) {
    case 'ShieldAlert':
      return <ShieldAlert className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    case 'UserCheck':
      return <UserCheck className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Stethoscope':
      return <Stethoscope className={className} />;
    case 'Droplets':
      return <Droplets className={className} />;
    case 'Utensils':
      return <Utensils className={className} />;
    case 'Activity':
      return <Activity className={className} />;
    case 'Pill':
      return <Pill className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'TrendingUp':
      return <TrendingUp className={className} />;
    case 'FileUp':
      return <FileUp className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Calendar':
      return <Calendar className={className} />;
    default:
      return <Zap className={className} />;
  }
}

export const TodayActionsCard: React.FC<TodayActionsCardProps> = ({
  actions,
  pathway,
}) => {
  const [showAll, setShowAll] = useState(false);

  const completedCount = actions.filter((a) => a.isCompleted).length;
  const totalCount = actions.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
  const criticalCount = actions.filter((a) => a.priority === 'critical' && !a.isCompleted).length;

  const displayActions = showAll ? actions : actions.slice(0, 4);

  const getPriorityBadge = (priority: DashboardAction['priority']) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-2.5 h-2.5" />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-2.5 h-2.5" />
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            ACTION
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            SUGGESTED
          </span>
        );
    }
  };

  return (
    <div
      className="p-6 sm:p-7 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm transition-all space-y-6 text-left"
      id="today-actions-section"
      data-pathway={pathway}
    >
      {/* ── Card Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#64748B] font-bold">
              Personalized Plan
            </span>
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-2.5 h-2.5" />
                {criticalCount} Urgent
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-[#0F172A] tracking-tight">
            Today's Priorities
          </h2>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-2 self-start sm:self-auto">
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-[#0F172A]">
              {completedCount} / {totalCount} Done
            </div>
            <div className="text-[10px] font-sans text-[#64748B]">
              {progressPercent}% completed
            </div>
          </div>
          <div className="w-12 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#29B6F6] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Action Items ── */}
      {actions.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold font-display text-[#0F172A]">All Caught Up!</h4>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            You've completed all prioritized health actions for today. Check back tomorrow or log ad-hoc updates below.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {displayActions.map((action, idx) => {
              const isDone = action.isCompleted;

              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                    isDone
                      ? 'bg-slate-50/60 border-slate-200/60 opacity-60'
                      : action.priority === 'critical'
                      ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#BAE6FD] hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Status Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : action.priority === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        renderActionIcon(action.iconName, 'w-4 h-4')
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-bold font-display ${
                            isDone ? 'line-through text-slate-500' : 'text-[#0F172A]'
                          }`}
                        >
                          {action.title}
                        </span>
                        {getPriorityBadge(action.priority)}
                      </div>
                      <p className="text-xs text-[#64748B] font-sans leading-relaxed line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {action.route && !isDone && (
                      <Link
                        to={action.route}
                        className={`text-xs font-bold font-sans px-3.5 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                          action.priority === 'critical'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-[#0288D1] hover:bg-[#0277BD] text-white shadow-sm'
                        }`}
                      >
                        <span>{action.actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                    {isDone && (
                      <span className="text-[11px] font-mono text-emerald-700 font-bold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
                        Completed
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Show All / Show Less Toggle ── */}
      {actions.length > 4 && (
        <div className="pt-2 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-bold font-sans text-[#0288D1] hover:text-[#0277BD] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-[#F0F9FF] transition-colors cursor-pointer"
          >
            {showAll ? (
              <>
                <span>Show Fewer Actions</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>View All {actions.length} Priorities</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
