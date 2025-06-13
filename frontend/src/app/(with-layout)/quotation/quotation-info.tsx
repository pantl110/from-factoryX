import React from "react";
import ProductItem from "./product-item";
import PriceInfo from "@/ui/price-info";

const QuotationInfo = () => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3">견적 품목 정보</h3>
      <PriceInfo />
      <div>
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
          <p className=" py-1 px-3 flex-1">품목정보</p>
          <p className=" py-1 px-3 flex-1">품목 코드</p>
          <p className=" py-1 px-3 flex-1">규격</p>
          <p className=" py-1 px-3 w-[80px]">단위</p>
          <p className=" py-1 px-3 w-[100px]">단가</p>
          <p className=" py-1 px-3 flex-1">제작수량</p>
          <p className=" py-1 px-3 flex-1">금액</p>
        </div>
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductItem key={index} />
        ))}
      </div>
    </div>
  );
};

export default QuotationInfo;
