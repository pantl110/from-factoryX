"use client";

import Chip from "@/ui/chip";

import {
  InventoryStatusType,
  InventoryStatusColorMap,
} from "@/types/status-type";

interface TableItemProps {
  materialName: string;
  materialCode: string;
  unit: string;
  currentStock: number;
  status: InventoryStatusType;
  date: string;
  onClick?: () => void;
  isDeleteMode: boolean;
}

const TableItem = ({
  materialName,
  materialCode,
  unit,
  currentStock,
  status,
  date,
  onClick,
  isDeleteMode,
}: TableItemProps) => {
  const colors = InventoryStatusColorMap[status];

  return (
    <>
      <div
        className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1 cursor-pointer hover:bg-bg transition-colors duration-200"
        onClick={onClick}
      >
        {isDeleteMode && (
          <div
            className="flex items-center px-3"
            onClick={(e) => e.stopPropagation()}
          >
            <input type="checkbox" className="w-4 h-4 border-sv" />
          </div>
        )}
        <p className="flex-1 px-3 text-dg truncate" title={materialName}>
          {materialName}
        </p>
        <p className="flex-1 px-3 text-dg">{materialCode}</p>
        <p className="w-[80px] px-3 text-dg">{unit}</p>
        <p className="flex-1 px-3 text-dg">{currentStock.toLocaleString()}</p>
        <div className="px-3 w-[100px]">
          <Chip
            text={status}
            bgColor={colors.bgColor}
            textColor={colors.textColor}
            sm={true}
          />
        </div>
        <p className="flex-1 px-3 text-dg">{date}</p>
      </div>
    </>
  );
};

export default TableItem;
