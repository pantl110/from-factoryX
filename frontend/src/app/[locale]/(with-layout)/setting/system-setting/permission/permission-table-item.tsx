import { PermissionRoleInfo, PermissionRoleType } from './types';
import Checkbox from '@/ui/checkbox';
import Chip from '@/ui/chip';
import AuthDropdown from './modals/auth-dropdown';
import { MemberResponseModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useUpdateMember, usePortalDropdown } from '@/hooks';
import { formatISODate } from '@/utils';
import { useTranslations } from 'next-intl';

interface PermissionTableItemProps {
  item: MemberResponseModel;
  isChecked?: boolean;
  onToggle?: () => void;
  onUpdate?: () => void; // 업데이트 후 목록 새로고침
}

// 공용 유틸 사용 (날짜만)
const formatDate = (dateString?: string | null) =>
  dateString ? formatISODate(dateString) || '-' : '-';

const PermissionTableItem = ({
  item,
  isChecked = false,
  onToggle,
  onUpdate,
}: PermissionTableItemProps) => {
  const factoryRole = useMemberStore((state) => state.role);
  const isViewer = factoryRole === 'viewer';
  const isProdManager = factoryRole === 'prod_manager';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );
  const tPermission = useTranslations('setting.systemSetting.permission');
  const tTableItem = useTranslations(
    'setting.systemSetting.permission.tableItem'
  );

  const { status, name, email, role, invited_at: invitedAt, factory } = item;
  const textColor = status === 'active' ? 'text-primary' : 'text-dg';

  // 역할 키를 한국어 역할명으로 변환 (PermissionRoleInfo 키로 사용)
  const roleKeyMap: Record<string, string> = {
    admin: '시스템 관리자',
    manager: '운영자',
    prod_manager: '생산관리자',
    viewer: '조회자',
  };
  const roleKey = roleKeyMap[role] || '조회자';
  const roleText = tPermission(`roles.${role}`);
  const authColors = PermissionRoleInfo[roleKey as PermissionRoleType];
  const { updateMember } = useUpdateMember();

  // 권한 드롭다운 관리
  const {
    isOpen: isAuthDropdownOpen,
    anchorRect: authAnchorRect,
    openDropdown: openAuthDropdown,
    closeDropdown: closeAuthDropdown,
  } = usePortalDropdown();

  const handleAuthChange = async (newAuth: string) => {
    // 이전과 같으면 return (newAuth는 한국어 역할명, roleKey와 비교)
    if (newAuth === roleKey) {
      closeAuthDropdown();
      return;
    }

    try {
      const apiRole =
        newAuth === '시스템 관리자'
          ? 'admin'
          : newAuth === '운영자'
            ? 'manager'
            : newAuth === '생산관리자'
              ? 'prod_manager'
              : 'viewer';
      const result = await updateMember({
        memberId: item.id,
        factoryId: factory,
        role: apiRole,
      });

      if (result.success) {
        closeAuthDropdown();
        // 성공 시 목록 새로고침
        if (onUpdate) {
          onUpdate();
        }
      } else {
        alert(result.error || tTableItem('errors.changeFailed'));
        closeAuthDropdown();
      }
    } catch {
      alert(tTableItem('errors.changeError'));
      closeAuthDropdown();
    }
  };

  return (
    <>
      <>
        <div className="flex items-center justify-between w-full h-14 text-dg Me_Body-3 border-b border-lg group cursor-default">
          {!isViewer && !isProdManager && hasSubscription() && (
            <Checkbox isChecked={isChecked} onToggle={onToggle || (() => {})} />
          )}
          <p className={`px-3 flex-1 ${textColor}`}>
            {status === 'active'
              ? tTableItem('registrationStatus.completed')
              : '-'}
          </p>
          <p className="px-3 flex-1 truncate" title={name || '-'}>
            {name || '-'}
          </p>
          <p className="px-3 flex-2 truncate" title={email || '-'}>
            {email || '-'}
          </p>
          <div className="px-3 flex-[1.2]">
            <Chip
              text={roleText}
              textColor={authColors.chipColor.text}
              bgColor={authColors.chipColor.bg}
              hover={
                !isViewer && !isProdManager && hasSubscription()
                  ? authColors.chipColor.hover
                  : undefined
              }
              state={
                !isViewer && !isProdManager && hasSubscription() ? true : false
              }
              cursor={
                !isViewer && !isProdManager && hasSubscription()
                  ? 'cursor-pointer'
                  : 'cursor-default'
              }
              onClick={(e) => {
                if (!isViewer && !isProdManager && hasSubscription()) {
                  openAuthDropdown(e as React.MouseEvent);
                }
              }}
            />
          </div>
          <p className="px-3 flex-1">{formatDate(invitedAt)}</p>
        </div>

        {/* 권한 드롭다운 */}
        {isAuthDropdownOpen &&
          authAnchorRect &&
          !isViewer &&
          !isProdManager &&
          hasSubscription() && (
            <div
              style={{
                position: 'fixed',
                left: authAnchorRect.left,
                top: authAnchorRect.bottom + 8,
                zIndex: 10,
                width: authAnchorRect.width,
              }}
            >
              <AuthDropdown
                onClose={closeAuthDropdown}
                onSelect={handleAuthChange}
              />
            </div>
          )}
      </>
    </>
  );
};

export default PermissionTableItem;
