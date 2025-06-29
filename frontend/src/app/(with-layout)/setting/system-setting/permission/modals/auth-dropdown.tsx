import Chip from "@/ui/chip";
import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";

interface AuthDropdownProps {
  onClose: () => void;
}

const AuthDropdown = ({ onClose }: AuthDropdownProps) => {
  return (
    <Dropdown onClose={onClose} width="w-[98px]">
      <DropdownItem noHover={true}>
        <Chip
          text="운영자"
          textColor="text-primary"
          bgColor="bg-primary-8"
          hover="hover:bg-secondary-hover"
          onClick={onClose}
        />
      </DropdownItem>
      <DropdownItem onClick={onClose} noHover={true}>
        <Chip
          text="조회자"
          textColor="text-yellow"
          bgColor="bg-yellow-8"
          hover="hover:bg-yellow-hover"
          onClick={onClose}
        />
      </DropdownItem>
    </Dropdown>
  );
};

export default AuthDropdown;
