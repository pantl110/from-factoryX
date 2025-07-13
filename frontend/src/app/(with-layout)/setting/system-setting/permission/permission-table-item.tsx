import {
  InvitationStatusColorMap,
  InvitationStatusType,
  PermissionRoleInfo,
  PermissionRoleType,
} from './types'
import Checkbox from '@/ui/checkbox'
import Chip from '@/ui/chip'
import AuthDropdown from './modals/auth-dropdown'
import { usePortalDropdown } from '@/hooks/use-portal-dropdown'

interface PermissionTableItemProps {
  invitationStatus: InvitationStatusType
  name?: string
  email: string
  permission: string
  date: string
  isChecked?: boolean
  onToggle?: () => void
}

const PermissionTableItem = ({
  invitationStatus,
  name,
  email,
  permission,
  date,
  isChecked = false,
  onToggle,
}: PermissionTableItemProps) => {
  const textColor = InvitationStatusColorMap[invitationStatus]
  const authColors = PermissionRoleInfo[permission as PermissionRoleType]

  // 권한 드롭다운 관리
  const {
    isOpen: isAuthDropdownOpen,
    anchorRect: authAnchorRect,
    openDropdown: openAuthDropdown,
    closeDropdown: closeAuthDropdown,
  } = usePortalDropdown()

  const handleAuthChange = () =>
    // newAuth: string

    {
      // console.log("권한 변경:", newAuth);
      // TODO: API 호출로 권한 변경 처리
    }

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
          <AuthDropdown onClose={closeAuthDropdown} onSelect={handleAuthChange} />
        </div>
      )}
    </>
  )
}

export default PermissionTableItem
