import Chip from "@/ui/chip";
import {
  OperationStatusColorMap,
  InventoryStatusColorMap,
} from "@/types/status-type";
import { ProductionPlanDataModel } from "@/mocks/production-plan-data";
import { tableHeader } from "./types";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import ProductDetail from "../../stock/product/product-detail";
import { productData } from "@/mocks/product-data";

interface TableItemProps {
  item: ProductionPlanDataModel;
  onOperationStatusClick: (e: React.MouseEvent) => void;
  onFacilityClick: (e: React.MouseEvent) => void;
}

const TableItem = ({
  item,
  onOperationStatusClick,
  onFacilityClick,
}: TableItemProps) => {
  const { operationStatus, materialStatus } = item;
  const operationColor = OperationStatusColorMap[operationStatus];
  const materialColor = InventoryStatusColorMap[materialStatus];
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);

  const itemData = {
    "가동 상태": (
      <Chip
        text={operationStatus}
        textColor={operationColor.textColor}
        bgColor={operationColor.bgColor}
        cursor="cursor-pointer"
        onClick={(e) => {
          if (e) {
            e.stopPropagation();
            onOperationStatusClick(e);
          }
        }}
      />
    ),
    품목명: item.productName,
    품목코드: item.productCode,
    규격: item.size,
    단위: item.unit,
    "주문 수량": item.orderQuantity.toLocaleString(),
    "생산 수량": item.productionQuantity.toLocaleString(),
    "생산 자재 상태": (
      <div className="flex gap-[27px]">
        <Chip
          text={materialStatus}
          textColor={
            operationStatus === "가동 완료"
              ? "text-sv"
              : materialColor.textColor
          }
          bgColor={
            operationStatus === "가동 완료" ? "bg-bg" : materialColor.bgColor
          }
        />
        <p
          className="cursor-pointer Re_Body-1 text-gr flex items-center opacity-0 hover:opacity-100 transition-opacity duration-200 ease-in-out"
          onClick={() => setIsProductDetailOpen(true)}
        >
          상세보기
        </p>
      </div>
    ),
    "생산 설비": (
      <div
        className={`flex items-center gap-2.5 ${
          operationStatus === "가동 완료" ? "" : "cursor-pointer"
        }`}
        onClick={(e) => {
          if (e && operationStatus !== "가동 완료") {
            e.stopPropagation();
            onFacilityClick(e);
          }
        }}
      >
        <p>{item.facility}</p>
        <CaretDown size={16} className="text-sv" />
      </div>
    ),
    생산일자: (
      <span className={operationStatus === "가동 중지" ? "text-red" : ""}>
        {item.productionTime}
      </span>
    ),
    "단위당 소요 시간": item.unitTime,
    "마감 예정일자": (
      <span className={operationStatus === "가동 중지" ? "text-red" : ""}>
        {item.endDate}
      </span>
    ),
  };

  return (
    <>
      <div
        className={`flex items-center w-[1494px] h-12 border-b border-[#eeeeee] Me_Body-1 bg-whit ${
          operationStatus === "가동 완료" ? "text-gr" : "text-dg"
        }`}
      >
        {tableHeader.map((header) => (
          <div
            key={header.name}
            className={`${header.width} px-3 truncate ${
              header.name === "가동 상태" ? "relative" : ""
            }`}
            title={String(itemData[header.name as keyof typeof itemData] ?? "")}
          >
            {itemData[header.name as keyof typeof itemData]}
          </div>
        ))}
      </div>

      {isProductDetailOpen && (
        <ProductDetail
          product={productData[0]}
          onClose={() => setIsProductDetailOpen(false)}
          mode="view"
        />
      )}
    </>
  );
};

export default TableItem;
