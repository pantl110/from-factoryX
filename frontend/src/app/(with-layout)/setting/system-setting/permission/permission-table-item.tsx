import {
  InvitationStatusColorMap,
  InvitationStatusType,
  PermissionRoleInfo,
  PermissionRoleType,
} from './types';
import Checkbox from '@/ui/checkbox';
import Chip from '@/ui/chip';
import AuthDropdown from './modals/auth-dropdown';
import { usePortalDropdown } from '@/hooks/use-portal-dropdown';
import useUpdateMember from '@/hooks/factory-member/use-update-member';
import { MemberRoleType } from '@/types/status-type';

interface PermissionTableItemProps {
  item: {
    id: number;
    invitationStatus: InvitationStatusType;
    name: string;
    email: string;
    permission: string;
    date: string;
  };
  isChecked?: boolean;
  onToggle?: () => void;
  onUpdate?: () => void; // 업데이트 후 목록 새로고침
}

const PermissionTableItem = ({
  item,
  isChecked = false,
  onToggle,
  onUpdate,
}: PermissionTableItemProps) => {
  const { invitationStatus, name, email, permission, date } = item;
  const textColor = InvitationStatusColorMap[invitationStatus];
  const authColors = PermissionRoleInfo[permission as PermissionRoleType];

  const { updateMember } = useUpdateMember();

  // 권한 드롭다운 관리
  const {
    isOpen: isAuthDropdownOpen,
    anchorRect: authAnchorRect,
    openDropdown: openAuthDropdown,
    closeDropdown: closeAuthDropdown,
  } = usePortalDropdown();

  // 권한 텍스트를 API 역할로 변환
  const getApiRole = (permissionText: string): MemberRoleType => {
    switch (permissionText) {
      case '시스템 관리자':
        return 'admin';
      case '운영자':
        return 'manager';
      case '조회자':
        return 'viewer';
      default:
        return 'viewer';
    }
  };

  const handleAuthChange = async (newAuth: string) => {
    // 이전과 같으면 return
    if (newAuth === permission) {
      closeAuthDropdown();
      return;
    }

    try {
      const apiRole = getApiRole(newAuth);
      const result = await updateMember({
        memberId: item.id,
        role: apiRole,
      });

      if (result.success) {
        closeAuthDropdown();
        // 성공 시 목록 새로고침
        if (onUpdate) {
          onUpdate();
        }
      } else {
        throw new Error(result.error || '권한 변경 실패');
      }
    } catch {
      closeAuthDropdown();
      // 에러 발생 시에도 드롭다운은 닫음
    }
  };

  return (
    <>
      <div className="flex items-center justify-between w-full h-14 text-dg Me_Body-1 border-b border-[#eeeeee] group">
        <Checkbox isChecked={isChecked} onToggle={onToggle || (() => {})} />
        <p className={`px-3 flex-1 ${textColor}`}>{invitationStatus}</p>
        <p className="px-3 flex-1">{name ?? '-'}</p>
        <p className="px-3 flex-2">{email}</p>
        <div className="px-3 flex-1">
          <Chip
            text={permission}
            textColor={authColors.chipColor.text}
            bgColor={authColors.chipColor.bg}
            hover={authColors.chipColor.hover}
            state={true}
            cursor="cursor-pointer"
            onClick={(e) => openAuthDropdown(e as React.MouseEvent)}
          />
        </div>
        <p className="px-3 flex-1">{date}</p>
      </div>

      {/* 권한 드롭다운 */}
      {isAuthDropdownOpen && authAnchorRect && (
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
  );
};

export default PermissionTableItem;
