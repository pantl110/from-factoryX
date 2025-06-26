import { InventoryStatusColorMap } from "@/types/status-type";
import Chip from "@/ui/chip";

const ProductStockTableItem = () => {
  //   const color = InventoryStatusColorMap;

  return (
    <div className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1">
      <p className="flex-1 px-3 text-dg">2025-06-12</p>
      <p className="flex-1 px-3 text-dg">플라스틱 컵</p>
      <p className="flex-1 px-3 text-dg">P-100</p>
      <p className="w-[80px] px-3 text-dg">EA</p>
      <p className="flex-1 px-3 text-red">-200</p>
      <p className="flex-1 px-3 text-dg">4,800</p>
      <p className="flex-1 px-3 text-dg">
        <Chip
          text="충분"
          bgColor="bg-primary-8"
          textColor="text-primary"
          sm={true}
        />
      </p>
    </div>
  );
};

export default ProductStockTableItem;
