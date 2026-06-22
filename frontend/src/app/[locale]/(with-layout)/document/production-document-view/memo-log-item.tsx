'use client';

import { useTranslations } from 'next-intl';
import { MemberRoleColorMap, MemberRoleType } from '@/types/status-type';
import { RoundChip } from '@/ui';
import { getRoleText } from '@/utils';

interface ChangedByInfoModel {
  role: string | null;
  username: string | null;
  email: string;
}

interface MemoLogItemProps {
  memo?: string | null;
  time?: string;
  changedBy?: ChangedByInfoModel | null;
}

const MemoLogItem = ({ memo, time, changedBy }: MemoLogItemProps) => {
  const t = useTranslations('document');
  const tPermission = useTranslations('setting.systemSetting.permission');
  const roleText = getRoleText(changedBy?.role || null, tPermission);
  const chipColor =
    changedBy?.role && changedBy.role in MemberRoleColorMap
      ? MemberRoleColorMap[changedBy.role as MemberRoleType]?.color || 'gray'
      : 'gray';

  return (
    <div className="pb-5 border-b border-lg mt-3">
      <div className="bg-bg rounded-[8px] py-3 px-4 flex flex-col gap-1">
        <div className="flex justify-between text-sv Me_Body-3">
          {time && <span>{t('updatedAt', { time })}</span>}
          <div className="flex gap-1.5 items-center">
            {changedBy && (
              <>
                {changedBy.role && (
                  <RoundChip text={roleText} variant="role" color={chipColor} />
                )}
                <span>
                  {changedBy.username} | {changedBy.email.split('@')[0]}
                </span>
              </>
            )}
          </div>
        </div>
        <p className="text-dg Me_Body-3 whitespace-pre-line">{memo || '-'}</p>
      </div>
    </div>
  );
};

export default MemoLogItem;
