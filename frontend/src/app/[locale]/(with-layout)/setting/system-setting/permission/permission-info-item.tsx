import { PermissionRoleType, PermissionRoleInfo } from './types';
import { RoundChip } from '@/ui';
import { useTranslations } from 'next-intl';

interface PermissionInfoItemProps {
  type: PermissionRoleType;
}

const PermissionInfoItem = ({ type }: PermissionInfoItemProps) => {
  const info = PermissionRoleInfo[type];
  const tPermission = useTranslations('setting.systemSetting.permission');

  // 역할 키 매핑 (한국어 -> 번역 키)
  const roleKeyMap: Record<PermissionRoleType, string> = {
    '시스템 관리자': 'admin',
    운영자: 'manager',
    생산관리자: 'prod_manager',
    조회자: 'viewer',
  };

  const roleKey = roleKeyMap[type];
  const roleText = roleKey ? tPermission(`roles.${roleKey}`) : info.type;
  const description = roleKey
    ? tPermission(`descriptions.${roleKey}`)
    : info.description;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <RoundChip text={roleText} color={info.color} variant="sm" />
        <p className="Heading-3">{roleText}</p>
      </div>
      <p className="Re_Body-1 text-dg whitespace-pre-line">{description}</p>
    </div>
  );
};

export default PermissionInfoItem;
