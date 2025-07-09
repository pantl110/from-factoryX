import Chip from "@/ui/chip";
import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";
import { PermissionRoleInfo } from "../types";

interface AuthDropdownProps {
  onClose: () => void;
  onSelect?: (auth: string) => void;
}

const AuthDropdown = ({ onClose, onSelect }: AuthDropdownProps) => {
  const handleAuthSelect = (auth: string) => {
    onSelect?.(auth);
    onClose();
  };

  return (
    <Dropdown onClose={onClose} width="w-fit" className="gap-2.5">
      <DropdownItem noHover={true} chip={true}>
        <Chip
          text="운영자"
          textColor={PermissionRoleInfo["운영자"].chipColor.text}
          bgColor={PermissionRoleInfo["운영자"].chipColor.bg}
          hover={PermissionRoleInfo["운영자"].chipColor.hover}
          onClick={() => handleAuthSelect("운영자")}
        />
      </DropdownItem>
      <DropdownItem noHover={true} chip={true}>
        <Chip
          text="조회자"
          textColor={PermissionRoleInfo["조회자"].chipColor.text}
          bgColor={PermissionRoleInfo["조회자"].chipColor.bg}
          hover={PermissionRoleInfo["조회자"].chipColor.hover}
          onClick={() => handleAuthSelect("조회자")}
        />
      </DropdownItem>
    </Dropdown>
  );
};

export default AuthDropdown;
