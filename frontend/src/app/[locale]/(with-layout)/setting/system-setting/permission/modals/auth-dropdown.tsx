import Chip from '@/ui/chip';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { PermissionRoleInfo } from '../types';
import { useTranslations } from 'next-intl';

interface AuthDropdownProps {
  onClose: () => void;
  onSelect?: (auth: string) => void;
}

const AuthDropdown = ({ onClose, onSelect }: AuthDropdownProps) => {
  const tPermission = useTranslations('setting.systemSetting.permission');

  const handleAuthSelect = (auth: string) => {
    onSelect?.(auth);
    onClose();
  };

  const roles: Array<{ key: string; role: string }> = [
    { key: 'manager', role: '운영자' },
    { key: 'prod_manager', role: '생산관리자' },
    { key: 'viewer', role: '조회자' },
  ];

  return (
    <Dropdown onClose={onClose} width="w-fit" gap="gap-2.5">
      {roles.map(({ key, role }) => (
        <DropdownItem key={key} noHover={true} chip={true}>
          <Chip
            text={tPermission(`roles.${key}`)}
            textColor={
              PermissionRoleInfo[role as keyof typeof PermissionRoleInfo]
                .chipColor.text
            }
            bgColor={
              PermissionRoleInfo[role as keyof typeof PermissionRoleInfo]
                .chipColor.bg
            }
            hover={
              PermissionRoleInfo[role as keyof typeof PermissionRoleInfo]
                .chipColor.hover
            }
            onClick={() => handleAuthSelect(role)}
            cursor="cursor-pointer"
          />
        </DropdownItem>
      ))}
    </Dropdown>
  );
};

export default AuthDropdown;
