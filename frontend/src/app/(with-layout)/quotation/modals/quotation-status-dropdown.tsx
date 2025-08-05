import Chip from '@/ui/chip';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';

interface QuotationStatusDropdownProps {
  onClose: () => void;
  onQuotationClick: () => void;
  onSuspendedClick: () => void;
}

const QuotationStatusDropdown = ({
  onClose,
  onQuotationClick,
  onSuspendedClick,
}: QuotationStatusDropdownProps) => {
  return (
    <Dropdown width="w-full" onClose={onClose} padding="p-4" gap="gap-2.5">
      <DropdownItem
        onClick={(e) => {
          e?.stopPropagation();
          onClose();
        }}
        noHover={true}
        chip={true}
      >
        <Chip
          text="견적 요청"
          bgColor="bg-yellow-8"
          textColor="text-yellow"
          hover="hover:bg-yellow-hover"
          onClick={onQuotationClick}
        />
      </DropdownItem>
      <DropdownItem
        onClick={(e) => {
          e?.stopPropagation();
          onClose();
        }}
        noHover={true}
        chip={true}
      >
        <Chip
          text="중단"
          bgColor="bg-red-8"
          textColor="text-red"
          hover="hover:bg-red-hover"
          onClick={onSuspendedClick}
        />
      </DropdownItem>
    </Dropdown>
  );
};

export default QuotationStatusDropdown;
