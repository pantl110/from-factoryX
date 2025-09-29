import { PermissionRoleInfo, PermissionRoleType } from './types';
import Checkbox from '@/ui/checkbox';
import Chip from '@/ui/chip';
import AuthDropdown from './modals/auth-dropdown';
import { usePortalDropdown } from '@/hooks/use-portal-dropdown';
import useUpdateMember from '@/hooks/factory/factory-member/use-update-member';
import { MemberResponseModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';

interface PermissionTableItemProps {
  item: MemberResponseModel;
  isChecked?: boolean;
  onToggle?: () => void;
  onUpdate?: () => void; // 업데이트 후 목록 새로고침
}

// 날짜 포맷 함수
function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const PermissionTableItem = ({
  item,
  isChecked = false,
  onToggle,
  onUpdate,
}: PermissionTableItemProps) => {
  const factoryRole = useMemberStore((state) => state.role);
  const isViewer = factoryRole === 'viewer';

  const { status, name, email, role, invited_at: invitedAt, factory } = item;
  const textColor = status === 'active' ? 'text-primary' : 'text-dg';
  const roleText =
    role === 'admin'
      ? '시스템 관리자'
      : role === 'manager'
        ? '운영자'
        : '조회자';
  const authColors = PermissionRoleInfo[roleText as PermissionRoleType];
  const { updateMember } = useUpdateMember();

  // 권한 드롭다운 관리
  const {
    isOpen: isAuthDropdownOpen,
    anchorRect: authAnchorRect,
    openDropdown: openAuthDropdown,
    closeDropdown: closeAuthDropdown,
  } = usePortalDropdown();

  const handleAuthChange = async (newAuth: string) => {
    // 이전과 같으면 return
    if (newAuth === role) {
      closeAuthDropdown();
      return;
    }

    try {
      const apiRole =
        newAuth === '시스템 관리자'
          ? 'admin'
          : newAuth === '운영자'
            ? 'manager'
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
        alert(result.error || '권한 변경에 실패했습니다.');
        closeAuthDropdown();
      }
    } catch {
      alert('권한 변경 중 오류가 발생했습니다.');
      closeAuthDropdown();
    }
  };

  return (
    <>
      <>
        <div className="flex items-center justify-between w-full h-14 text-dg Me_Body-1 border-b border-lg group">
          {!isViewer && (
            <Checkbox isChecked={isChecked} onToggle={onToggle || (() => {})} />
          )}
          <p className={`px-3 flex-1 ${textColor}`}>
            {status === 'active' ? '완료' : '-'}
          </p>
          <p className="px-3 flex-1 truncate" title={name || '-'}>
            {name || '-'}
          </p>
          <p className="px-3 flex-2 truncate" title={email || '-'}>
            {email || '-'}
          </p>
          <div className="px-3 flex-1">
            <Chip
              text={roleText}
              textColor={authColors.chipColor.text}
              bgColor={authColors.chipColor.bg}
              hover={authColors.chipColor.hover}
              state={true}
              cursor={'cursor-pointer'}
              onClick={(e) => {
                openAuthDropdown(e as React.MouseEvent);
              }}
            />
          </div>
          <p className="px-3 flex-1">
            {invitedAt ? formatDate(invitedAt) : '-'}
          </p>
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
    </>
  );
};

export default PermissionTableItem;
