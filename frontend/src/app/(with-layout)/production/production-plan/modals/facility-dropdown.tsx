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

  // 6개 이상일 때 스크롤 적용
  const shouldUseScroll = equipments.length > 6;

  return (
    <div style={{ ...style, minWidth: style?.width }} className="w-fit">
      <Dropdown onClose={onClose} width="w-full" maxHeight={shouldUseScroll}>
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
