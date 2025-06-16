import React from "react";
import { StockLogType } from "../types";

interface ProductStockLogItemProps {
  date: string;
  status: StockLogType;
  amount: number;
  total: number;
}

const ProductStockLogItem = ({
  date,
  status,
  amount,
  total,
}: ProductStockLogItemProps) => {
  const getTypeColor = (type: StockLogType) => {
    switch (type) {
      case "생산":
        return "text-primary";
      case "납품 출고":
        return "text-red";
      default:
        return "text-dg";
    }
  };

  const getAmountDisplay = (type: StockLogType, amount: number) => {
    const sign = type === "생산" ? "+" : "-";
    return `${sign}${amount.toLocaleString()}`;
  };

  return (
    <div className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1 cursor-pointer">
      <p className="w-[150px] px-3 text-dg">{date}</p>
      <p className={`w-[150px] px-3 ${getTypeColor(status)}`}>{status}</p>
      <p className={`flex-1 px-3 ${getTypeColor(status)}`}>
        {getAmountDisplay(status, amount)}
      </p>
      <p className="flex-1 px-3 text-dg">{total.toLocaleString()}</p>
    </div>
  );
};

export default ProductStockLogItem;
