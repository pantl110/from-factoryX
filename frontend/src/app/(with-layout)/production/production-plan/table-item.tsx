import Chip from "@/ui/chip";
import {
  OperationStatusColorMap,
  InventoryStatusColorMap,
} from "@/types/status-type";
import { ProductionPlanData } from "@/mocks/production-plan-data";
import { tableHeader } from "./types";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";

interface TableItemProps {
  item: ProductionPlanData;
}

const TableItem = ({ item }: TableItemProps) => {
  const { operationStatus, materialStatus } = item;
  const operationColor = OperationStatusColorMap[operationStatus];
  const materialColor = InventoryStatusColorMap[materialStatus];

  const itemData = {
    "가동 상태": (
      <Chip
        text={operationStatus}
        textColor={operationColor.textColor}
        bgColor={operationColor.bgColor}
      />
    ),
    품목명: item.productName,
    품목코드: item.productCode,
    규격: item.size,
    단위: item.unit,
    "주문 수량": item.orderQuantity.toLocaleString(),
    "생산 수량": item.productionQuantity.toLocaleString(),
    "생산 자재 상태": (
      <Chip
        text={materialStatus}
        textColor={materialColor.textColor}
        bgColor={materialColor.bgColor}
      />
    ),
    "생산 설비": (
      <div className="flex items-center gap-2.5 cursor-pointer">
        <p>{item.facility}</p>
        <CaretDown size={16} className="text-sv" />
      </div>
    ),
    생산일자: item.productionTime,
    "단위당 소요 시간": item.unitTime,
    "마감 예정일자": item.endDate,
  };

  return (
    <div className="flex items-center w-[1494px] h-12 border-b border-[#eeeeee] Me_Body-1 bg-white text-dg">
      {tableHeader.map((header) => (
        <div
          key={header.name}
          className={`${header.width} px-3 truncate`}
          title={String(itemData[header.name as keyof typeof itemData] ?? "")}
        >
          {itemData[header.name as keyof typeof itemData]}
        </div>
      ))}
    </div>
  );
};

export default TableItem;
