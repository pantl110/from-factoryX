import Checkbox from '@/ui/checkbox';
import { MaterialResponseModel } from '@/types/data-model';

interface MaterialItemProps {
  material: MaterialResponseModel;
  isChecked: boolean;
  onToggle: () => void;
}

const MaterialItem = ({ material, isChecked, onToggle }: MaterialItemProps) => {
  return (
    <div
      className="flex items-center h-14 border-b border-lg transition-colors duration-200 ease-in-out Me_Body-1 cursor-pointer hover:bg-bg"
      onClick={onToggle}
    >
      <Checkbox isChecked={isChecked} onToggle={onToggle} />
      <p className="flex-1 px-3 text-dg truncate" title={material.name}>
        {material.name}
      </p>
      <p className="flex-1 px-3 text-dg truncate" title={material.code}>
        {material.code}
      </p>
      <p className="flex-1 px-3 text-dg truncate" title={material.spec}>
        {material.spec || '-'}
      </p>
      <p className="flex-1 px-3 text-dg truncate" title={material.unit}>
        {material.unit}
      </p>
    </div>
  );
};

export default MaterialItem;
