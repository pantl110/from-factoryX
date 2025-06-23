import Chip from "@/ui/chip";
import {
  InventoryStatusType,
  InventoryStatusColorMap,
} from "@/types/status-type";

interface StockStatusItemProps {
  materialName: string;
  materialCode: string;
  inputQuantity: string;
  unit: string;
  status: InventoryStatusType;
  date: string;
}

const StockStatusItem = ({
  materialName,
  materialCode,
  inputQuantity,
  unit,
  status,
  date,
}: StockStatusItemProps) => {
  const colors = InventoryStatusColorMap[status];

  return (
    <div className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1 cursor-pointer">
      <p className="flex-1 px-3 text-dg truncate" title={materialName}>
        {materialName}
      </p>
      <p className="flex-1 px-3 text-dg">{materialCode}</p>
      <p className="flex-1 px-3 text-dg">{inputQuantity}</p>
      <p className="w-[80px] px-3 text-dg">{unit}</p>
      <div className="flex-1 px-3 text-dg">
        <Chip
          text={status}
          sm={true}
          textColor={colors.textColor}
          bgColor={colors.bgColor}
        />
      </div>
      <p className="flex-1 px-3 text-dg">{date}</p>
    </div>
  );
};

export default StockStatusItem;
