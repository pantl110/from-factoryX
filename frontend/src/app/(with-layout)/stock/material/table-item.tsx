'use client';

import Chip from '@/ui/chip';

import { InventoryStatusColorMap } from '@/types/status-type';
import Checkbox from '@/ui/checkbox';

import { MaterialResponseModel } from '@/types/data-model';

interface TableItemProps {
  material: MaterialResponseModel;
  onClick?: () => void;
  checked: boolean;
  onToggle: () => void;
}

const TableItem = ({
  material,
  onClick,
  checked,
  onToggle,
}: TableItemProps) => {
  const {
    name,
    code,
    unit,
    spec,
    current_stock: currentStock,
    standard_stock: standardStock,
  } = material;
  const safeStandardStock = standardStock ?? 0;
  const status =
    typeof currentStock === 'number'
      ? currentStock >= safeStandardStock
        ? '충분'
        : '부족'
      : '충분';
  const colors = InventoryStatusColorMap[status];

  return (
    <>
      <div
        className="flex items-center h-14 border-b border-lg Me_Body-1 cursor-pointer hover:bg-bg transition-colors duration-200"
        onClick={onClick}
      >
        <Checkbox isChecked={checked} onToggle={onToggle} />
        <p className="flex-1 px-3 text-dg truncate" title={name}>
          {name}
        </p>
        <p className="flex-1 px-3 text-dg">{code || '-'}</p>
        <p className="flex-1 px-3 text-dg">{spec}</p>
        <p className="flex-[0.5] px-3 text-dg">{unit}</p>
        <p className="flex-1 px-3 text-dg">
          {typeof currentStock === 'number'
            ? currentStock.toLocaleString()
            : '-'}
        </p>
        <div className="px-3 w-[150px]">
          {typeof currentStock === 'number' ? (
            <Chip
              text={status}
              bgColor={colors.bgColor}
              textColor={colors.textColor}
            />
          ) : (
            <span className="text-dg">-</span>
          )}
        </div>
      </div>
    </>
  );
};

export default TableItem;
