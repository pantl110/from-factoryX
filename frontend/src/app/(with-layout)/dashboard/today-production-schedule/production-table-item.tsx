import Chip from "@/ui/chip";
import {
  ProductionStatus,
  ProductionStatusColorMap,
} from "@/types/status-type";

export interface ProductionTableItemProps {
  status: ProductionStatus;
  productName: string;
  productCode: string;
  size: string;
  unit: string;
  quantity: number;
  machine: string;
  time: string;
}

const ProductionTableItem = ({
  status,
  productName,
  productCode,
  size,
  unit,
  quantity,
  machine,
  time,
}: ProductionTableItemProps) => {
  const colors = ProductionStatusColorMap[status];

  return (
    <div className="flex w-[1324px] h-14 items-center Me_Body-1 text-dg border-b border-[#eeeeee]">
      <div className="flex items-center py-1 px-3 w-[150px]">
        <Chip
          text={status}
          textColor={colors.textColor}
          bgColor={colors.bgColor}
        />
      </div>
      <p className="py-1 px-3 flex-2">{productName}</p>
      <p className="py-1 px-3 flex-2">{productCode}</p>
      <p className="py-1 px-3 flex-1">{size}</p>
      <p className="py-1 px-3 w-[80px]">{unit}</p>
      <p className="flex items-center py-1 px-3 flex-1">
        {quantity.toLocaleString()}
      </p>
      <p className="flex items-center py-1 px-3 flex-2">{machine}</p>
      <p className="py-1 px-3 w-[200px]">{time}</p>
    </div>
  );
};

export default ProductionTableItem;
