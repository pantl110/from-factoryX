import Chip from "@/ui/chip";
import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";

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
    <Dropdown onClose={onClose} width="w-[98px]">
      <DropdownItem noHover={true}>
        <Chip
          text="운영자"
          textColor="text-primary"
          bgColor="bg-primary-8"
          hover="hover:bg-secondary-hover"
          onClick={() => handleAuthSelect("운영자")}
        />
      </DropdownItem>
      <DropdownItem onClick={() => handleAuthSelect("조회자")} noHover={true}>
        <Chip
          text="조회자"
          textColor="text-yellow"
          bgColor="bg-yellow-8"
          hover="hover:bg-yellow-hover"
          onClick={() => handleAuthSelect("조회자")}
        />
      </DropdownItem>
    </Dropdown>
  );
};

export default AuthDropdown;
