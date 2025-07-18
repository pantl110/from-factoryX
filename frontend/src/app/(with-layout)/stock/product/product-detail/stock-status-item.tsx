import Chip from '@/ui/chip';
import {
  InventoryStatusType,
  InventoryStatusColorMap,
} from '@/types/status-type';

interface StockStatusItemProps {
  materialName: string;
  materialCode: string;
  inputQuantity: string;
  unit: string;
  status: InventoryStatusType;
  date: string;
  setIsMaterialStockStatusModalOpen: (isOpen: boolean) => void;
}

const StockStatusItem = ({
  materialName,
  materialCode,
  inputQuantity,
  unit,
  status,
  date,
  setIsMaterialStockStatusModalOpen,
}: StockStatusItemProps) => {
  const colors = InventoryStatusColorMap[status];

  return (
    <div
      className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1 cursor-pointer hover:bg-bg transition-colors duration-200 ease-in-out group"
      onClick={() => setIsMaterialStockStatusModalOpen(true)}
    >
      <p className="flex-1 px-3 text-dg truncate" title={materialName}>
        {materialName}
      </p>
      <p className="flex-1 px-3 text-dg">{materialCode}</p>
      <p className="flex-1 px-3 text-dg">{inputQuantity}</p>
      <p className="w-[80px] px-3 text-dg">{unit}</p>
      <div className="flex-1 px-3 text-dg flex justify-between">
        <Chip
          text={status}
          textColor={colors.textColor}
          bgColor={colors.bgColor}
        />
        <p className="cursor-pointer Re_Body-1 text-gr flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out">
          상세보기
        </p>
      </div>
      <p className="flex-1 px-3 text-dg">{date}</p>
    </div>
  );
};

export default StockStatusItem;
