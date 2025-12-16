import { MaterialHistoryResponseModel } from '@/types/data-model';
import Checkbox from '@/ui/checkbox';

interface UnlinkedTableItemProps {
  item: MaterialHistoryResponseModel;
  isChecked?: boolean;
  onToggle?: () => void;
}

const UnlinkedTableItem = ({
  item,
  isChecked = false,
  onToggle,
}: UnlinkedTableItemProps) => {
  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1">
      <Checkbox isChecked={isChecked} onToggle={onToggle || (() => {})} />
      <p
        className="flex-[1.5] px-3 text-dg Me_Body-1 truncate"
        title={item.material_name}
      >
        {item.material_name}
      </p>
      <p
        className="flex-1 px-3 text-dg Me_Body-1 truncate"
        title={item.material_spec}
      >
        {item.material_spec}
      </p>
      <p
        className="flex-[0.7] px-3 text-dg Me_Body-1 truncate"
        title={item.quantity?.toLocaleString()}
      >
        {item.quantity?.toLocaleString()}
      </p>
      <p
        className="flex-[0.5] px-3 text-dg Me_Body-1 truncate"
        title={item.material_unit}
      >
        {item.material_unit}
      </p>
      <p
        className="flex-[0.7] px-3 text-dg Me_Body-1 truncate"
        title={item.unit_price?.toLocaleString()}
      >
        {item.unit_price?.toLocaleString()}
      </p>{' '}
      <p
        className="flex-1 px-3 text-dg Me_Body-1 truncate"
        title={item.amount?.toLocaleString()}
      >
        {item.amount?.toLocaleString()}
      </p>
    </div>
  );
};

export default UnlinkedTableItem;
