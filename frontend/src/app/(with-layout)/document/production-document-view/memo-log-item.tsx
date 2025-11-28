import {
  getRoleText,
  MemberRoleColorMap,
  MemberRoleType,
} from '@/types/status-type';
import { RoundChip } from '@/ui';

interface ChangedByInfo {
  role: string | null;
  username: string | null;
  email: string;
}

interface MemoLogItemProps {
  memo?: string | null;
  time?: string;
  changedBy?: ChangedByInfo | null;
}

const MemoLogItem = ({ memo, time, changedBy }: MemoLogItemProps) => {
  const roleText = getRoleText(changedBy?.role || null);
  const chipColor =
    changedBy?.role && changedBy.role in MemberRoleColorMap
      ? MemberRoleColorMap[changedBy.role as MemberRoleType]?.color || 'gray'
      : 'gray';

  return (
    <div className="pb-5 border-b border-lg mt-3">
      <div className="bg-bg rounded-[8px] py-3 px-4 flex flex-col gap-1">
        <div className="flex justify-between text-sv Me_Body-1">
          {time && <span>{time} 업데이트</span>}
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
        <p className="text-dg Me_Body-1 whitespace-pre-line">{memo || '-'}</p>
      </div>
    </div>
  );
};

export default MemoLogItem;
