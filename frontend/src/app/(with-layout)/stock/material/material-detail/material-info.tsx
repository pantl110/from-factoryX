import InfoLabelValue from "@/ui/info-label-value";
import React from "react";

const MaterialInfo = () => {
  return (
    <div className="flex flex-col">
      <div className="flex">
        <InfoLabelValue label="자재명" value="플라스틱" />
        <InfoLabelValue label="자재 코드" value="123456" />
      </div>
      <div className="flex">
        <InfoLabelValue label="규격" value="500ml" />
        <InfoLabelValue label="단위" value="EA" />
      </div>
      <div className="flex">
        <InfoLabelValue label="현재 재고" value="5,000" />
        <InfoLabelValue label="최소 재고" value="2,000" />
      </div>
      <div className="flex">
        <InfoLabelValue label="재고 상태" value="2,500" />
        <InfoLabelValue label="입고 일자" value="2025-05-26" />
      </div>
      <InfoLabelValue label="창고 위치" value="A동 자재실 랙3번" />
    </div>
  );
};

export default MaterialInfo;
