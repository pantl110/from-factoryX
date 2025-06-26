import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";
import { ClientType, ClientTypeColorMap } from "../types";
import Chip from "@/ui/chip";

interface ClientTypeDropdownProps {
  onClose: () => void;
  onSelect?: (clientType: ClientType) => void;
  currentClientType?: ClientType;
}

const ClientTypeDropdown = ({ onClose, onSelect }: ClientTypeDropdownProps) => {
  const handleClientTypeSelect = (clientType: ClientType) => {
    onSelect?.(clientType);
    onClose();
  };

  const clientTypeOptions: { type: ClientType; label: string }[] = [
    { type: "수주처", label: "수주처" },
    { type: "발주처", label: "발주처" },
  ];

  return (
    <Dropdown onClose={onClose} width="w-ull">
      {clientTypeOptions.map((option) => {
        const colorMap = ClientTypeColorMap[option.type];

        return (
          <DropdownItem
            key={option.type}
            onClick={() => handleClientTypeSelect(option.type)}
          >
            <Chip
              text={option.label}
              bgColor={colorMap.bgColor}
              textColor={colorMap.textColor}
              radius="rounded-[4px]"
              cursor="cursor-pointer"
              onClick={() => handleClientTypeSelect(option.type)}
            />
          </DropdownItem>
        );
      })}
    </Dropdown>
  );
};

export default ClientTypeDropdown;
