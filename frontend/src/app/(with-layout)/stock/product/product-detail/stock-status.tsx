import React from "react";
import StockStatusItem from "./stock-status-item";

const StockStatus = () => {
  return (
    <div>
      <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
        <p className="flex-1 py-1 px-3 text-sv">자재명</p>
        <p className="flex-1 py-1 px-3 text-sv">자재 코드</p>
        <p className="flex-1 py-1 px-3 text-sv">투입 수량</p>
        <p className="w-[80px] py-1 px-3 text-sv">단위</p>
        <p className="flex-1 py-1 px-3 text-sv">재고 상태</p>
        <p className="flex-1 py-1 px-3 text-sv">입고 일자</p>
      </div>

      {[...Array(3)].map((_, index) => (
        <StockStatusItem key={index} />
      ))}
    </div>
  );
};

export default StockStatus;
