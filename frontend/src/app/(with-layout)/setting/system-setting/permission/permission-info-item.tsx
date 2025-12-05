import { PermissionRoleType, PermissionRoleInfo } from './types';
import { RoundChip } from '@/ui';

interface PermissionInfoItemProps {
  type: PermissionRoleType;
}

const PermissionInfoItem = ({ type }: PermissionInfoItemProps) => {
  const info = PermissionRoleInfo[type];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <RoundChip text={info.type} color={info.color} variant="sm" />
        <p className="Heading-3">{info.type}</p>
      </div>
      <p className="Re_Body-1 text-dg whitespace-pre-line">
        {info.description}
      </p>
    </div>
  );
};

export default PermissionInfoItem;
