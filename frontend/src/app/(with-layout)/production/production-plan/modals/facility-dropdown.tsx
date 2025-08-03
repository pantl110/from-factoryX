import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { EquipmentResponseModel } from '@/types/data-model';

interface FacilityDropdownProps {
  onClose: () => void;
  style?: React.CSSProperties;
  equipments: EquipmentResponseModel[];
  onSelect: (equipment: EquipmentResponseModel) => void;
}

const FacilityDropdown = ({
  onClose,
  style,
  equipments,
  onSelect,
}: FacilityDropdownProps) => {
  const handleSelectEquipment = (equipment: EquipmentResponseModel) => {
    onSelect(equipment);
    onClose();
  };

  return (
    <div style={{ ...style, minWidth: style?.width }} className="w-fit">
      <Dropdown onClose={onClose} width="w-full">
        {equipments.length > 0 &&
          equipments.map((equipment) => (
            <DropdownItem
              key={equipment.id}
              text={`${equipment.name}`}
              onClick={() => handleSelectEquipment(equipment)}
            />
          ))}
      </Dropdown>
    </div>
  );
};

export default FacilityDropdown;
