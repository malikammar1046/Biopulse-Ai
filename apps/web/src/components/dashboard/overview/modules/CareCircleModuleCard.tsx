import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, ArrowRight, UserPlus } from 'lucide-react';
import { DashboardModuleCard } from '../DashboardModuleCard';
import { DashboardEmptyState } from '../DashboardEmptyState';
import type { CareCircleMember } from '../../../../types/careCircle';

interface CareCircleModuleCardProps {
  members: CareCircleMember[];
  pathway?: 'female' | 'male';
  loading?: boolean;
  onOpenCareCircle: () => void;
  onAddMember: () => void;
  updatedAt?: string | null;
}

export const CareCircleModuleCard: React.FC<CareCircleModuleCardProps> = ({
  members,
  pathway = 'female',
  loading = false,
  onOpenCareCircle,
  onAddMember,
  updatedAt = '3 hrs ago',
}) => {
  const { t } = useTranslation(['dashboard', 'careCircle', 'common']);
  const isFemale = pathway === 'female';

  const menuItems = [
    {
      label: t('dashboard:manageCircle', { defaultValue: 'Open Care Circle' }),
      onClick: onOpenCareCircle,
      icon: Users,
    },
    {
      label: t('dashboard:inviteMember', { defaultValue: 'Invite Member' }),
      onClick: onAddMember,
      icon: UserPlus,
    },
  ];

  const hasMembers = members && members.length > 0;

  if (!hasMembers) {
    return (
      <DashboardModuleCard
        title={t('dashboard:careCircleSupport', { defaultValue: 'Care Circle' })}
        subtitle={t('dashboard:careCircleSubtitle', { defaultValue: 'Your support network' })}
        icon={Users}
        accentColor={isFemale ? 'pink' : 'blue'}
        isLive={false}
        menuItems={menuItems}
        loading={loading}
      >
        <DashboardEmptyState
          title={t('dashboard:noCircleMembers', { defaultValue: 'Your Care Circle is empty' })}
          description={t('dashboard:noCircleDesc', {
            defaultValue: 'Invite a trusted family member, close friend, or clinical provider to view your health updates.',
          })}
          actionLabel={t('dashboard:inviteMember', { defaultValue: 'Add Trusted Person' })}
          onAction={onAddMember}
          icon={Users}
          accentColor={isFemale ? 'pink' : 'blue'}
        />
      </DashboardModuleCard>
    );
  }

  const displayedMembers = members.slice(0, 3);
  const overflowCount = members.length - 3;

  return (
    <DashboardModuleCard
      title={t('dashboard:careCircleSupport', { defaultValue: 'Care Circle' })}
      subtitle={t('dashboard:careCircleSubtitle', { defaultValue: 'Your support network' })}
      icon={Users}
      accentColor={isFemale ? 'pink' : 'blue'}
      isLive={true}
      syncedModule={t('dashboard:careCircleSupport', { defaultValue: 'Care Circle' })}
      updatedAt={updatedAt}
      menuItems={menuItems}
      loading={loading}
    >
      <div className="space-y-4 py-1">
        {/* Members List */}
        <div className="flex items-center gap-3 overflow-hidden">
          {displayedMembers.map((member) => {
            const initials = member.name
              ? member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'CP';

            const displayRole =
              member.relationship ||
              (member.role === 'doctor'
                ? t('careCircle:roles.doctor', { defaultValue: 'Clinical Specialist' })
                : member.role === 'family'
                ? t('careCircle:roles.family', { defaultValue: 'Family Support' })
                : t('careCircle:roles.partner', { defaultValue: 'Trusted Contact' }));

            return (
              <div
                key={member.id}
                className="flex items-center gap-2 p-2 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] min-w-0 flex-1"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isFemale
                      ? 'bg-[#FDE6EF] text-[#E11D48]'
                      : 'bg-[#E0F2FE] text-[#0284C7]'
                  }`}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    {member.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans truncate block capitalize">
                    {displayRole}
                  </span>
                </div>
              </div>
            );
          })}

          {overflowCount > 0 && (
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
              +{overflowCount}
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div>
          <button
            type="button"
            onClick={onOpenCareCircle}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              isFemale
                ? 'border-[#F43F7D]/30 text-[#E11D48] hover:bg-[#FDE6EF]/40'
                : 'border-[#0284C7]/30 text-[#0284C7] hover:bg-[#E0F2FE]/40'
            }`}
          >
            <span>{t('dashboard:manageCircle', { defaultValue: 'Open Care Circle' })}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </DashboardModuleCard>
  );
};
