import { X } from '@phosphor-icons/react';

import { MaterialHistoryResponseModel } from '@/types/data-model';
interface SelectedItemProps {
  item: MaterialHistoryResponseModel;
  onRemove?: (id: number) => void;
}
const SelectedItem = ({ item, onRemove }: SelectedItemProps) => {
  return (
    <div className="flex items-center py-2 pr-1 pl-3 bg-wh border border-lg rounded-[8px]">
      <div className="flex-1 h-13 flex flex-col justify-between">
        <p className="Me_Body-3 text-dg">{item.material_name}</p>
        <div className="flex gap-1 items-center">
          <p className="Re_Body-2 text-gr">{item.material_spec}</p>
          <div className="w-1 h-[60%] border-r border-lg" />
          <p className="Re_Body-2 text-gr">
            {item.quantity}
            {item.material_unit}
          </p>
          <div className="w-1 h-[60%] border-r border-lg" />
          <p className="Re_Body-2 text-gr">
            {item.unit_price?.toLocaleString()}
          </p>
        </div>
      </div>
      <button
        className="flex justify-center items-center w-9 h-9 hover:bg-bg rounded-[8px]"
        onClick={() => onRemove?.(item.id)}
      >
        <X size={16} className="text-gr" />
      </button>
    </div>
  );
};

export default SelectedItem;
