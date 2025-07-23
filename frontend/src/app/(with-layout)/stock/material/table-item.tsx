'use client';

import Chip from '@/ui/chip';

import {
  InventoryStatusType,
  InventoryStatusColorMap,
} from '@/types/status-type';
import Checkbox from '@/ui/checkbox';

interface TableItemProps {
  materialName: string;
  materialCode: string;
  unit: string;
  currentStock: number;
  status: InventoryStatusType;
  _date: string;
  onClick?: () => void;
  checked: boolean;
  onToggle: () => void;
}

const TableItem = ({
  materialName,
  materialCode,
  unit,
  currentStock,
  status,
  onClick,
  checked,
  onToggle,
}: TableItemProps) => {
  const colors = InventoryStatusColorMap[status];

  return (
    <>
      <div
        className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1 cursor-pointer hover:bg-bg transition-colors duration-200"
        onClick={onClick}
      >
        <Checkbox isChecked={checked} onToggle={onToggle} />
        <p className="flex-1 px-3 text-dg truncate" title={materialName}>
          {materialName}
        </p>
        <p className="flex-1 px-3 text-dg">{materialCode}</p>
        {/* <p className="flex-1 px-3 text-dg">{spec}</p> */}
        <p className="flex-[0.5] px-3 text-dg">{unit}</p>
        <p className="flex-1 px-3 text-dg">{currentStock.toLocaleString()}</p>
        <div className="px-3 w-[150px]">
          <Chip
            text={status}
            bgColor={colors.bgColor}
            textColor={colors.textColor}
          />
        </div>
      </div>
    </>
  );
};

export default TableItem;
