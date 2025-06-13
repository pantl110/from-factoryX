import React from "react";
import InformationItem from "./information-item";

const QuotationInfo = () => {
  return (
    <div className="flex flex-col gap-3">
      <div className="Heading-3">견적 품목 정보</div>

      <div className="px-4 py-3 bg-bg rounded-lg ">
        <div className="flex justify-between h-12 items-center">
          <div className="Me_body-1 text-sv">공급가액</div>
          <div className="Me_body-3 text-primary">500,000</div>
        </div>
        <div className="flex justify-between h-12 items-center">
          <div className="Me_body-1 text-sv">세액(VAT 10%)</div>
          <div className="Me_body-3 text-primary">500,000</div>
        </div>
        <div className="flex justify-between h-12 items-center">
          <div className="Me_body-1 text-sv">총액</div>
          <div className="Me_body-3 text-primary">500,000</div>
        </div>
      </div>

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
          <InformationItem key={index} />
        ))}
      </div>
    </div>
  );
};

export default QuotationInfo;
